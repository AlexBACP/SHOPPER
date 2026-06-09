'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Store, Shield, Package,
  LogOut, User, ChevronDown, Menu, X, LayoutDashboard,
  Users, BarChart3, Sparkles, Search, Heart, Loader2,
} from 'lucide-react';
import { useAuthStore }      from '@/store/auth.store';
import { useCartStore }      from '@/store/cart.store';
import { useWishlistStore }  from '@/store/wishlist.store';
import { useClickOutside }   from '@/hooks/useClickOutside';
import { useHydrated }       from '@/hooks/useHydrated';
import { LogoIcon }          from '@/components/ui/LogoIcon';
import api from '@/lib/api';

// ── Tipos ─────────────────────────────────────────────────────────────
type Rol = 'super_admin' | 'admin' | 'owner' | 'buyer';

type Sugerencia = {
  _id:        string;
  title:      string;
  price:      number;
  images?:    string[];
  storeSlug?: string;
  storeName?: string;
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

// Cinta de confianza (marquee) sobre el header
const TRUST = [
  'Envío gratis en pedidos sobre $150.000',
  'Pagos 100% seguros · SSL 256-bit',
  '+1.200 tiendas verificadas en Colombia',
  'Acepta PSE · Nequi · Daviplata · Tarjetas',
  'Satisfacción garantizada o te devolvemos tu dinero',
];

// ── Helpers (fuera del componente para evitar recreación) ─────────────
function obtenerEnlaces(rol: Rol) {
  const inicio = [{ href: '/', label: 'Inicio', icono: Store }];
  if (rol === 'buyer') return [
    { href: '/dashboard', label: 'Panel',      icono: LayoutDashboard },
    { href: '/',          label: 'Tiendas',     icono: Store           },
    { href: '/orders',    label: 'Mis pedidos', icono: ShoppingBag     },
  ];
  if (rol === 'owner') return [
    ...inicio,
    { href: '/dashboard',       label: 'Panel',       icono: LayoutDashboard },
    { href: '/owner/stores',    label: 'Mis tiendas', icono: Store           },
    { href: '/owner/products',  label: 'Productos',   icono: Package         },
    { href: '/owner/orders',    label: 'Pedidos',     icono: ShoppingBag     },
    { href: '/owner/analytics', label: 'Analíticas',  icono: BarChart3       },
  ];
  if (rol === 'admin' || rol === 'super_admin') return [
    ...inicio,
    { href: '/dashboard',          label: 'Panel',    icono: LayoutDashboard },
    { href: '/admin/stores',       label: 'Tiendas',  icono: Store           },
    { href: '/admin/stores/users', label: 'Usuarios', icono: Users           },
  ];
  return inicio;
}

const ROL_INSIGNIA: Record<Rol, { etiqueta: string; clase: string }> = {
  super_admin: { etiqueta: 'Super Admin', clase: 'text-orange-700 bg-orange-50 border-orange-200' },
  admin:       { etiqueta: 'Admin',       clase: 'text-blue-700  bg-blue-50   border-blue-200'   },
  owner:       { etiqueta: 'Vendedor',    clase: 'text-[var(--selva)] bg-[var(--selva-soft)] border-[var(--selva)]/30' },
  buyer:       { etiqueta: 'Comprador',   clase: 'text-[var(--primary-2)] bg-[var(--accent-subtle)] border-[var(--accent-border)]' },
};

const NAV_PUBLICO = [
  { href: '/#tiendas',       label: 'Tiendas'    },
  { href: '/#categorias',    label: 'Categorías' },
  { href: '/#productos',     label: 'Novedades'  },
  { href: '/#vender',        label: 'Vender'     },
] as const;

// ── Cinta de confianza ────────────────────────────────────────────────
function Marquee() {
  const items = [...TRUST, ...TRUST];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {items.map((t, i) => (
          <span className="marquee-item" key={i}><span className="dot" />{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── Subcomponente: menú desplegable de usuario ────────────────────────
function MenuUsuario({ alCerrar }: { alCerrar: () => void }) {
  const { user, logout } = useAuthStore();
  if (!user) return null;

  const insignia = ROL_INSIGNIA[user.role as Rol];

  const cerrarSesion = async () => {
    try { await api.post('/auth/logout'); } catch { /* silenciar */ }
    logout();
    alCerrar();
    window.location.href = '/';
  };

  const opciones = [
    { href: '/dashboard/profile', icono: User,            etiq: 'Mi perfil'      },
    { href: '/dashboard',         icono: LayoutDashboard, etiq: 'Panel principal' },
    ...(user.role === 'owner' ? [{ href: '/owner/stores', icono: Store, etiq: 'Mis tiendas' }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-0 top-full mt-2 w-64 bg-[var(--bone-2)] border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-lg)] overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--bone-3)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-[var(--primary)] text-[var(--bone-2)]">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--ink)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--ink-soft)] truncate">{user.email}</p>
          </div>
        </div>
        <span className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${insignia.clase}`}>
          <Shield className="w-3 h-3" />
          {insignia.etiqueta}
        </span>
      </div>

      <div className="py-1">
        {opciones.map(({ href, icono: Icono, etiq }) => (
          <Link key={href} href={href} onClick={alCerrar}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--ink-soft)] hover:bg-[var(--bone-3)] hover:text-[var(--ink)] transition-colors">
            <Icono className="w-4 h-4" />
            {etiq}
          </Link>
        ))}
        <div className="h-px bg-[var(--line)] my-1" />
        <button onClick={cerrarSesion}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--danger)] hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </motion.div>
  );
}

// ── Navbar principal ──────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { count, openCart } = useCartStore();
  const wishCountRaw = useWishlistStore(s => s.count)();
  const hydrated = useHydrated();
  // Hasta que el cliente hidrate, mostramos 0 para no romper el SSR.
  const wishCount = hydrated ? wishCountRaw : 0;

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dropAbierto, setDropAbierto] = useState(false);
  const [desplazado,  setDesplazado]  = useState(false);
  const [busqueda,    setBusqueda]    = useState('');

  // ── Autocompletado de búsqueda ──────────────────────────────────────
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [sugAbierto,  setSugAbierto]  = useState(false);
  const [cargandoSug, setCargandoSug] = useState(false);
  const [resaltado,   setResaltado]   = useState(-1);

  const refDropdown = useRef<HTMLDivElement>(null);
  const refBusqueda = useRef<HTMLDivElement>(null);

  const cerrarDrop = useCallback(() => setDropAbierto(false), []);
  const cerrarSug  = useCallback(() => setSugAbierto(false), []);
  useClickOutside(refDropdown, cerrarDrop);
  useClickOutside(refBusqueda, cerrarSug);

  // Consulta productos mientras el usuario escribe (con debounce de 250 ms)
  useEffect(() => {
    const q = busqueda.trim();
    if (q.length < 2) { setSugerencias([]); setCargandoSug(false); setSugAbierto(false); return; }
    setCargandoSug(true);
    let activo = true;
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/products/search?q=${encodeURIComponent(q)}&limit=6`);
        if (!activo) return;
        setSugerencias(res.data?.resultados ?? []);
        setSugAbierto(true);
        setResaltado(-1);
      } catch {
        if (activo) setSugerencias([]);
      } finally {
        if (activo) setCargandoSug(false);
      }
    }, 250);
    return () => { activo = false; clearTimeout(t); };
  }, [busqueda]);

  useEffect(() => {
    const fn = () => setDesplazado(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  if (pathname.startsWith('/auth')) return null;

  const enlaces      = user ? obtenerEnlaces(user.role as Rol) : [];
  const totalCarrito = hydrated ? count() : 0;

  const irABuscar = () => {
    const q = busqueda.trim();
    setSugAbierto(false);
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  const irAProducto = (s: Sugerencia) => {
    setSugAbierto(false);
    if (s.storeSlug) window.location.href = `/store/${s.storeSlug}/product/${s._id}`;
  };

  // Navegación por teclado en las sugerencias
  const onKeyBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (sugAbierto && sugerencias.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setResaltado(i => Math.min(i + 1, sugerencias.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setResaltado(i => Math.max(i - 1, -1)); return; }
      if (e.key === 'Escape')    { setSugAbierto(false); return; }
      if (e.key === 'Enter') {
        if (resaltado >= 0) { e.preventDefault(); irAProducto(sugerencias[resaltado]); return; }
      }
    }
    if (e.key === 'Enter') irABuscar();
  };

  return (
    <>
      {/* Cinta de confianza — scrollea con la página */}
      <Marquee />

      {/* Header sticky */}
      <header className={`sticky top-0 z-40 border-b transition-[background,box-shadow,border-color] duration-300 ${
        desplazado
          ? 'bg-[rgba(243,237,226,0.86)] backdrop-blur-[14px] border-[var(--line)] shadow-[0_6px_24px_rgba(40,30,18,0.06)]'
          : 'bg-transparent border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center gap-3 lg:gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="w-9 h-9 bg-[var(--primary)] rounded-[10px] grid place-items-center shadow-[var(--shadow-sm)] group-hover:scale-105 transition-transform duration-200">
              <LogoIcon />
            </span>
            <span className="text-[22px] font-extrabold tracking-tight text-[var(--ink)] hidden sm:block"
              style={{ fontFamily: 'var(--font-display)' }}>Shopper</span>
          </Link>

          {/* Nav links inline - desktop large */}
          <div className="hidden lg:flex items-center gap-7 ml-2">
            {!user
              ? NAV_PUBLICO.map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="relative group py-1 text-[15px] font-medium text-[var(--ink)] whitespace-nowrap">
                    {label}
                    <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-[var(--primary)] transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))
              : enlaces.slice(0, 4).map(({ href, label, icono: Icono }) => {
                  const activo = pathname === href || (href !== '/' && pathname.startsWith(href));
                  return (
                    <Link key={href} href={href}
                      className="relative group flex items-center gap-1.5 py-1 text-[15px] font-medium text-[var(--ink)] whitespace-nowrap">
                      <Icono className="w-4 h-4" />
                      {label}
                      <span className={`absolute left-0 -bottom-0.5 h-0.5 bg-[var(--primary)] transition-all duration-300 ${activo ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                    </Link>
                  );
                })}
          </div>

          {/* Búsqueda - píldora */}
          <div ref={refBusqueda} className="flex-1 max-w-md xl:max-w-lg relative ml-auto">
            <div className="relative flex items-center gap-2.5 bg-[var(--bone-2)] border-[1.5px] border-[var(--line)] rounded-full px-4 py-2.5 focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_4px_rgba(199,90,43,0.12)] transition-all">
              <Search className="w-[18px] h-[18px] text-[var(--ink-soft)] shrink-0" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={onKeyBusqueda}
                onFocus={() => { if (sugerencias.length > 0) setSugAbierto(true); }}
                placeholder="Busca productos, tiendas, marcas…"
                autoComplete="off"
                className="flex-1 bg-transparent outline-none text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]"
              />
            </div>

            {/* Sugerencias dropdown */}
            <AnimatePresence>
              {sugAbierto && busqueda.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 right-0 top-full mt-2 bg-[var(--bone-2)] border border-[var(--line)] rounded-[var(--r-lg)] shadow-[var(--shadow-lg)] overflow-hidden z-50"
                >
                  {cargandoSug && sugerencias.length === 0 ? (
                    <div className="flex items-center gap-2 px-4 py-4 text-sm text-[var(--ink-soft)]">
                      <Loader2 className="w-4 h-4 animate-spin" /> Buscando…
                    </div>
                  ) : sugerencias.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-[var(--ink-soft)]">
                      Sin coincidencias para “{busqueda.trim()}”
                    </div>
                  ) : (
                    <>
                      <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">Productos</p>
                      {sugerencias.map((s, i) => (
                        <button
                          key={s._id}
                          type="button"
                          onMouseEnter={() => setResaltado(i)}
                          onClick={() => irAProducto(s)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                            resaltado === i ? 'bg-[var(--bone-3)]' : 'hover:bg-[var(--bone-3)]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-[var(--bone-3)] border border-[var(--line)] overflow-hidden shrink-0 flex items-center justify-center">
                            {s.images?.[0]
                              ? <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-[var(--ink-soft)]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--ink)] truncate">{s.title}</p>
                            {s.storeName && <p className="text-[11px] text-[var(--ink-soft)] truncate">{s.storeName}</p>}
                          </div>
                          <span className="text-sm font-bold text-[var(--ink)] shrink-0">{fmtCOP(s.price)}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={irABuscar}
                        className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-[var(--line)] text-sm font-semibold text-[var(--primary-2)] hover:bg-[var(--bone-3)] transition-colors">
                        <Search className="w-3.5 h-3.5" />
                        Ver todos los resultados de “{busqueda.trim()}”
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Wishlist */}
            <Link href="/wishlist"
              className="relative hidden sm:grid place-items-center w-11 h-11 text-[var(--ink)] hover:bg-[var(--bone-3)] rounded-full transition-colors"
              title="Lista de deseos">
              <Heart className="w-5 h-5" />
              {wishCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[var(--primary)] text-[var(--bone-2)] text-[11px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {wishCount > 9 ? '9+' : wishCount}
                </span>
              )}
            </Link>

            {/* Carrito */}
            <button onClick={openCart}
              className="relative grid place-items-center w-11 h-11 text-[var(--ink)] hover:bg-[var(--bone-3)] rounded-full transition-colors"
              title="Ver carrito">
              <ShoppingBag className="w-5 h-5" strokeWidth={2} />
              <AnimatePresence>
                {totalCarrito > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[var(--primary)] text-[var(--bone-2)] text-[11px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
                  >
                    {totalCarrito > 9 ? '9+' : totalCarrito}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Usuario / Login */}
            {user ? (
              <div className="relative ml-1" ref={refDropdown}>
                <button onClick={() => setDropAbierto(v => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full text-[var(--ink)] hover:bg-[var(--bone-3)] transition-all"
                  title={user.name}>
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-xs font-black text-[var(--bone-2)] shadow-[var(--shadow-sm)]">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="text-sm font-semibold hidden lg:block max-w-[110px] truncate">{user.name?.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--ink-soft)] transition-transform duration-150 ${dropAbierto ? 'rotate-180' : ''} hidden md:block`} />
                </button>
                <AnimatePresence>
                  {dropAbierto && <MenuUsuario alCerrar={() => setDropAbierto(false)} />}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth/login" className="btn btn-primary hidden sm:inline-flex ml-1" style={{ padding: '11px 22px' }}>
                Ingresar
              </Link>
            )}

            {/* Hamburguesa */}
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className="lg:hidden w-11 h-11 grid place-items-center text-[var(--ink)] hover:bg-[var(--bone-3)] rounded-full transition-all">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={menuAbierto ? 'x' : 'menu'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Drawer móvil */}
        <AnimatePresence>
          {menuAbierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden bg-[var(--bone-2)] border-t border-[var(--line)] overflow-hidden"
            >
              <div className="px-4 py-3 flex flex-col gap-1.5 max-h-[calc(100vh-4rem)] overflow-y-auto">

                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-3 mb-1 bg-[var(--bone-3)] rounded-2xl border border-[var(--line)]">
                      <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-sm font-black text-[var(--bone-2)] shrink-0">
                        {user.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">{user.name}</p>
                        <p className="text-xs text-[var(--ink-soft)] truncate">{user.email}</p>
                      </div>
                    </div>
                    {enlaces.map(enlace => (
                      <Link key={enlace.href} href={enlace.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          pathname === enlace.href
                            ? 'bg-[var(--accent-subtle)] text-[var(--primary-2)] font-semibold'
                            : 'text-[var(--ink)] hover:bg-[var(--bone-3)]'
                        }`}>
                        <enlace.icono className="w-4 h-4" />
                        {enlace.label}
                      </Link>
                    ))}
                    <Link href="/wishlist"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] hover:bg-[var(--bone-3)] transition-colors sm:hidden">
                      <Heart className="w-4 h-4" />
                      Lista de deseos
                      {wishCount > 0 && <span className="ml-auto text-[10px] bg-[var(--primary)] text-[var(--bone-2)] px-1.5 py-0.5 rounded-full font-bold">{wishCount}</span>}
                    </Link>
                    <div className="h-px bg-[var(--line)] my-1" />
                    <button
                      onClick={async () => {
                        try { await api.post('/auth/logout'); } catch { /* */ }
                        logout();
                        setMenuAbierto(false);
                        window.location.href = '/';
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--danger)] hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    {NAV_PUBLICO.map(({ href, label }) => (
                      <Link key={href} href={href}
                        className="flex items-center px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] hover:bg-[var(--bone-3)] transition-colors">
                        {label}
                      </Link>
                    ))}
                    <Link href="/wishlist"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--ink)] hover:bg-[var(--bone-3)] transition-colors sm:hidden">
                      <Heart className="w-4 h-4" />
                      Lista de deseos
                    </Link>
                    <div className="h-px bg-[var(--line)] my-1" />
                    <Link href="/auth/login"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm border-[1.5px] border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bone-2)] font-semibold transition-all">
                      <User className="w-4 h-4" />
                      Iniciar sesión
                    </Link>
                    <Link href="/auth/register"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm bg-[var(--primary)] hover:bg-[var(--primary-2)] text-[var(--bone-2)] font-bold transition-all">
                      <Sparkles className="w-4 h-4" />
                      Comenzar gratis
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
