'use client';
// Inputs reutilizables del editor. Todos con <label htmlFor> real.
import { useId } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';

const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-1.5';
const inputCls = 'w-full px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-[var(--bone)] text-[var(--ink)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all';

export function TextField({ label, value, onChange, placeholder, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <input id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className={inputCls} />
    </div>
  );
}

export function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <textarea id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={`${inputCls} resize-none`} />
    </div>
  );
}

export function ToggleField({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-3 cursor-pointer py-1">
      <span className="text-sm text-[var(--ink)]">{label}</span>
      <button id={id} type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-[var(--primary)]' : 'bg-[var(--surface-4)]'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );
}

export function SelectField<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <select id={id} value={String(value)} onChange={e => {
        const raw = e.target.value;
        const match = options.find(o => String(o.value) === raw);
        if (match) onChange(match.value);
      }} className={inputCls}>
        {options.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function RangeField({ label, value, onChange, min = 0, max = 1, step = 0.05 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label} · {Math.round(value * 100) / 100}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
    </div>
  );
}

const ACCENTS = ['#c75a2b', '#2f5d4f', '#8a2f3f', '#2f4f7a', '#b8862f', '#6a3f7a', '#1f1a14'];

export function ColorField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {ACCENTS.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)} aria-label={`Color ${c}`}
            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${value === c ? 'ring-2 ring-offset-2 ring-offset-[var(--bone-2)] ring-[var(--ink)]' : ''}`}
            style={{ background: c }} />
        ))}
        <label className="w-7 h-7 rounded-full border border-dashed border-[var(--line)] grid place-items-center cursor-pointer overflow-hidden relative" title="Color personalizado">
          <input type="color" value={value.startsWith('#') ? value : '#c75a2b'} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
          <span className="w-3 h-3 rounded-full" style={{ background: value }} />
        </label>
      </div>
    </div>
  );
}

export function ImageField({ label, value, onChange, folder = 'stores' }: {
  label: string; value: string; onChange: (v: string) => void; folder?: 'stores' | 'products' | 'reviews';
}) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <ImageUploader folder={folder} label="" value={value} onChange={onChange} />
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-[11px] text-[var(--primary)] hover:underline mt-1">
          Quitar imagen
        </button>
      )}
    </div>
  );
}
