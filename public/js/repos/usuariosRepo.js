/**
 * Acceso a la colección usuarios/{uid}.
 */
import { db } from './firebase.js';
import { doc, getDoc } from './sdk.js';
import { COLECCIONES } from '../logic/constantes.js';

export function referenciaUsuario(uid) {
  return doc(db, COLECCIONES.USUARIOS, uid);
}

/** Devuelve el perfil { uid, codigo, nombre, rol, estado, reservaActivaId } o null. */
export async function obtenerUsuario(uid) {
  const instantanea = await getDoc(referenciaUsuario(uid));
  return instantanea.exists() ? { uid, ...instantanea.data() } : null;
}
