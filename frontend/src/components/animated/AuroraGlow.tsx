'use client';

/**
 * AuroraGlow — capa de fondo decorativa con dos resplandores que se mueven
 * lento (patrón "aurora" de 21st.dev, adaptado a la paleta Mercado Editorial).
 * Sutil y no intrusivo. La animación se desactiva con prefers-reduced-motion
 * (ver globals.css). Debe ir dentro de un contenedor `position: relative`.
 */
export default function AuroraGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="aurora-blob aurora-a absolute -top-24 -left-16 h-[42vh] w-[42vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
      />
      <div
        className="aurora-blob aurora-b absolute top-1/3 -right-20 h-[46vh] w-[46vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(47,93,79,0.16), transparent 70%)' }}
      />
      <div
        className="aurora-blob aurora-a absolute -bottom-28 left-1/3 h-[38vh] w-[38vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(199,90,43,0.12), transparent 70%)', animationDelay: '-8s' }}
      />
    </div>
  );
}
