/**
 * Conversión entre tipos de Firestore y objetos del dominio, y traducción de errores.
 */
import { Timestamp } from './sdk.js';
import { ErrorNegocio } from '../logic/errores.js';
import { MENSAJES } from '../logic/mensajes.js';

export function aFecha(valor) {
  return valor?.toDate ? valor.toDate() : (valor ?? null);
}

export function aTimestamp(fecha) {
  return fecha ? Timestamp.fromDate(fecha) : null;
}

/** Bloques [{ reservaId, inicio: Timestamp, fin: Timestamp }] -> con Date. */
export function bloquesDesdeFirestore(bloques) {
  return (bloques ?? []).map((b) => ({ reservaId: b.reservaId, inicio: aFecha(b.inicio), fin: aFecha(b.fin) }));
}

/** Errores de negocio pasan tal cual; permission-denied se traduce a un mensaje claro. */
export function traducirErrorFirestore(error) {
  if (error instanceof ErrorNegocio) {
    return error;
  }
  if (error?.code === 'permission-denied') {
    return new ErrorNegocio(MENSAJES.SIN_PERMISO);
  }
  return error;
}
