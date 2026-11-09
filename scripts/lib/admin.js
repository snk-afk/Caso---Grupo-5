/**
 * Inicializa firebase-admin contra el emulador o contra el proyecto real.
 * La ruta de la clave de servicio se lee SOLO desde variables de entorno (.env).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const PROYECTO_EMULADOR = 'demo-labtrack';

const HOSTS_EMULADOR = {
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
};

function iniciarEmulador() {
  for (const [variable, host] of Object.entries(HOSTS_EMULADOR)) {
    process.env[variable] ??= host;
  }
  return initializeApp({ projectId: PROYECTO_EMULADOR });
}

function leerVariable(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa tu archivo .env (ver .env.example).`);
  }
  return valor;
}

function iniciarProyectoReal() {
  const rutaClave = resolve(leerVariable('FIREBASE_SERVICE_ACCOUNT_PATH'));
  const cuentaServicio = JSON.parse(readFileSync(rutaClave, 'utf8'));
  return initializeApp({
    credential: cert(cuentaServicio),
    projectId: leerVariable('FIREBASE_PROJECT_ID'),
  });
}

/** Devuelve { auth, db } listos para usar. */
export function conectarAdmin({ emulador }) {
  const app = emulador ? iniciarEmulador() : iniciarProyectoReal();
  return { auth: getAuth(app), db: getFirestore(app) };
}
