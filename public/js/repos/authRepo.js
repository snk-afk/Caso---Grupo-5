/**
 * Acceso a Firebase Authentication.
 */
import { auth } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from './sdk.js';
import { ErrorCredenciales, ErrorNegocio } from '../logic/errores.js';
import { MENSAJES } from '../logic/mensajes.js';

const CODIGOS_CREDENCIALES = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/invalid-email',
  'auth/user-disabled',
]);

function traducirError(error) {
  if (CODIGOS_CREDENCIALES.has(error?.code)) {
    return new ErrorCredenciales();
  }
  if (error?.code === 'auth/too-many-requests') {
    return new ErrorNegocio(MENSAJES.DEMASIADAS_SOLICITUDES);
  }
  return error;
}

/** Inicia sesión y devuelve el uid. Lanza ErrorCredenciales si los datos no coinciden. */
export async function iniciarSesion(correo, clave) {
  try {
    const credencial = await signInWithEmailAndPassword(auth, correo, clave);
    return credencial.user.uid;
  } catch (error) {
    throw traducirError(error);
  }
}

export function cerrarSesion() {
  return signOut(auth);
}

/** Resuelve con el uid de la sesión actual (o null) una vez que Firebase restauró la sesión. */
export function obtenerUidSesion() {
  return new Promise((resolve) => {
    const cancelar = onAuthStateChanged(auth, (usuario) => {
      cancelar();
      resolve(usuario?.uid ?? null);
    });
  });
}
