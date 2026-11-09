/**
 * Acceso a la colección equipos/{id}.
 */
import { db } from './firebase.js';
import { collection, doc, getDocs, orderBy, query, where } from './sdk.js';
import { COLECCIONES } from '../logic/constantes.js';
import { bloquesDesdeFirestore } from './conversion.js';

const coleccionEquipos = () => collection(db, COLECCIONES.EQUIPOS);

export function referenciaEquipo(equipoId) {
  return doc(db, COLECCIONES.EQUIPOS, equipoId);
}

export function equipoDesdeDocumento(instantanea) {
  if (!instantanea.exists()) {
    return null;
  }
  const datos = instantanea.data();
  return { id: instantanea.id, ...datos, bloquesAprobados: bloquesDesdeFirestore(datos.bloquesAprobados) };
}

/**
 * Lista los equipos con UNA sola consulta (HU-02).
 * Con categoría: where("categoria", "==", categoria) en Firestore, no en el cliente.
 */
export async function listarEquipos(categoria = null) {
  const consulta = categoria
    ? query(coleccionEquipos(), where('categoria', '==', categoria), orderBy('nombre'))
    : query(coleccionEquipos(), orderBy('categoria'), orderBy('nombre'));
  const resultado = await getDocs(consulta);
  return resultado.docs.map(equipoDesdeDocumento);
}
