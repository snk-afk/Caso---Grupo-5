/**
 * Lógica pura de devolución y penalización (HU-05). No importa Firebase.
 * La hora actual se recibe como parámetro (viene de logic/reloj.js).
 */
import { ESTADOS_RESERVA, ESTADOS_USUARIO } from './constantes.js';
import { ErrorNegocio } from './errores.js';
import { MENSAJES } from './mensajes.js';

/** La devolución es tardía si la hora actual es posterior a la hora de fin. */
export function esDevolucionTardia(fin, ahora) {
  return ahora > fin;
}

/**
 * Valida la devolución y calcula sus efectos:
 * - el equipo vuelve a "Disponible" y se quita el bloque de esta reserva;
 * - si es tardía, el estudiante pasa a "Penalizado".
 */
export function calcularDevolucion(reserva, equipo, ahora) {
  if (reserva?.estado !== ESTADOS_RESERVA.APROBADA) {
    throw new ErrorNegocio(MENSAJES.DEVOLUCION_NO_ACTIVA);
  }
  return {
    fechaDevolucion: ahora,
    penalizar: esDevolucionTardia(reserva.fin, ahora),
    bloquesRestantes: (equipo?.bloquesAprobados ?? []).filter((b) => b.reservaId !== reserva.id),
  };
}

/** Filtra reservas activas por nombre o código del estudiante, o por nombre del equipo. */
export function filtrarReservas(reservas, texto) {
  const buscado = String(texto ?? '').trim().toLowerCase();
  if (!buscado) {
    return reservas;
  }
  return reservas.filter((r) => [r.nombreEstudiante, r.uidEstudiante, r.nombreEquipo, r.equipoId]
    .some((campo) => String(campo ?? '').toLowerCase().includes(buscado)));
}

export function validarQuitarPenalizacion(usuario) {
  if (usuario?.estado !== ESTADOS_USUARIO.PENALIZADO) {
    throw new ErrorNegocio(MENSAJES.USUARIO_NO_PENALIZADO);
  }
}
