// src/middleware.ts
// ─────────────────────────────────────────────────────────
//  Protege rutas privadas antes de que Next.js las sirva.
//  Si el usuario no tiene accessToken en localStorage no puede
//  entrar — se le redirige a /auth/login con ?redirect= para
//  volver después de iniciar sesión.
//
//  Rutas protegidas por rol:
//  /dashboard      → cualquier usuario autenticado
//  /checkout       → cualquier usuario autenticado
//  /orders         → cualquier usuario autenticado
//  /owner/*        → rol owner, admin, super_admin
//  /admin/*        → rol admin, super_admin
// ─────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren solo estar autenticado (cualquier rol)
const AUTH_ROUTES = ['/dashboard', '/checkout', '/orders', '/wishlist'];

// Rutas que requieren rol owner o superior
const OWNER_ROUTES = ['/owner'];

// Rutas que requieren rol admin o superior
const ADMIN_ROUTES = ['/admin'];

function getTokenFromRequest(req: NextRequest): string | null {
  // Next.js middleware no tiene acceso a localStorage.
  // Guardamos una copia del accessToken en una cookie cuando el usuario hace login.
  // Ver: auth.store.ts — setAuth() también escribe la cookie.
  return req.cookies.get('accessToken')?.value ?? null;
}

function getRoleFromToken(token: string): string | null {
  try {
    // Decodifica el payload del JWT sin verificar la firma
    // (la verificación real la hace el backend en cada request)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOwnerRoute = OWNER_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute  = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (!isOwnerRoute && !isAdminRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(req);

  // Sin token → login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const role = getRoleFromToken(token);

  // Rutas de admin: solo admin y super_admin
  if (isAdminRoute && role !== 'admin' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Rutas de owner: owner, admin y super_admin
  if (isOwnerRoute && role !== 'owner' && role !== 'admin' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Aplica el middleware solo a estas rutas (excluye _next, api, assets)
  matcher: [
    '/dashboard/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/owner/:path*',
    '/admin/:path*',
  ],
};
