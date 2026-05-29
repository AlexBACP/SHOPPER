'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, ShoppingCart, Store, Shield, Package,
  LogOut, User, ChevronDown, Menu, X, LayoutDashboard,
  Users, BarChart3, Sparkles, Search, Heart, Loader2,
} from 'lucide-react';
import { useAuthStore }      from '@/store/auth.store';
import { useCartStore }      from '@/store/cart.store';
import { useWishlistStore }  from '@/store/wishlist.store';
import { useClickOutside }   from '@/hooks/useClickOutside';
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
  super_admin: { etiqueta: 'Super Admin', clase: 'text-orange-600 bg-orange-50 border-orange-200' },
  admin:       { etiqueta: 'Admin',       clase: 'text-blue-600  bg-blue-50   border-blue-200'   },
  owner:       { etiqueta: 'Vendedor',    clase: 'text-teal-600  bg-teal-50   border-teal-200'   },
  buyer:       { etiqueta: 'Comprador',   clase: 'text-green-600 bg-green-50  border-green-200'  },
};

const NAV_PUBLICO = [
  { href: '/#tiendas',       label: 'Tiendas'       },
  { href: '/#como-funciona', label: 'Cómo funciona' },
  { href: '/search',         label: 'Novedades'     },
  { href: '/auth/register',  label: 'Vender'        },
] as const;

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
      className="absolute right-0 top-full mt-2 w-64 bg-white border border-[var(--border)] rounded-lg shadow-[0_8px_32px_rgba(15,17,17,0.18)] overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-[var(--accent)] text-white">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
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
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors">
            <Icono className="w-4 h-4" />
            {etiq}
          </Link>
        ))}
        <div className="h-px bg-[var(--border)] my-1" />
        <button onClick={cerrarSesion}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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
  const wishCount = useWishlistStore(s => s.count)();

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
    const fn = () => setDesplazado(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  if (pathname.startsWith('/auth')) return null;

  const enlaces      = user ? obtenerEnlaces(user.role as Rol) : [];
  const totalCarrito = count();

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
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        desplazado
          ? 'bg-[var(--nav-bg)]/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/[0.06]'
          : 'bg-[var(--nav-bg)] border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center gap-2 sm:gap-3 lg:gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/40 group-hover:shadow-orange-500/60 group-hover:scale-105 transition-all duration-200">
              <LogoIcon />
            </div>
            <span className="font-black text-lg text-white tracking-tight hidden sm:block">Shopper</span>
          </Link>

          {/* Nav links inline - desktop large */}
          <div className="hidden lg:flex items-center gap-0.5 ml-1">
            {!user
              ? NAV_PUBLICO.map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="px-3 py-1.5 text-sm font-medium text-white/75 hover:text-white hover:bg-white/[0.08] rounded-full transition-all whitespace-nowrap">
                    {label}
                  </Link>
                ))
              : enlaces.slice(0, 4).map(({ href, label, icono: Icono }) => {
                  const activo = pathname === href || (href !== '/' && pathname.startsWith(href));
                  return (
                    <Link key={href} href={href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                        activo
                          ? 'bg-white/[0.12] text-white'
                          : 'text-white/75 hover:text-white hover:bg-white/[0.08]'
                      }`}>
                      <Icono className="w-3.5 h-3.5" />
                      {label}
                    </Link>
                  );
                })}
          </div>

          {/* Búsqueda - píldora */}
          <div ref={refBusqueda} className="flex-1 max-w-md xl:max-w-lg relative">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[var(--accent)] transition-colors pointer-events-none z-10" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={onKeyBusqueda}
                onFocus={() => { if (sugerencias.length > 0) setSugAbierto(true); }}
                placeholder="Buscar productos..."
                autoComplete="off"
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white text-white focus:text-[var(--text-primary)] placeholder:text-white/40 focus:placeholder:text-[var(--text-muted)] rounded-full border border-white/10 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 outline-none transition-all"
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
                  className="absolute left-0 right-0 top-full mt-2 bg-white border border-[var(--border)] rounded-2xl shadow-[0_12px_40px_rgba(15,17,17,0.20)] overflow-hidden z-50"
                >
                  {cargandoSug && sugerencias.length === 0 ? (
                    <div className="flex items-center gap-2 px-4 py-4 text-sm text-[var(--text-muted)]">
                      <Loader2 className="w-4 h-4 animate-spin" /> Buscando…
                    </div>
                  ) : sugerencias.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-[var(--text-muted)]">
                      Sin coincidencias para “{busqueda.trim()}”
                    </div>
                  ) : (
                    <>
                      <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Productos</p>
                      {sugerencias.map((s, i) => (
                        <button
                          key={s._id}
                          type="button"
                          onMouseEnter={() => setResaltado(i)}
                          onClick={() => irAProducto(s)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                            resaltado === i ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                            {s.images?.[0]
                              ? <img src={s.images[0]} alt={s.title} className="w-full h-full object-contain p-1" />
                              : <Package className="w-4 h-4 text-[var(--text-muted)]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.title}</p>
                            {s.storeName && <p className="text-[11px] text-[var(--text-muted)] truncate">{s.storeName}</p>}
                          </div>
                          <span className="text-sm font-bold text-[var(--text-primary)] shrink-0">{fmtCOP(s.price)}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={irABuscar}
                        className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-[var(--border)] text-sm font-semibold text-[var(--accent-dark)] hover:bg-orange-50 transition-colors">
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
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">

            {/* Wishlist */}
            <Link href="/wishlist"
              className="relative hidden sm:flex items-center justify-center w-10 h-10 text-white/80 hover:text-white hover:bg-white/[0.10] rounded-full transition-all"
              title="Lista de deseos">
              <Heart className="w-5 h-5" />
              {wishCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none ring-2 ring-[var(--nav-bg)]">
                  {wishCount > 9 ? '9+' : wishCount}
                </span>
              )}
            </Link>

            {/* Carrito */}
            <button onClick={openCart}
              className="relative flex items-center justify-center w-10 h-10 text-white/80 hover:text-white hover:bg-white/[0.10] rounded-full transition-all"
              title="Ver carrito">
              <ShoppingCart className="w-5 h-5" strokeWidth={2} />
              <AnimatePresence>
                {totalCarrito > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-[var(--accent)] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none ring-2 ring-[var(--nav-bg)]"
                  >
                    {totalCarrito > 9 ? '9+' : totalCarrito}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Divisor */}
            <div className="hidden md:block w-px h-6 bg-white/[0.10] mx-1.5" />

            {/* Usuario / Login */}
            {user ? (
              <div className="relative" ref={refDropdown}>
                <button onClick={() => setDropAbierto(v => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full text-white hover:bg-white/[0.10] transition-all"
                  title={user.name}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-orange-500/40">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="text-sm font-semibold hidden lg:block max-w-[110px] truncate">{user.name?.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-150 ${dropAbierto ? 'rotate-180' : ''} hidden md:block`} />
                </button>
                <AnimatePresence>
                  {dropAbierto && <MenuUsuario alCerrar={() => setDropAbierto(false)} />}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all hover:shadow-lg hover:shadow-orange-500/40">
                Ingresar
              </Link>
            )}

            {/* Hamburguesa */}
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-white/[0.10] rounded-full transition-all">
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
              className="lg:hidden bg-[var(--nav-bg)] border-t border-white/[0.06] overflow-hidden"
            >
              <div className="px-3 sm:px-4 py-3 flex flex-col gap-1.5 max-h-[calc(100vh-4rem)] overflow-y-auto">

                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-3 mb-1 bg-white/[0.06] rounded-2xl border border-white/[0.08]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-sm font-black text-white shrink-0 shadow-md shadow-orange-500/30">
                        {user.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-white/50 truncate">{user.email}</p>
                      </div>
                    </div>
                    {enlaces.map(enlace => (
                      <Link key={enlace.href} href={enlace.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          pathname === enlace.href
                            ? 'bg-[var(--accent)]/15 text-[var(--accent-bright)] font-semibold'
                            : 'text-white/80 hover:bg-white/[0.06]'
                        }`}>
                        <enlace.icono className="w-4 h-4" />
                        {enlace.label}
                      </Link>
                    ))}
                    <Link href="/wishlist"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:bg-white/[0.06] transition-colors sm:hidden">
                      <Heart className="w-4 h-4" />
                      Lista de deseos
                      {wishCount > 0 && <span className="ml-auto text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">{wishCount}</span>}
                    </Link>
                    <div className="h-px bg-white/[0.08] my-1" />
                    <button
                      onClick={async () => {
                        try { await api.post('/auth/logout'); } catch { /* */ }
                        logout();
                        setMenuAbierto(false);
                        window.location.href = '/';
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    {NAV_PUBLICO.map(({ href, label }) => (
                      <Link key={href} href={href}
                        className="flex items-center px-3 py-2.5 rounded-xl text-sm text-white/80 hover:bg-white/[0.06] transition-colors">
                        {label}
                      </Link>
                    ))}
                    <Link href="/wishlist"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:bg-white/[0.06] transition-colors sm:hidden">
                      <Heart className="w-4 h-4" />
                      Lista de deseos
                    </Link>
                    <div className="h-px bg-white/[0.08] my-1" />
                    <Link href="/auth/login"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-white/[0.06] hover:bg-white/[0.10] text-white font-semibold transition-all">
                      <User className="w-4 h-4" />
                      Iniciar sesión
                    </Link>
                    <Link href="/auth/register"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-all">
                      <Sparkles className="w-4 h-4" />
                      Comenzar gratis
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Espaciador para nav fijo */}
      <div className="h-16" />
    </>
  );
}
