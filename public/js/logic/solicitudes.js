/**
 * Lógica pura de gestión de solicitudes (HU-04). No importa Firebase.
 */
import { ESTADOS_EQUIPO, ESTADOS_RESERVA } from './constantes.js';
import { ErrorNegocio } from './errores.js';
import { MENSAJES } from './mensajes.js';
import { buscarCruce, mensajeCruceHorario } from './reservas.js';

export const LONGITUD_MAXIMA_MOTIVO = 300;

function validarPendiente(reserva) {
  if (!reserva) {
    throw new ErrorNegocio(MENSAJES.SOLICITUD_INEXISTENTE);
  }
  if (reserva.estado !== ESTADOS_RESERVA.PENDIENTE) {
    throw new ErrorNegocio(MENSAJES.SOLICITUD_YA_ATENDIDA);
  }
}

/** La justificación de rechazo es obligatoria: devuelve el texto limpio o lanza error. */
export function validarMotivoRechazo(motivo) {
  const texto = String(motivo ?? '').trim();
  if (!texto) {
    throw new ErrorNegocio(MENSAJES.RECHAZO_SIN_MOTIVO);
  }
  if (texto.length > LONGITUD_MAXIMA_MOTIVO) {
    throw new ErrorNegocio(MENSAJES.RECHAZO_MOTIVO_LARGO);
  }
  return texto;
}

export function validarRechazo(reserva) {
  validarPendiente(reserva);
}

/**
 * Valida la aprobación dentro de la transacción y devuelve el bloque a agregar al equipo.
 * Se vuelve a verificar el cruce porque dos solicitudes pendientes pueden pedir el mismo horario.
 */
export function validarAprobacion(reserva, equipo) {
  validarPendiente(reserva);
  if (!equipo) {
    throw new ErrorNegocio(MENSAJES.RESERVA_EQUIPO_INEXISTENTE);
  }
  const cruce = buscarCruce(equipo.bloquesAprobados, reserva);
  if (cruce) {
    throw new ErrorNegocio(mensajeCruceHorario(cruce));
  }
  if (equipo.estado !== ESTADOS_EQUIPO.DISPONIBLE) {
    throw new ErrorNegocio(MENSAJES.APROBACION_EQUIPO_PRESTADO);
  }
  return { reservaId: reserva.id, inicio: reserva.inicio, fin: reserva.fin };
}
