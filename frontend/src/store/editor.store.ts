// ─────────────────────────────────────────────────────────────
//  Estado del editor visual de tienda (Zustand).
//   - current: el theme que se está editando (fuente del preview).
//   - history/future: pilas para undo/redo.
//   - dirty: hay cambios sin guardar.
//  Regla: toda mutación que cambie `current` empuja el anterior a
//  `history` y limpia `future` (undo/redo natural).
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { StoreSection, SectionType, StoreTheme } from '@/types';
import { SECTION_DEFAULTS } from '@/lib/store-sections';
import api from '@/lib/api';

const HISTORY_LIMIT = 50;

function makeSection(type: SectionType): StoreSection {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    type,
    enabled: true,
    settings: { ...SECTION_DEFAULTS[type] },
  } as StoreSection;
}

interface EditorState {
  storeId:           string;
  initial:           StoreTheme;
  current:           StoreTheme;
  selectedSectionId: string | null;
  device:            'mobile' | 'desktop';
  history:           StoreTheme[];
  future:            StoreTheme[];
  dirty:             boolean;
  saving:            boolean;
  /** Se restauró un borrador desde localStorage de una sesión anterior. */
  hasDraft:          boolean;

  init:           (storeId: string, theme: StoreTheme, fallbackSections: StoreSection[]) => void;
  selectSection:  (id: string | null) => void;
  setDevice:      (d: 'mobile' | 'desktop') => void;
  addSection:     (type: SectionType, index?: number) => void;
  removeSection:  (id: string) => void;
  setOrder:       (sections: StoreSection[]) => void;
  toggleSection:  (id: string) => void;
  updateSettings: (id: string, patch: Record<string, unknown>) => void;
  updateThemeMeta:(patch: Partial<StoreTheme>) => void;
  applyTemplate:  (sections: StoreSection[]) => void;
  discardDraft:   () => void;
  undo:           () => void;
  redo:           () => void;
  save:           () => Promise<void>;
  // Versiones y vista previa compartible (Fase 5)
  loadSnapshots:   () => Promise<ThemeSnapshot[]>;
  restoreSnapshot: (snapId: string) => Promise<void>;
  createPreview:   () => Promise<string>;
}

export interface ThemeSnapshot {
  id:         string;
  label:      string | null;
  created_at: string;
}

const draftKey = (storeId: string) => `editor-draft-${storeId}`;

function readDraft(storeId: string): StoreTheme | null {
  if (typeof window === 'undefined') return null;
  try { const raw = localStorage.getItem(draftKey(storeId)); return raw ? JSON.parse(raw) as StoreTheme : null; }
  catch { return null; }
}

export const useEditorStore = create<EditorState>((set, get) => {
  // Persiste el theme en edición como borrador (sobrevive reloads).
  const persist = (theme: StoreTheme) => {
    if (typeof window === 'undefined') return;
    const { storeId } = get();
    if (!storeId) return;
    try { localStorage.setItem(draftKey(storeId), JSON.stringify(theme)); } catch { /* cuota llena → ignorar */ }
  };
  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(draftKey(get().storeId)); } catch { /* noop */ }
  };

  // Aplica un cambio a `current` registrando historial + borrador.
  const commit = (next: StoreTheme, extra: Partial<EditorState> = {}) => {
    const { current, history } = get();
    set({
      history: [...history, current].slice(-HISTORY_LIMIT),
      future:  [],
      current: next,
      dirty:   true,
      hasDraft: true,
      ...extra,
    });
    persist(next);
  };

  const sections = () => get().current.sections ?? [];

  return {
    storeId: '',
    initial: {},
    current: {},
    selectedSectionId: null,
    device: 'desktop',
    history: [],
    future: [],
    dirty: false,
    saving: false,
    hasDraft: false,

    init: (storeId, theme, fallbackSections) => {
      const base: StoreTheme =
        theme.version === 2 && theme.sections?.length
          ? theme
          : { ...theme, version: 2, sections: fallbackSections };

      // Si hay un borrador previo distinto al guardado, restaurarlo.
      const draft = readDraft(storeId);
      const restore = draft && JSON.stringify(draft) !== JSON.stringify(base);

      set({
        storeId, initial: base,
        current: restore ? draft! : base,
        selectedSectionId: null, device: 'desktop',
        history: [], future: [],
        dirty: !!restore, saving: false, hasDraft: !!restore,
      });
    },

    selectSection: (id) => set({ selectedSectionId: id }),
    setDevice:     (d)  => set({ device: d }),

    addSection: (type, index) => {
      const arr = [...sections()];
      const section = makeSection(type);
      arr.splice(index ?? arr.length, 0, section);
      commit({ ...get().current, version: 2, sections: arr }, { selectedSectionId: section.id });
    },

    removeSection: (id) => {
      const arr = sections().filter(s => s.id !== id);
      commit({ ...get().current, sections: arr },
        get().selectedSectionId === id ? { selectedSectionId: null } : {});
    },

    setOrder: (next) => commit({ ...get().current, sections: next }),

    toggleSection: (id) => {
      const arr = sections().map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
      commit({ ...get().current, sections: arr });
    },

    updateSettings: (id, patch) => {
      const arr = sections().map(s =>
        s.id === id ? ({ ...s, settings: { ...s.settings, ...patch } } as StoreSection) : s,
      );
      commit({ ...get().current, sections: arr });
    },

    updateThemeMeta: (patch) => commit({ ...get().current, ...patch }),

    applyTemplate: (next) => commit({ ...get().current, version: 2, sections: next }, { selectedSectionId: null }),

    discardDraft: () => {
      clearDraft();
      set(state => ({
        current: state.initial, dirty: false, hasDraft: false,
        history: [], future: [], selectedSectionId: null,
      }));
    },

    undo: () => {
      const { history, current, future } = get();
      if (!history.length) return;
      const prev = history[history.length - 1];
      set({
        current: prev,
        history: history.slice(0, -1),
        future:  [current, ...future],
        dirty:   true, hasDraft: true,
      });
      persist(prev);
    },

    redo: () => {
      const { future, current, history } = get();
      if (!future.length) return;
      const next = future[0];
      set({
        current: next,
        future:  future.slice(1),
        history: [...history, current],
        dirty:   true, hasDraft: true,
      });
      persist(next);
    },

    save: async () => {
      set({ saving: true });
      try {
        const theme = get().current;
        await api.patch(`/stores/${get().storeId}`, { theme });
        // Cada guardado crea una versión (best-effort, no bloquea el guardado).
        api.post(`/stores/${get().storeId}/theme/snapshots`, {
          theme,
          label: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
        }).catch(() => null);
        clearDraft();
        set({ initial: theme, dirty: false, saving: false, hasDraft: false });
      } catch (e) {
        set({ saving: false });
        throw e;
      }
    },

    loadSnapshots: async () => {
      const { data } = await api.get(`/stores/${get().storeId}/theme/snapshots`);
      return data as ThemeSnapshot[];
    },

    restoreSnapshot: async (snapId) => {
      const { data } = await api.post(`/stores/${get().storeId}/theme/snapshots/${snapId}/restore`);
      const theme = (data.theme ?? {}) as StoreTheme;
      clearDraft();
      set({
        initial: theme, current: theme, dirty: false, hasDraft: false,
        history: [], future: [], selectedSectionId: null,
      });
    },

    createPreview: async () => {
      const { data } = await api.post(`/stores/${get().storeId}/theme/preview`, { theme: get().current });
      return data.token as string;
    },
  };
});
