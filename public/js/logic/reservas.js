/**
 * Lógica pura de reservas (HU-03). No importa Firebase.
 * Todas las funciones de validación lanzan ErrorNegocio con un mensaje específico.
 */
import { ESTADOS_EQUIPO, ESTADOS_USUARIO } from './constantes.js';
import { ErrorNegocio } from './errores.js';
import { fechaISO, formatearFecha, horaHHMM } from './formato.js';
import { MENSAJES } from './mensajes.js';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function esFechaValida(fecha) {
  if (!PATRON_FECHA.test(fecha)) {
    return false;
  }
  const comprobacion = new Date(`${fecha}T00:00:00`);
  return !Number.isNaN(comprobacion.getTime()) && fechaISO(comprobacion) === fecha;
}

/** Construye el intervalo { inicio, fin } (Date en hora local) de una reserva. */
export function construirIntervalo(fecha, horaInicio, horaFin) {
  return {
    inicio: new Date(`${fecha}T${horaInicio}:00`),
    fin: new Date(`${fecha}T${horaFin}:00`),
  };
}

/**
 * Valida los datos del formulario de reserva y devuelve el intervalo.
 * Reglas: campos completos, formato válido, inicio < fin, fecha no pasada y horario futuro.
 */
export function validarSolicitudReserva({ equipoId, fecha, horaInicio, horaFin }, ahora) {
  if (!equipoId || !fecha || !horaInicio || !horaFin) {
    throw new ErrorNegocio(MENSAJES.RESERVA_CAMPOS_VACIOS);
  }
  if (!esFechaValida(fecha) || !PATRON_HORA.test(horaInicio) || !PATRON_HORA.test(horaFin)) {
    throw new ErrorNegocio(MENSAJES.RESERVA_FORMATO_INVALIDO);
  }
  if (horaInicio >= horaFin) {
    throw new ErrorNegocio(MENSAJES.RESERVA_INICIO_MAYOR_FIN);
  }
  if (fecha < fechaISO(ahora)) {
    throw new ErrorNegocio(MENSAJES.RESERVA_FECHA_PASADA);
  }
  const intervalo = construirIntervalo(fecha, horaInicio, horaFin);
  if (intervalo.inicio <= ahora) {
    throw new ErrorNegocio(MENSAJES.RESERVA_HORA_PASADA);
  }
  return intervalo;
}

/** ¿Dos intervalos se superponen? (los extremos que solo se tocan no cuentan como cruce) */
export function seCruzan(a, b) {
  return a.inicio < b.fin && b.inicio < a.fin;
}

/** Busca el primer bloque aprobado que se cruza con el intervalo (o null). */
export function buscarCruce(bloquesAprobados, intervalo) {
  return (bloquesAprobados ?? []).find((bloque) => seCruzan(bloque, intervalo)) ?? null;
}

/** El estudiante debe estar Activo y sin otra reserva pendiente o aprobada. */
export function validarEstudianteHabilitado(perfil) {
  if (perfil?.estado === ESTADOS_USUARIO.PENALIZADO) {
    throw new ErrorNegocio(MENSAJES.RESERVA_ESTUDIANTE_PENALIZADO);
  }
  if (perfil?.reservaActivaId) {
    throw new ErrorNegocio(MENSAJES.RESERVA_LIMITE_SIMULTANEO);
  }
}

/** El equipo debe existir, no tener cruces con reservas aprobadas y estar Disponible. */
export function validarEquipoReservable(equipo, intervalo) {
  if (!equipo) {
    throw new ErrorNegocio(MENSAJES.RESERVA_EQUIPO_INEXISTENTE);
  }
  const cruce = buscarCruce(equipo.bloquesAprobados, intervalo);
  if (cruce) {
    throw new ErrorNegocio(mensajeCruceHorario(cruce));
  }
  if (equipo.estado !== ESTADOS_EQUIPO.DISPONIBLE) {
    throw new ErrorNegocio(MENSAJES.RESERVA_EQUIPO_NO_DISPONIBLE);
  }
}

/** Validación completa que se ejecuta dentro de la transacción de Firestore. */
export function validarReserva(perfil, equipo, intervalo) {
  validarEstudianteHabilitado(perfil);
  validarEquipoReservable(equipo, intervalo);
}

export function mensajeCruceHorario(bloque) {
  return 'El equipo ya tiene una reserva aprobada que se cruza con ese horario '
    + `(${formatearFecha(fechaISO(bloque.inicio))}, ${horaHHMM(bloque.inicio)} – ${horaHHMM(bloque.fin)}).`;
}
