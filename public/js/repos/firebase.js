/**
 * Inicialización de Firebase (App, Auth y Firestore).
 * En localhost/127.0.0.1 se conecta automáticamente a los emuladores.
 */
import {
  initializeApp,
  getAuth,
  connectAuthEmulator,
  getFirestore,
  connectFirestoreEmulator,
} from './sdk.js';

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1']);

export const usaEmuladores = HOSTS_LOCALES.has(window.location.hostname);

const configuracion = usaEmuladores
  ? await import('../firebase-config.emulador.js')
  : await import('../firebase-config.js');

const app = initializeApp(configuracion.firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

if (usaEmuladores) {
  const { authUrl, firestoreHost, firestorePort } = configuracion.emuladores;
  connectAuthEmulator(auth, authUrl, { disableWarnings: true });
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
}
