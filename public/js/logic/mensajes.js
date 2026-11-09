/**
 * Textos que se muestran al usuario. Los marcados como EXACTO son criterios de aceptación.
 */
import { SEGURIDAD } from './constantes.js';

export const MENSAJES = Object.freeze({
  // HU-01 (EXACTO)
  CREDENCIALES_INVALIDAS: 'Credenciales inválidas',
  LOGIN_CAMPOS_VACIOS: 'Ingresa tu código de estudiante y tu contraseña.',
  DEMASIADAS_SOLICITUDES: 'Firebase bloqueó temporalmente los intentos desde este dispositivo. Intenta más tarde.',
  ERROR_INESPERADO: 'Ocurrió un error inesperado. Intenta nuevamente.',
});

export function mensajeCuentaBloqueada(minutos) {
  return `Cuenta bloqueada temporalmente por intentos fallidos. Intenta nuevamente en ${minutos} minuto(s).`;
}

export function alertaSeguridadBloqueo(config = SEGURIDAD) {
  return `Alerta de seguridad: se registraron ${config.MAX_INTENTOS} intentos fallidos consecutivos. `
    + `La cuenta quedó bloqueada durante ${config.MINUTOS_BLOQUEO} minutos.`;
}
