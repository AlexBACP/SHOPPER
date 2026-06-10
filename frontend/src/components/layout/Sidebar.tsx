'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Store, Package, ShoppingBag,
  Users, BarChart3, ChevronRight,
  ShoppingCart, User, Ticket,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificacionesStore } from '@/store/notifications.store';
import { cn } from '@/lib/utils';

// ── Tipos ────────────────────────────────────────────────
type Role = 'super_admin' | 'admin' | 'owner' | 'buyer';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

// ── Nav por rol ───────────────────────────────────────────
function getNavGroups(role: Role): NavGroup[] {
  if (role === 'owner') {
    return [
      {
        items: [
          { label: 'Inicio',    href: '/owner',               icon: LayoutDashboard },
          { label: 'Mi perfil', href: '/dashboard/profile',   icon: User            },
        ],
      },
      {
        title: 'Mi tienda',
        items: [
          { label: 'Mis tiendas', href: '/owner/stores',    icon: Store      },
          { label: 'Productos',   href: '/owner/products',  icon: Package    },
          { label: 'Pedidos',     href: '/owner/orders',    icon: ShoppingBag },
          { label: 'Analíticas',  href: '/owner/analytics', icon: BarChart3  },
        ],
      },
    ];
  }

  if (role === 'admin' || role === 'super_admin') {
    return [
      {
        items: [
          { label: 'Panel',       href: '/dashboard',      icon: LayoutDashboard },
          { label: 'Mi perfil',   href: '/dashboard/profile', icon: User },
        ],
      },
      {
        title: 'Administración',
        items: [
          { label: 'Dashboard',   href: '/admin',              icon: LayoutDashboard },
          { label: 'Tiendas',     href: '/admin/stores',       icon: Store },
          { label: 'Usuarios',    href: '/admin/stores/users',  icon: Users },
          { label: 'Cupones',     href: '/admin/coupons',       icon: Ticket },
        ],
      },
    ];
  }

  // buyer
  return [
    {
      items: [
        { label: 'Mi cuenta',  href: '/dashboard',          icon: LayoutDashboard },
        { label: 'Mi perfil',  href: '/dashboard/profile',  icon: User },
        { label: 'Mis pedidos', href: '/orders',            icon: ShoppingCart },
      ],
    },
  ];
}

// ── Ítem individual ───────────────────────────────────────
function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group relative',
        active
          ? 'bg-[var(--accent-subtle)] text-[var(--primary-2)] border border-[var(--accent-border)]'
          : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bone-3)] border border-transparent',
        collapsed && 'justify-center',
      )}
    >
      <Icon className={cn('shrink-0', active ? 'w-4 h-4' : 'w-4 h-4')} />

      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}

      {item.badge && !collapsed && (
        <span className="ml-auto text-xs bg-[var(--primary)] text-[var(--bone-2)] px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}

      {/* Tooltip al colapsar */}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[var(--surface-2)] border border-[var(--border-hover)] text-[var(--text-primary)] text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
          {item.label}
        </div>
      )}
    </Link>
  );
}

// ── SIDEBAR PRINCIPAL ─────────────────────────────────────
interface SidebarProps {
  /** Clases extra para el contenedor */
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { user }   = useAuthStore();
  const sinLeer = useNotificacionesStore((s) => s.sinLeer);
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  // Inyectar badge dinámico en el ítem "Pedidos" del owner
  const groups = getNavGroups(user.role).map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.href === '/owner/orders' && sinLeer > 0
        ? { ...item, badge: sinLeer > 99 ? '99+' : String(sinLeer) }
        : item,
    ),
  }));

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 224 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden shrink-0',
        className,
      )}
    >
      {/* ── Logo ─────────────────────── */}
      <div className={cn(
        'flex items-center h-16 border-b border-[var(--border)] shrink-0 px-4',
        collapsed ? 'justify-center' : 'gap-2.5',
      )}>
        <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center shadow-[var(--shadow-sm)] shrink-0">
          <ShoppingBag className="w-3.5 h-3.5 text-[var(--bone-2)]" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-[var(--text-primary)] overflow-hidden whitespace-nowrap"
            >
              Shopper
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav ──────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 flex flex-col gap-5">
        {groups.map((group, i) => (
          <div key={i} className="flex flex-col gap-1">
            {group.title && !collapsed && (
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-1">
                {group.title}
              </p>
            )}
            {group.title && collapsed && (
              <div className="h-px bg-[var(--surface-2)] mx-2 mb-1" />
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* ── User + toggle ─────────────── */}
      <div className="border-t border-[var(--border)] p-2 shrink-0 flex flex-col gap-1">
        {/* Toggle colapsar */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bone-3)] transition-all w-full',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-4 h-4" />
          </motion.div>
          {!collapsed && <span>Colapsar</span>}
        </button>

        {/* Avatar usuario */}
        <div className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl',
          collapsed && 'justify-center',
        )}>
          <div className="w-7 h-7 bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded-lg flex items-center justify-center text-xs font-bold text-[var(--primary-2)] shrink-0">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}