/**
 * Controlador de reservas del estudiante (HU-03).
 */
import { listarEquipos } from '../repos/equiposRepo.js';
import { crearReserva, listarReservasDeEstudiante } from '../repos/reservasRepo.js';
import { ESTADOS_USUARIO, ROLES } from '../logic/constantes.js';
import { fechaISO, formatearFecha, formatearHorario } from '../logic/formato.js';
import { MENSAJES } from '../logic/mensajes.js';
import { ahora } from '../logic/reloj.js';
import { validarReserva, validarSolicitudReserva } from '../logic/reservas.js';
import { protegerPagina } from './guardia.js';
import { crearCelda, crearCeldaEstado, crearFila, renderizarFilas } from './tablas.js';
import { crearElemento, limpiarMensaje, marcarProcesando, mostrarError, mostrarExito } from './ui.js';

const formulario = document.getElementById('form-reserva');
const selectorEquipo = document.getElementById('equipo');
const campoFecha = document.getElementById('fecha');
const campoHoraInicio = document.getElementById('hora-inicio');
const campoHoraFin = document.getElementById('hora-fin');
const botonReservar = document.getElementById('btn-reservar');
const cuerpoReservas = document.getElementById('cuerpo-reservas');
const textoSinReservas = document.getElementById('sin-reservas');
const avisoEstado = document.getElementById('aviso-estado');

function crearOpcionEquipo(equipo) {
  return crearElemento('option', {
    texto: `${equipo.nombre} (${equipo.codigoInventario}) – ${equipo.estado}`,
    atributos: { value: equipo.id, 'data-testid': `opcion-equipo-${equipo.id}` },
  });
}

async function cargarEquipos(equipoPreseleccionado) {
  const equipos = await listarEquipos();
  const opcionVacia = crearElemento('option', { texto: 'Selecciona un equipo', atributos: { value: '' } });
  selectorEquipo.replaceChildren(opcionVacia, ...equipos.map(crearOpcionEquipo));
  selectorEquipo.value = equipos.some((e) => e.id === equipoPreseleccionado) ? equipoPreseleccionado : '';
}

function crearFilaReserva(reserva) {
  const id = reserva.id;
  return crearFila(`fila-reserva-${id}`, [
    crearCelda(reserva.nombreEquipo, `equipo-reserva-${id}`),
    crearCelda(formatearFecha(reserva.fecha), `fecha-reserva-${id}`),
    crearCelda(formatearHorario(reserva.horaInicio, reserva.horaFin), `horario-reserva-${id}`),
    crearCeldaEstado(reserva.estado, `estado-reserva-${id}`),
    crearCelda(reserva.motivoRechazo, `motivo-reserva-${id}`),
  ]);
}

async function cargarMisReservas(uid) {
  const reservas = await listarReservasDeEstudiante(uid);
  renderizarFilas(cuerpoReservas, reservas.map(crearFilaReserva), textoSinReservas);
}

function leerFormulario() {
  return {
    equipoId: selectorEquipo.value,
    fecha: campoFecha.value,
    horaInicio: campoHoraInicio.value,
    horaFin: campoHoraFin.value,
  };
}

async function reservar(uid) {
  const datos = leerFormulario();
  const intervalo = validarSolicitudReserva(datos, ahora());
  await crearReserva({ uid, ...datos, intervalo }, (perfil, equipo) => validarReserva(perfil, equipo, intervalo));
}

function crearManejadorEnvio(uid) {
  return async (evento) => {
    evento.preventDefault();
    limpiarMensaje();
    marcarProcesando(botonReservar, true, 'Reservando...');
    try {
      await reservar(uid);
      formulario.reset();
      mostrarExito(MENSAJES.RESERVA_CREADA);
      await Promise.all([cargarEquipos(null), cargarMisReservas(uid)]);
    } catch (error) {
      mostrarError(error);
    } finally {
      marcarProcesando(botonReservar, false);
    }
  };
}

function mostrarAvisoEstado(perfil) {
  avisoEstado.hidden = perfil.estado !== ESTADOS_USUARIO.PENALIZADO;
}

const perfil = await protegerPagina([ROLES.ESTUDIANTE]);
if (perfil) {
  campoFecha.min = fechaISO(ahora());
  mostrarAvisoEstado(perfil);
  formulario.addEventListener('submit', crearManejadorEnvio(perfil.uid));
  const equipoUrl = new URLSearchParams(window.location.search).get('equipo');
  try {
    await Promise.all([cargarEquipos(equipoUrl), cargarMisReservas(perfil.uid)]);
  } catch (error) {
    mostrarError(error);
  }
}
