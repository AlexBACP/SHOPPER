'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, ShoppingCart, Store, Shield, Package,
  LogOut, User, ChevronDown, Menu, X, LayoutDashboard,
  Users, BarChart3, Sparkles, Search, MapPin, Heart,
} from 'lucide-react';
import { useAuthStore }      from '@/store/auth.store';
import { useCartStore }      from '@/store/cart.store';
import { useWishlistStore }  from '@/store/wishlist.store';
import { useClickOutside }   from '@/hooks/useClickOutside';
import { LogoIcon }          from '@/components/ui/LogoIcon';
import { CATEGORIES }        from '@/config/navigation';
import api from '@/lib/api';

// ── Tipos ─────────────────────────────────────────────────────────────
type Rol = 'super_admin' | 'admin' | 'owner' | 'buyer';

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
  const [catAbiertas, setCatAbiertas] = useState(false);
  const [desplazado,  setDesplazado]  = useState(false);
  const [busqueda,    setBusqueda]    = useState('');

  const refDropdown   = useRef<HTMLDivElement>(null);
  const refCategorias = useRef<HTMLDivElement>(null);

  const cerrarDrop = useCallback(() => setDropAbierto(false),  []);
  const cerrarCat  = useCallback(() => setCatAbiertas(false), []);
  useClickOutside(refDropdown,   cerrarDrop);
  useClickOutside(refCategorias, cerrarCat);

  useEffect(() => {
    const fn = () => setDesplazado(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
    setCatAbiertas(false);
  }, [pathname]);

  if (pathname.startsWith('/auth')) return null;

  const enlaces      = user ? obtenerEnlaces(user.role as Rol) : [];
  const totalCarrito = count();

  const irABuscar = () => {
    const q = busqueda.trim();
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-shadow duration-200 ${desplazado ? 'shadow-[var(--shadow-nav)]' : ''}`}>

        {/* Capa 1: barra principal oscura */}
        <div className="bg-[var(--nav-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group mr-2">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all">
                <LogoIcon />
              </div>
              <span className="font-black text-lg text-white tracking-tight hidden sm:block">
                Shopper
              </span>
            </Link>

            {/* Ubicación */}
            <button className="hidden lg:flex items-center gap-1 text-white/70 hover:text-white transition-colors shrink-0 group py-1 px-2 rounded hover:bg-white/10">
              <MapPin className="w-3.5 h-3.5 group-hover:text-[var(--accent)] transition-colors" />
              <div className="text-left leading-tight">
                <p className="text-[10px] text-white/60">Enviar a</p>
                <p className="text-xs font-bold text-white">Colombia</p>
              </div>
            </button>

            {/* Búsqueda */}
            <div className="flex-1 flex items-center max-w-2xl">
              <div className="flex w-full rounded-md overflow-hidden border-2 border-[var(--accent)] focus-within:border-[var(--accent-bright)] transition-colors">
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && irABuscar()}
                  placeholder="Buscar productos y tiendas..."
                  className="flex-1 px-4 py-2 text-sm text-[var(--text-primary)] bg-white outline-none placeholder:text-[var(--text-muted)]"
                />
                <button onClick={irABuscar} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 flex items-center justify-center transition-colors">
                  <Search className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Acciones derechas */}
            <div className="flex items-center gap-1 shrink-0 ml-1">

              {/* Usuario */}
              {user ? (
                <div className="relative hidden md:block" ref={refDropdown}>
                  <button
                    onClick={() => setDropAbierto(v => !v)}
                    className="flex flex-col items-start px-2 py-1 rounded text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="text-[10px] text-white/70">Hola, {user.name?.split(' ')[0]}</span>
                    <span className="text-xs font-bold flex items-center gap-0.5">
                      Cuenta y Listas
                      <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${dropAbierto ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  <AnimatePresence>
                    {dropAbierto && <MenuUsuario alCerrar={() => setDropAbierto(false)} />}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth/login"
                  className="hidden md:flex flex-col items-start px-2 py-1 rounded text-white hover:bg-white/10 transition-colors">
                  <span className="text-[10px] text-white/70">Hola, Identifícate</span>
                  <span className="text-xs font-bold">Cuenta y Listas</span>
                </Link>
              )}

              {/* Pedidos */}
              {user && (
                <Link href="/orders"
                  className="hidden md:flex flex-col items-start px-2 py-1 rounded text-white hover:bg-white/10 transition-colors">
                  <span className="text-[10px] text-white/70">Devoluciones</span>
                  <span className="text-xs font-bold">y pedidos</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link href="/wishlist"
                className="relative hidden md:flex items-center justify-center w-9 h-9 text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Lista de deseos">
                <Heart className="w-5 h-5" />
                {wishCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
                    {wishCount > 9 ? '9+' : wishCount}
                  </span>
                )}
              </Link>

              {/* Carrito */}
              <button onClick={openCart}
                className="flex items-end gap-1 px-2 py-1 rounded text-white hover:bg-white/10 transition-colors"
                title="Ver carrito">
                <div className="relative">
                  <ShoppingCart className="w-7 h-7" strokeWidth={1.5} />
                  <AnimatePresence>
                    {totalCarrito > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--accent)] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5"
                      >
                        {totalCarrito > 9 ? '9+' : totalCarrito}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-xs font-bold pb-0.5 hidden sm:block">Carrito</span>
              </button>

              {/* Hamburguesa móvil */}
              <button
                onClick={() => setMenuAbierto(v => !v)}
                className="md:hidden w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
              >
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
        </div>

        {/* Capa 2: barra de categorías */}
        <div className="bg-[var(--nav-sub-bg)] hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center gap-0.5">

            {/* Dropdown Todo */}
            <div ref={refCategorias} className="relative h-full">
              <button
                onClick={() => setCatAbiertas(v => !v)}
                className={`flex items-center gap-1.5 px-3 h-full text-white text-xs font-bold transition-colors border rounded whitespace-nowrap ${
                  catAbiertas ? 'bg-white/15 border-white/40' : 'hover:bg-white/10 border-transparent hover:border-white/30'
                }`}
              >
                <Menu className="w-3.5 h-3.5" />
                Todo
              </button>

              <AnimatePresence>
                {catAbiertas && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 top-full mt-1 w-56 bg-white border border-[var(--border)] rounded-xl shadow-[0_8px_32px_rgba(15,17,17,0.18)] overflow-hidden z-50"
                  >
                    <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Categorías
                    </p>
                    {CATEGORIES.map(({ label, href }) => (
                      <Link key={href} href={href}
                        className="flex items-center px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:text-[var(--accent-dark)] transition-colors">
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-[var(--border)] mt-1">
                      <Link href="/search"
                        className="flex items-center px-4 py-2.5 text-sm font-semibold text-[var(--accent-dark)] hover:bg-orange-50 transition-colors">
                        Ver todo →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Links de navegación */}
            {!user ? (
              <>
                {NAV_PUBLICO.map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="px-3 h-full flex items-center text-white text-xs hover:bg-white/10 rounded transition-colors border border-transparent hover:border-white/30 whitespace-nowrap">
                    {label}
                  </Link>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <Link href="/auth/register"
                    className="px-3 py-1 text-xs font-bold text-[var(--nav-bg)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded transition-colors">
                    Comenzar gratis
                  </Link>
                </div>
              </>
            ) : (
              enlaces.slice(0, 6).map(enlace => {
                const activo = pathname === enlace.href || (enlace.href !== '/' && pathname.startsWith(enlace.href));
                return (
                  <Link key={enlace.href} href={enlace.href}
                    className={`flex items-center gap-1.5 px-3 h-full text-xs transition-colors rounded border whitespace-nowrap ${
                      activo
                        ? 'text-white font-bold border-white/40 bg-white/10'
                        : 'text-white/90 hover:text-white hover:bg-white/10 border-transparent hover:border-white/30'
                    }`}>
                    <enlace.icono className="w-3 h-3" />
                    {enlace.label}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Menú móvil */}
        <AnimatePresence>
          {menuAbierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden bg-white border-b border-[var(--border)] overflow-hidden shadow-lg"
            >
              <div className="px-4 pt-3 pb-2">
                <div className="flex rounded-md overflow-hidden border border-[var(--border)]">
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && irABuscar()}
                    placeholder="Buscar..."
                    className="flex-1 px-3 py-2 text-sm outline-none text-[var(--text-primary)]"
                  />
                  <button onClick={irABuscar} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3 flex items-center transition-colors">
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="px-4 pb-3 flex flex-col gap-0.5">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-1 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-[var(--accent)] text-white shrink-0">
                        {user.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                      </div>
                    </div>
                    {enlaces.map(enlace => (
                      <Link key={enlace.href} href={enlace.href}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          pathname === enlace.href
                            ? 'bg-orange-50 text-orange-700 font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                        }`}>
                        <enlace.icono className="w-4 h-4" />
                        {enlace.label}
                      </Link>
                    ))}
                    <div className="h-px bg-[var(--border)] my-1" />
                    <button
                      onClick={async () => {
                        try { await api.post('/auth/logout'); } catch { /* */ }
                        logout();
                        setMenuAbierto(false);
                        window.location.href = '/';
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                      <User className="w-4 h-4" />
                      Iniciar sesión
                    </Link>
                    <Link href="/auth/register"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-colors mt-1">
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

      {/* Espaciador para compensar el nav fijo */}
      <div className="h-[88px] md:h-[92px]" />
    </>
  );
}
