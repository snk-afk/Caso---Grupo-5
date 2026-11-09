/**
 * Constantes del dominio LabTrack.
 * Módulo puro: no importa Firebase, lo usan el frontend, las pruebas y el seed.
 */

export const ROLES = Object.freeze({
  ESTUDIANTE: 'estudiante',
  ENCARGADO: 'encargado',
});

export const ESTADOS_USUARIO = Object.freeze({
  ACTIVO: 'Activo',
  PENALIZADO: 'Penalizado',
});

export const CATEGORIAS = Object.freeze(['Cómputo', 'Electrónica', 'Redes']);

export const ESTADOS_EQUIPO = Object.freeze({
  DISPONIBLE: 'Disponible',
  PRESTADO: 'Prestado',
});

export const ESTADOS_RESERVA = Object.freeze({
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  DEVUELTA: 'Devuelta',
});

export const COLECCIONES = Object.freeze({
  USUARIOS: 'usuarios',
  SEGURIDAD_LOGIN: 'seguridadLogin',
  EQUIPOS: 'equipos',
  RESERVAS: 'reservas',
});

/** Dominio con el que se arma el correo de Firebase Auth: {codigo}@labtrack.edu.pe */
export const DOMINIO_CORREO = 'labtrack.edu.pe';

/** Parámetros configurables de seguridad del login (HU-01). */
export const SEGURIDAD = Object.freeze({
  MAX_INTENTOS: 3,
  MINUTOS_BLOQUEO: 5,
});
