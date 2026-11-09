/**
 * Acceso a la colección reservas/{id}.
 * Las operaciones que cambian varios documentos usan transacciones y reciben
 * la validación de negocio (logic/) como función, para no mezclar capas.
 */
import { db } from './firebase.js';
import { collection, doc, getDocs, orderBy, query, where } from './sdk.js';
import { COLECCIONES, ESTADOS_EQUIPO, ESTADOS_RESERVA, ESTADOS_USUARIO } from '../logic/constantes.js';
import { aFecha, aTimestamp, bloquesAFirestore } from './conversion.js';
import { equipoDesdeDocumento, referenciaEquipo } from './equiposRepo.js';
import { ejecutarTransaccion } from './transacciones.js';
import { perfilDesdeDocumento, referenciaUsuario } from './usuariosRepo.js';

const coleccionReservas = () => collection(db, COLECCIONES.RESERVAS);
const referenciaReserva = (reservaId) => doc(db, COLECCIONES.RESERVAS, reservaId);

function reservaDesdeDocumento(instantanea) {
  if (!instantanea.exists()) {
    return null;
  }
  const datos = instantanea.data();
  return {
    id: instantanea.id,
    ...datos,
    inicio: aFecha(datos.inicio),
    fin: aFecha(datos.fin),
    fechaDevolucion: aFecha(datos.fechaDevolucion),
  };
}

/** Libera el cupo del estudiante solo si apunta a esta reserva. */
function cambiosDeCupo(perfil, reservaId) {
  return perfil?.reservaActivaId === reservaId ? { reservaActivaId: null } : {};
}

function actualizarSiHayCambios(transaccion, referencia, cambios) {
  if (Object.keys(cambios).length > 0) {
    transaccion.update(referencia, cambios);
  }
}

async function ejecutarConsulta(consulta) {
  const resultado = await getDocs(consulta);
  return resultado.docs.map(reservaDesdeDocumento);
}

/** Reservas del estudiante, de la más reciente a la más antigua. */
export function listarReservasDeEstudiante(uid) {
  return ejecutarConsulta(query(coleccionReservas(), where('uidEstudiante', '==', uid), orderBy('inicio', 'desc')));
}

/** Reservas en un estado (Pendiente, Aprobada...), de la más próxima a la más lejana. */
export function listarReservasPorEstado(estado) {
  return ejecutarConsulta(query(coleccionReservas(), where('estado', '==', estado), orderBy('inicio')));
}

/**
 * HU-03: crea una reserva "Pendiente" y ocupa el cupo del estudiante (usuarios.reservaActivaId).
 * `validar(perfil, equipo)` lanza ErrorNegocio si no se puede reservar.
 * @returns {Promise<string>} id de la reserva creada
 */
export function crearReserva({ uid, equipoId, fecha, horaInicio, horaFin, intervalo }, validar) {
  return ejecutarTransaccion(async (transaccion) => {
    const refUsuario = referenciaUsuario(uid);
    const perfil = perfilDesdeDocumento(await transaccion.get(refUsuario));
    const equipo = equipoDesdeDocumento(await transaccion.get(referenciaEquipo(equipoId)));
    validar(perfil, equipo);

    const refReserva = doc(coleccionReservas());
    transaccion.set(refReserva, {
      uidEstudiante: uid,
      nombreEstudiante: perfil.nombre,
      equipoId,
      nombreEquipo: equipo.nombre,
      fecha,
      horaInicio,
      horaFin,
      inicio: aTimestamp(intervalo.inicio),
      fin: aTimestamp(intervalo.fin),
      estado: ESTADOS_RESERVA.PENDIENTE,
      motivoRechazo: null,
      fechaDevolucion: null,
    });
    transaccion.update(refUsuario, { reservaActivaId: refReserva.id });
    return refReserva.id;
  });
}

/**
 * HU-04: aprueba la reserva y marca el equipo "Prestado" agregando el bloque horario.
 * `validar(reserva, equipo)` vuelve a verificar cruces y devuelve el bloque a agregar.
 * @returns {Promise<object>} la reserva aprobada
 */
export function aprobarReserva(reservaId, validar) {
  return ejecutarTransaccion(async (transaccion) => {
    const reserva = reservaDesdeDocumento(await transaccion.get(referenciaReserva(reservaId)));
    const refEquipo = referenciaEquipo(reserva?.equipoId ?? '-');
    const equipo = equipoDesdeDocumento(await transaccion.get(refEquipo));
    const bloque = validar(reserva, equipo);

    transaccion.update(referenciaReserva(reservaId), { estado: ESTADOS_RESERVA.APROBADA });
    transaccion.update(refEquipo, {
      estado: ESTADOS_EQUIPO.PRESTADO,
      bloquesAprobados: bloquesAFirestore([...equipo.bloquesAprobados, bloque]),
    });
    return reserva;
  });
}

/**
 * HU-04: rechaza la reserva con su justificación y libera el cupo del estudiante.
 * No toca el equipo: una reserva rechazada nunca agrega bloques.
 * @returns {Promise<object>} la reserva rechazada
 */
export function rechazarReserva(reservaId, motivo, validar) {
  return ejecutarTransaccion(async (transaccion) => {
    const reserva = reservaDesdeDocumento(await transaccion.get(referenciaReserva(reservaId)));
    const refUsuario = referenciaUsuario(reserva?.uidEstudiante ?? '-');
    const perfil = perfilDesdeDocumento(await transaccion.get(refUsuario));
    validar(reserva);

    transaccion.update(referenciaReserva(reservaId), { estado: ESTADOS_RESERVA.RECHAZADA, motivoRechazo: motivo });
    actualizarSiHayCambios(transaccion, refUsuario, cambiosDeCupo(perfil, reservaId));
    return reserva;
  });
}

/**
 * HU-05: registra la devolución. El equipo vuelve a "Disponible" (sin el bloque de la reserva),
 * se libera el cupo y, si `calcular` indica devolución tardía, el estudiante pasa a "Penalizado".
 * @returns {Promise<{reserva: object, penalizado: boolean}>}
 */
export function registrarDevolucion(reservaId, calcular) {
  return ejecutarTransaccion(async (transaccion) => {
    const reserva = reservaDesdeDocumento(await transaccion.get(referenciaReserva(reservaId)));
    const refEquipo = referenciaEquipo(reserva?.equipoId ?? '-');
    const refUsuario = referenciaUsuario(reserva?.uidEstudiante ?? '-');
    const equipo = equipoDesdeDocumento(await transaccion.get(refEquipo));
    const perfil = perfilDesdeDocumento(await transaccion.get(refUsuario));
    const resultado = calcular(reserva, equipo);

    transaccion.update(referenciaReserva(reservaId), {
      estado: ESTADOS_RESERVA.DEVUELTA,
      fechaDevolucion: aTimestamp(resultado.fechaDevolucion),
    });
    transaccion.update(refEquipo, {
      estado: ESTADOS_EQUIPO.DISPONIBLE,
      bloquesAprobados: bloquesAFirestore(resultado.bloquesRestantes),
    });
    const penalizacion = resultado.penalizar ? { estado: ESTADOS_USUARIO.PENALIZADO } : {};
    actualizarSiHayCambios(transaccion, refUsuario, { ...cambiosDeCupo(perfil, reservaId), ...penalizacion });
    return { reserva, penalizado: resultado.penalizar };
  });
}
