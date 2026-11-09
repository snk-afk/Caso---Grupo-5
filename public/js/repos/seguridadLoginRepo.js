/**
 * Acceso a la colección seguridadLogin/{codigo} (contador de intentos fallidos y bloqueo).
 */
import { db } from './firebase.js';
import { doc, getDoc, setDoc, Timestamp } from './sdk.js';
import { COLECCIONES } from '../logic/constantes.js';

const SEGURIDAD_VACIA = Object.freeze({ intentosFallidos: 0, bloqueadoHasta: null });

function referencia(codigo) {
  return doc(db, COLECCIONES.SEGURIDAD_LOGIN, codigo);
}

/** Devuelve { intentosFallidos, bloqueadoHasta: Date|null }; si no existe, el estado inicial. */
export async function obtenerSeguridad(codigo) {
  const instantanea = await getDoc(referencia(codigo));
  if (!instantanea.exists()) {
    return { ...SEGURIDAD_VACIA };
  }
  const { intentosFallidos = 0, bloqueadoHasta = null } = instantanea.data();
  return { intentosFallidos, bloqueadoHasta: bloqueadoHasta?.toDate() ?? null };
}

export function guardarSeguridad(codigo, { intentosFallidos, bloqueadoHasta }) {
  return setDoc(referencia(codigo), {
    intentosFallidos,
    bloqueadoHasta: bloqueadoHasta ? Timestamp.fromDate(bloqueadoHasta) : null,
  });
}

/** Reinicia el contador tras un login exitoso (solo lo permite el dueño del código). */
export function reiniciarSeguridad(codigo) {
  return guardarSeguridad(codigo, SEGURIDAD_VACIA);
}
