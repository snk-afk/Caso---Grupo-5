/**
 * Acceso a la colección reservas/{id}.
 */
import { db } from './firebase.js';
import { collection, doc, getDocs, orderBy, query, runTransaction, where } from './sdk.js';
import { COLECCIONES, ESTADOS_RESERVA } from '../logic/constantes.js';
import { aFecha, aTimestamp, traducirErrorFirestore } from './conversion.js';
import { equipoDesdeDocumento, referenciaEquipo } from './equiposRepo.js';
import { referenciaUsuario } from './usuariosRepo.js';

const coleccionReservas = () => collection(db, COLECCIONES.RESERVAS);

function reservaDesdeDocumento(instantanea) {
  const datos = instantanea.data();
  return {
    id: instantanea.id,
    ...datos,
    inicio: aFecha(datos.inicio),
    fin: aFecha(datos.fin),
    fechaDevolucion: aFecha(datos.fechaDevolucion),
  };
}

/** Reservas del estudiante, de la más reciente a la más antigua. */
export async function listarReservasDeEstudiante(uid) {
  const consulta = query(coleccionReservas(), where('uidEstudiante', '==', uid), orderBy('inicio', 'desc'));
  const resultado = await getDocs(consulta);
  return resultado.docs.map(reservaDesdeDocumento);
}

/**
 * Crea una reserva "Pendiente" dentro de una transacción (HU-03).
 * Lee el perfil y el equipo, ejecuta `validar(perfil, equipo)` (lógica de negocio pura)
 * y, si pasa, crea la reserva y ocupa el cupo del estudiante (usuarios.reservaActivaId).
 * Si otra escritura cambia esos documentos en paralelo, Firestore reintenta la transacción.
 * @returns {Promise<string>} id de la reserva creada
 */
export async function crearReserva({ uid, equipoId, fecha, horaInicio, horaFin, intervalo }, validar) {
  try {
    return await runTransaction(db, async (transaccion) => {
      const refUsuario = referenciaUsuario(uid);
      const refEquipo = referenciaEquipo(equipoId);
      const instUsuario = await transaccion.get(refUsuario);
      const instEquipo = await transaccion.get(refEquipo);
      const perfil = instUsuario.exists() ? { uid, ...instUsuario.data() } : null;
      const equipo = equipoDesdeDocumento(instEquipo);

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
  } catch (error) {
    throw traducirErrorFirestore(error);
  }
}
