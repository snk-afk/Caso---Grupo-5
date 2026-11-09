/**
 * Lógica pura de autenticación (HU-01). No importa Firebase.
 */
import { DOMINIO_CORREO } from './constantes.js';

/** Normaliza el código de estudiante: sin espacios y en minúsculas. */
export function normalizarCodigo(codigo) {
  return String(codigo ?? '').trim().toLowerCase();
}

/** Convierte el código de estudiante en el correo usado por Firebase Auth. */
export function codigoACorreo(codigo) {
  return `${normalizarCodigo(codigo)}@${DOMINIO_CORREO}`;
}
