'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Loader2, RotateCcw,
  ShoppingCart, Store, Package, HelpCircle,
  ChevronRight, Minimize2, Bot, User, AlertTriangle, Clock,
} from 'lucide-react';
import api from '@/lib/api';
import { useRateLimit } from '@/hooks/useRateLimit';

interface Message { id: string; role: 'user' | 'assistant'; content: string; ts: number; }

const QUICK_QUESTIONS = [
  { icon: ShoppingCart, q: '¿Cómo funciona el carrito de compras?'   },
  { icon: Store,        q: '¿Cómo creo mi tienda en Shopper?'        },
  { icon: Package,      q: '¿Cómo agrego productos a mi tienda?'     },
  { icon: HelpCircle,   q: '¿Cuáles son los métodos de pago?'        },
  { icon: Package,      q: '¿Cómo rastreo mi pedido?'               },
  { icon: Store,        q: '¿Cuánto cuesta vender en Shopper?'       },
];

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMessage(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,     '<em>$1</em>')
    .replace(/`(.*?)`/g,       '<code class="bg-[var(--surface-3)] px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g,            '<br/>');
}

export default function ChatBot() {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState<Message[]>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [unread,  setUnread]  = useState(1);
  const [cooldownMsg, setCooldownMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Rate limit: máx 15 mensajes por minuto
  const { canRequest, getRemainingTime, getRequestsLeft } = useRateLimit({
    maxRequests: 15,
    windowMs:    60_000,
  });

  const greeting: Message = {
    id: 'greeting', role: 'assistant', ts: Date.now(),
    content: '¡Hola! 👋 Soy **Shoppy**, el asistente virtual de Shopper.\n\n¿En qué puedo ayudarte hoy?',
  };

  useEffect(() => {
    if (open) {
      setUnread(0);
      if (msgs.length === 0) setMsgs([greeting]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    // Rate limiting
    if (!canRequest()) {
      const secs = Math.ceil(getRemainingTime() / 1000);
      setCooldownMsg(`Demasiados mensajes. Espera ${secs}s`);
      setTimeout(() => setCooldownMsg(''), getRemainingTime());
      return;
    }

    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, ts: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...msgs, userMsg]
        .filter(m => m.id !== 'greeting')
        .slice(-10) // últimos 10 mensajes para no sobrecargar el contexto
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.post('/chat', { messages: history });
      const reply = res.data?.reply ?? res.data?.message ?? 'Lo siento, no pude procesar tu mensaje.';
      setMsgs(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: reply, ts: Date.now() }]);
    } catch {
      setMsgs(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant', ts: Date.now(),
        content: 'Ups, tuve un problema técnico. Intenta de nuevo en un momento 🙏',
      }]);
    } finally { setLoading(false); }
  }, [input, loading, msgs, canRequest, getRemainingTime]);

  const reset = () => { setMsgs([greeting]); setCooldownMsg(''); };

  const requestsLeft = getRequestsLeft();

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-white border border-[var(--border)] rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setOpen(true)}
            >
              <p className="text-xs font-bold text-[var(--text-primary)]">¿Necesitas ayuda? 💬</p>
              <p className="text-xs text-[var(--text-muted)]">Shoppy está aquí</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(v => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-[var(--nav-bg)] hover:bg-[var(--accent)] rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/30 transition-colors relative"
        >
          <AnimatePresence mode="wait">
            {open
              ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6 text-white" /></motion.div>
              : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Bot className="w-6 h-6 text-white" />
                  {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent)] rounded-full text-[9px] font-black text-white flex items-center justify-center">{unread}</span>}
                </motion.div>
            }
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Ventana chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-24px)] bg-white border border-[var(--border)] rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col overflow-hidden"
            style={{ height: '520px' }}
          >
            {/* Header */}
            <div className="bg-[var(--nav-bg)] px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Shoppy</p>
                <p className="text-xs text-white/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> Asistente virtual
                  {requestsLeft < 5 && (
                    <span className="ml-1 text-yellow-400">· {requestsLeft} msgs restantes</span>
                  )}
                </p>
              </div>
              <button onClick={reset} className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Nueva conversación">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--surface-2)]">
              <AnimatePresence initial={false}>
                {msgs.map(msg => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'assistant' ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-[var(--nav-bg)]'}`}>
                      {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'assistant'
                          ? 'bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm'
                          : 'bg-[var(--nav-bg)] text-white rounded-tr-sm'
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Preguntas rápidas en estado inicial */}
              {msgs.length === 1 && !loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1.5 mt-2">
                  <p className="text-[10px] text-[var(--text-muted)] text-center font-semibold uppercase tracking-wider">Preguntas frecuentes</p>
                  {QUICK_QUESTIONS.map(({ icon: Icon, q }) => (
                    <button key={q} onClick={() => send(q)}
                      className="w-full flex items-center gap-2.5 text-left bg-white hover:bg-orange-50 border border-[var(--border)] hover:border-[var(--accent-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-dark)] transition-all group">
                      <Icon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      {q}
                      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[var(--border)] px-3 py-3 bg-white shrink-0">
              {/* Cooldown warning */}
              <AnimatePresence>
                {cooldownMsg && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 mb-2">
                    <Clock className="w-3 h-3 shrink-0" />
                    {cooldownMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder={cooldownMsg ? 'Espera un momento...' : 'Escribe tu pregunta...'}
                  disabled={loading || !!cooldownMsg}
                  maxLength={500}
                  className="flex-1 px-3.5 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface-2)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all placeholder-[var(--text-muted)] disabled:opacity-50"
                />
                <motion.button onClick={() => send()} disabled={loading || !input.trim() || !!cooldownMsg} whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all shadow-md shadow-orange-200/50">
                  {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </motion.button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] text-center mt-1.5 flex items-center justify-center gap-1">
                <span>Shoppy IA · Shopper Colombia</span>
                {requestsLeft <= 10 && <span className="text-orange-500">· {requestsLeft}/15 msgs</span>}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
