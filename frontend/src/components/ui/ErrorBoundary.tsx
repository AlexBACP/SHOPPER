'use client';
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Algo salió mal</h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Ocurrió un error inesperado. Por favor intenta recargar la página.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload(); }}
                className="flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:shadow-md">
                <RefreshCw className="w-4 h-4" /> Recargar
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- recarga dura: resetea el estado roto del boundary */}
              <a href="/" className="flex items-center gap-2 border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] font-medium px-5 py-2.5 rounded-xl text-sm transition-all">
                <Home className="w-4 h-4" /> Ir al inicio
              </a>
            </div>

            {/* En desarrollo mostramos el detalle técnico; en producción se oculta. */}
            {process.env.NODE_ENV !== 'production' && this.state.message && (
              <pre className="mt-6 text-left text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                {this.state.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
