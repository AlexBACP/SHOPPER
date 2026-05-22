const COP = new Intl.NumberFormat('es-CO', {
  style:    'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return COP.format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)   return 'Ahora mismo';
  if (mins  < 60)  return `Hace ${mins} min`;
  if (hours < 24)  return `Hace ${hours} h`;
  if (days  < 30)  return `Hace ${days} días`;
  return formatDate(date);
}
