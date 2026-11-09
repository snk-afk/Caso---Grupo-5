/**
 * Acceso a la colección usuarios/{uid}.
 */
import { db } from './firebase.js';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from './sdk.js';
import { COLECCIONES, ESTADOS_USUARIO } from '../logic/constantes.js';
import { ejecutarTransaccion } from './transacciones.js';

export function referenciaUsuario(uid) {
  return doc(db, COLECCIONES.USUARIOS, uid);
}

export function perfilDesdeDocumento(instantanea) {
  return instantanea.exists() ? { uid: instantanea.id, ...instantanea.data() } : null;
}

/** Devuelve el perfil { uid, codigo, nombre, rol, estado, reservaActivaId } o null. */
export async function obtenerUsuario(uid) {
  return perfilDesdeDocumento(await getDoc(referenciaUsuario(uid)));
}

/** Estudiantes en estado "Penalizado" (solo el encargado puede consultarlos). */
export async function listarUsuariosPenalizados() {
  const consulta = query(
    collection(db, COLECCIONES.USUARIOS),
    where('estado', '==', ESTADOS_USUARIO.PENALIZADO),
    orderBy('nombre'),
  );
  const resultado = await getDocs(consulta);
  return resultado.docs.map(perfilDesdeDocumento);
}

/**
 * Regla derivada RD-02: el encargado retira la penalización (estado vuelve a "Activo").
 * `validar(usuario)` lanza ErrorNegocio si el estudiante ya no está penalizado.
 */
export function quitarPenalizacion(uid, validar) {
  return ejecutarTransaccion(async (transaccion) => {
    const usuario = perfilDesdeDocumento(await transaccion.get(referenciaUsuario(uid)));
    validar(usuario);
    transaccion.update(referenciaUsuario(uid), { estado: ESTADOS_USUARIO.ACTIVO });
    return usuario;
  });
}
