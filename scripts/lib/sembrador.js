/**
 * Operaciones de siembra reutilizables (seed.js y pruebas Selenium).
 */
import { COLECCIONES } from '../../public/js/logic/constantes.js';
import { codigoACorreo } from '../../public/js/logic/autenticacion.js';
import { construirEquipos, construirUsuarios } from '../seed-data.js';

const TAMANO_LOTE_AUTH = 10;
const MAX_ESCRITURAS_BATCH = 500;

/** Borra todas las colecciones de la app (incluye subcolecciones). */
export async function limpiarColecciones(db) {
  for (const nombre of Object.values(COLECCIONES)) {
    await db.recursiveDelete(db.collection(nombre));
  }
}

/** Crea el usuario en Auth o, si ya existe, restablece su correo y contraseña. */
async function asegurarCuentaAuth(auth, usuario) {
  const datos = {
    email: codigoACorreo(usuario.codigo),
    password: usuario.clave,
    displayName: usuario.nombre,
    disabled: false,
  };
  try {
    await auth.updateUser(usuario.codigo, datos);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
    await auth.createUser({ uid: usuario.codigo, ...datos });
  }
}

async function asegurarCuentasAuth(auth, usuarios) {
  for (let i = 0; i < usuarios.length; i += TAMANO_LOTE_AUTH) {
    const lote = usuarios.slice(i, i + TAMANO_LOTE_AUTH);
    await Promise.all(lote.map((u) => asegurarCuentaAuth(auth, u)));
  }
}

/** Escribe documentos { id, datos } en lotes de hasta 500. */
export async function escribirDocumentos(db, coleccion, documentos) {
  for (let i = 0; i < documentos.length; i += MAX_ESCRITURAS_BATCH) {
    const batch = db.batch();
    for (const { id, datos } of documentos.slice(i, i + MAX_ESCRITURAS_BATCH)) {
      batch.set(db.collection(coleccion).doc(id), datos);
    }
    await batch.commit();
  }
}

function documentoUsuario({ codigo, nombre, rol, estado }) {
  return { id: codigo, datos: { codigo, nombre, rol, estado, reservaActivaId: null } };
}

function documentoEquipo(equipo) {
  return { id: equipo.codigoInventario, datos: equipo };
}

/**
 * Deja la base en el estado semilla: borra todo y recrea los documentos,
 * por lo que todos los usuarios quedan en estado "Activo" y sin reserva activa
 * (es el reinicio de datos que usa el equipo antes de cada prueba: npm run reset).
 * @param {{auth: object, db: object}} conexion
 * @param {{incluirJmeter?: boolean, categoriaVacia?: string|null, crearCuentas?: boolean}} opciones
 */
export async function sembrar({ auth, db }, opciones = {}) {
  const { incluirJmeter = true, categoriaVacia = null, crearCuentas = true } = opciones;
  const usuarios = construirUsuarios({ incluirJmeter });
  const equipos = construirEquipos({ categoriaVacia });

  await limpiarColecciones(db);
  if (crearCuentas) {
    await asegurarCuentasAuth(auth, usuarios);
  }
  await escribirDocumentos(db, COLECCIONES.USUARIOS, usuarios.map(documentoUsuario));
  await escribirDocumentos(db, COLECCIONES.EQUIPOS, equipos.map(documentoEquipo));

  return { usuarios: usuarios.length, equipos: equipos.length };
}
