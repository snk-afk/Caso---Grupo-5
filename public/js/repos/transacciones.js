/**
 * Ejecuta una transacción de Firestore traduciendo los errores al dominio.
 * Firestore reintenta automáticamente si otro cliente modifica los documentos leídos.
 */
import { db } from './firebase.js';
import { runTransaction } from './sdk.js';
import { traducirErrorFirestore } from './conversion.js';

export async function ejecutarTransaccion(operacion) {
  try {
    return await runTransaction(db, operacion);
  } catch (error) {
    throw traducirErrorFirestore(error);
  }
}
