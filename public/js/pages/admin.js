/**
 * Controlador de gestión de solicitudes del encargado (HU-04).
 */
import { aprobarReserva, listarReservasPorEstado, rechazarReserva } from '../repos/reservasRepo.js';
import { ESTADOS_RESERVA, ROLES } from '../logic/constantes.js';
import { formatearFecha, formatearHorario } from '../logic/formato.js';
import { mensajeAprobada, mensajeRechazada } from '../logic/mensajes.js';
import { validarAprobacion, validarMotivoRechazo, validarRechazo } from '../logic/solicitudes.js';
import { protegerPagina } from './guardia.js';
import { crearCelda, crearCeldaAcciones, crearFila, renderizarFilas } from './tablas.js';
import { crearBoton, limpiarMensaje, marcarProcesando, mostrarError, mostrarExito } from './ui.js';

const cuerpoSolicitudes = document.getElementById('cuerpo-solicitudes');
const textoSinSolicitudes = document.getElementById('sin-solicitudes');
const panelRechazo = document.getElementById('panel-rechazo');
const formularioRechazo = document.getElementById('form-rechazo');
const detalleRechazo = document.getElementById('detalle-rechazo');
const campoMotivo = document.getElementById('motivo-rechazo');
const botonConfirmarRechazo = document.getElementById('btn-confirmar-rechazo');
const botonCancelarRechazo = document.getElementById('btn-cancelar-rechazo');

let solicitudEnRechazo = null;

function describirSolicitud(reserva) {
  return `${reserva.nombreEstudiante} · ${reserva.nombreEquipo} · `
    + `${formatearFecha(reserva.fecha)} ${formatearHorario(reserva.horaInicio, reserva.horaFin)}`;
}

function cerrarPanelRechazo() {
  solicitudEnRechazo = null;
  panelRechazo.hidden = true;
  campoMotivo.value = '';
}

function abrirPanelRechazo(reserva) {
  limpiarMensaje();
  solicitudEnRechazo = reserva;
  detalleRechazo.textContent = describirSolicitud(reserva);
  campoMotivo.value = '';
  panelRechazo.hidden = false;
  campoMotivo.focus();
}

async function aprobar(reserva, boton) {
  limpiarMensaje();
  cerrarPanelRechazo();
  marcarProcesando(boton, true, 'Aprobando...');
  try {
    const aprobada = await aprobarReserva(reserva.id, validarAprobacion);
    mostrarExito(mensajeAprobada(aprobada));
  } catch (error) {
    mostrarError(error);
  }
  await cargarSolicitudes();
}

async function confirmarRechazo(evento) {
  evento.preventDefault();
  limpiarMensaje();
  marcarProcesando(botonConfirmarRechazo, true, 'Rechazando...');
  try {
    const motivo = validarMotivoRechazo(campoMotivo.value);
    const rechazada = await rechazarReserva(solicitudEnRechazo.id, motivo, validarRechazo);
    cerrarPanelRechazo();
    mostrarExito(mensajeRechazada(rechazada));
    await cargarSolicitudes();
  } catch (error) {
    mostrarError(error);
  } finally {
    marcarProcesando(botonConfirmarRechazo, false);
  }
}

function crearFilaSolicitud(reserva) {
  const id = reserva.id;
  const botonAprobar = crearBoton({
    texto: 'Aprobar', id: `btn-aprobar-${id}`, clases: ['btn-success', 'me-2'],
    alHacerClic: (boton) => aprobar(reserva, boton),
  });
  const botonRechazar = crearBoton({
    texto: 'Rechazar', id: `btn-rechazar-${id}`, clases: ['btn-outline-danger'],
    alHacerClic: () => abrirPanelRechazo(reserva),
  });
  return crearFila(`fila-solicitud-${id}`, [
    crearCelda(reserva.nombreEstudiante, `estudiante-solicitud-${id}`),
    crearCelda(reserva.nombreEquipo, `equipo-solicitud-${id}`),
    crearCelda(formatearFecha(reserva.fecha), `fecha-solicitud-${id}`),
    crearCelda(formatearHorario(reserva.horaInicio, reserva.horaFin), `horario-solicitud-${id}`),
    crearCeldaAcciones(botonAprobar, botonRechazar),
  ]);
}

async function cargarSolicitudes() {
  try {
    const pendientes = await listarReservasPorEstado(ESTADOS_RESERVA.PENDIENTE);
    renderizarFilas(cuerpoSolicitudes, pendientes.map(crearFilaSolicitud), textoSinSolicitudes);
  } catch (error) {
    mostrarError(error);
  }
}

const perfil = await protegerPagina([ROLES.ENCARGADO]);
if (perfil) {
  formularioRechazo.addEventListener('submit', confirmarRechazo);
  botonCancelarRechazo.addEventListener('click', cerrarPanelRechazo);
  await cargarSolicitudes();
}
