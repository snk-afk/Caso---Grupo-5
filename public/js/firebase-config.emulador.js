/**
 * Configuración para los EMULADORES locales de Firebase.
 * El prefijo "demo-" hace que el emulador no se conecte a ningún recurso real,
 * por eso estos valores no son credenciales y pueden versionarse.
 */
export const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-labtrack.firebaseapp.com',
  projectId: 'demo-labtrack',
};

export const emuladores = {
  authUrl: 'http://127.0.0.1:9099',
  firestoreHost: '127.0.0.1',
  firestorePort: 8080,
};
