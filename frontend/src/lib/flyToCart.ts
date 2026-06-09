/**
 * flyToCart — microinteracción: un "fantasma" del producto vuela desde el
 * botón hasta el ícono del carrito en el navbar y este hace un pulso.
 *
 * El ícono del carrito debe tener id="cart-fly-target".
 * Respeta prefers-reduced-motion (solo pulsa el ícono, sin vuelo).
 */
export function flyToCart(origin: { x: number; y: number }, imageUrl?: string): void {
  if (typeof window === 'undefined') return;
  const target = document.getElementById('cart-fly-target');
  if (!target) return;

  const tRect = target.getBoundingClientRect();
  const dx = tRect.left + tRect.width / 2;
  const dy = tRect.top + tRect.height / 2;

  const pulse = () =>
    target.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'cubic-bezier(0.16,1,0.3,1)' },
    );

  // Si el usuario prefiere menos movimiento, solo pulsamos el ícono.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    pulse();
    return;
  }

  const ghost = document.createElement('div');
  ghost.style.cssText = [
    'position:fixed',
    `left:${origin.x}px`,
    `top:${origin.y}px`,
    'width:46px',
    'height:46px',
    'border-radius:12px',
    'z-index:200',
    'pointer-events:none',
    'overflow:hidden',
    'background:var(--bone-2)',
    'border:1px solid var(--line)',
    'box-shadow:0 10px 28px rgba(40,30,18,.25)',
    'transform:translate(-50%,-50%)',
  ].join(';');

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover';
    ghost.appendChild(img);
  } else {
    ghost.style.background = 'var(--primary)';
  }

  document.body.appendChild(ghost);

  const deltaX = dx - origin.x;
  const deltaY = dy - origin.y;

  const anim = ghost.animate(
    [
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(calc(-50% + ${deltaX * 0.5}px), calc(-50% + ${deltaY * 0.5 - 60}px)) scale(0.9)`, opacity: 1, offset: 0.6 },
      { transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.2)`, opacity: 0.4, offset: 1 },
    ],
    { duration: 750, easing: 'cubic-bezier(0.16,1,0.3,1)' },
  );

  anim.onfinish = () => {
    ghost.remove();
    pulse();
  };
}
