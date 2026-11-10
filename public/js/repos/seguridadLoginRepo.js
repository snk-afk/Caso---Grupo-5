/**
 * Acceso a la colección seguridadLogin/{codigo} (contador de intentos fallidos y bloqueo).
 */
import { db } from './firebase.js';
import { doc, getDoc, setDoc, Timestamp } from './sdk.js';
import { COLECCIONES } from '../logic/constantes.js';
import { ejecutarTransaccion } from './transacciones.js';

const SEGURIDAD_VACIA = Object.freeze({ intentosFallidos: 0, bloqueadoHasta: null });

function referencia(codigo) {
  return doc(db, COLECCIONES.SEGURIDAD_LOGIN, codigo);
}

function seguridadDesdeDocumento(instantanea) {
  if (!instantanea.exists()) {
    return { ...SEGURIDAD_VACIA };
  }
  const { intentosFallidos = 0, bloqueadoHasta = null } = instantanea.data();
  return { intentosFallidos, bloqueadoHasta: bloqueadoHasta?.toDate() ?? null };
}

function aDocumento({ intentosFallidos, bloqueadoHasta }) {
  return { intentosFallidos, bloqueadoHasta: bloqueadoHasta ? Timestamp.fromDate(bloqueadoHasta) : null };
}

/** Devuelve { intentosFallidos, bloqueadoHasta: Date|null }; si no existe, el estado inicial. */
export async function obtenerSeguridad(codigo) {
  return seguridadDesdeDocumento(await getDoc(referencia(codigo)));
}

/**
 * Registra un intento fallido de forma ATÓMICA (lectura + escritura en una transacción),
 * para que intentos simultáneos (varias pestañas o clics seguidos) no se pisen entre sí.
 * `calcular(seguridadActual)` devuelve el nuevo estado, o null si no hay que escribir
 * (por ejemplo, porque la cuenta ya está bloqueada).
 * @returns {Promise<object>} el estado de seguridad resultante
 */
export function registrarFallo(codigo, calcular) {
  return ejecutarTransaccion(async (transaccion) => {
    const actual = seguridadDesdeDocumento(await transaccion.get(referencia(codigo)));
    const nueva = calcular(actual);
    if (!nueva) {
      return actual;
    }
    transaccion.set(referencia(codigo), aDocumento(nueva));
    return nueva;
  });
}

/** Reinicia el contador tras un login exitoso (solo lo permite el dueño del código). */
export function reiniciarSeguridad(codigo) {
  return setDoc(referencia(codigo), aDocumento(SEGURIDAD_VACIA));
}
