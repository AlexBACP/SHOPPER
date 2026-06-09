import axios from 'axios';
import { toast } from 'sonner';

/**
 * Convierte cualquier error de API en un mensaje claro y accionable
 * para el usuario, en español de Colombia.
 *
 * @param e        El error capturado (idealmente de axios).
 * @param fallback Mensaje a mostrar cuando no se puede inferir nada útil.
 * @returns        El texto del mensaje mostrado (por si se quiere reutilizar).
 */
export function handleApiError(e: unknown, fallback?: string): string {
  const msg = getApiMessage(e, fallback);
  toast.error(msg);
  return msg;
}

/**
 * Igual que handleApiError pero solo devuelve el mensaje, sin mostrar toast.
 * Útil para errores inline en formularios.
 */
export function getApiMessage(e: unknown, fallback?: string): string {
  const fall = fallback ?? 'No pudimos completar la acción. Revisa tu conexión e intenta de nuevo.';

  if (axios.isAxiosError(e)) {
    // El servidor no respondió (sin internet, CORS, timeout, servidor caído).
    if (!e.response) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
    }

    const status = e.response.status;
    const data   = e.response.data as { message?: string | string[] } | undefined;

    switch (status) {
      case 400: return firstMessage(data) ?? 'Revisa los datos ingresados, hay algo que no es válido.';
      case 401: return firstMessage(data) ?? 'Tu sesión expiró. Vuelve a iniciar sesión.';
      case 403: return firstMessage(data) ?? 'No tienes permiso para hacer esto.';
      case 404: return 'No encontramos lo que buscas. Puede que ya no exista.';
      case 409: return firstMessage(data) ?? 'Ese registro ya existe o está en uso.';
      case 422: return firstMessage(data) ?? 'Revisa los datos ingresados, hay algo que no es válido.';
      case 429: return 'Demasiadas solicitudes. Espera 30 segundos y vuelve a intentar.';
    }

    if (status >= 500) {
      return 'Tenemos un problema de nuestro lado. Intenta de nuevo en un momento.';
    }

    return firstMessage(data) ?? fall;
  }

  if (e instanceof Error && e.message) return e.message;
  return fall;
}

/** El backend (NestJS/class-validator) puede devolver message como string o string[]. */
function firstMessage(data: { message?: string | string[] } | undefined): string | undefined {
  if (!data?.message) return undefined;
  return Array.isArray(data.message) ? data.message[0] : data.message;
}
