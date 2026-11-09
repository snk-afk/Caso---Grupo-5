/**
 * Controlador de devoluciones y penalizaciones (HU-05 y regla derivada RD-02).
 */
import { listarReservasPorEstado, registrarDevolucion } from '../repos/reservasRepo.js';
import { listarUsuariosPenalizados, quitarPenalizacion } from '../repos/usuariosRepo.js';
import { ESTADOS_RESERVA, ROLES } from '../logic/constantes.js';
import { calcularDevolucion, esDevolucionTardia, filtrarReservas, validarQuitarPenalizacion } from '../logic/devoluciones.js';
import { fechaISO, formatearFecha, formatearHorario, horaHHMM } from '../logic/formato.js';
import { mensajeDevolucion, mensajePenalizacionRetirada } from '../logic/mensajes.js';
import { ahora, relojSimulado } from '../logic/reloj.js';
import { actualizarIndicadorReloj, protegerPagina } from './guardia.js';
import { describirReloj, fijarHoraSimulada, restaurarHoraReal } from './relojPruebas.js';
import { crearCelda, crearCeldaAcciones, crearCeldaEstado, crearFila, renderizarFilas } from './tablas.js';
import { crearBoton, crearElemento, limpiarMensaje, marcarProcesando, mostrarError, mostrarExito, mostrarMensaje } from './ui.js';

const campoBuscar = document.getElementById('buscar-reserva');
const cuerpoActivas = document.getElementById('cuerpo-activas');
const textoSinActivas = document.getElementById('sin-activas');
const cuerpoPenalizados = document.getElementById('cuerpo-penalizados');
const textoSinPenalizados = document.getElementById('sin-penalizados');
const textoHoraActual = document.getElementById('hora-actual');
const campoReloj = document.getElementById('reloj-simulado');
const formularioReloj = document.getElementById('form-reloj');
const botonRestaurarReloj = document.getElementById('btn-restaurar-reloj');

const MS_ACTUALIZACION_RELOJ = 1000;
let reservasActivas = [];

// ---------- Reloj de pruebas ----------
function mostrarHoraActual() {
  textoHoraActual.textContent = describirReloj();
  textoHoraActual.classList.toggle('text-danger', relojSimulado());
}

function alCambiarReloj() {
  mostrarHoraActual();
  actualizarIndicadorReloj();
  renderizarActivas();
}

function fijarReloj(evento) {
  evento.preventDefault();
  limpiarMensaje();
  try {
    fijarHoraSimulada(campoReloj.value);
    alCambiarReloj();
  } catch {
    mostrarMensaje('Ingresa una fecha y hora válidas para simular el reloj.', 'warning');
  }
}

function restaurarReloj() {
  restaurarHoraReal();
  alCambiarReloj();
}

function inicializarReloj() {
  const actual = ahora();
  campoReloj.value = `${fechaISO(actual)}T${horaHHMM(actual)}`;
  formularioReloj.addEventListener('submit', fijarReloj);
  botonRestaurarReloj.addEventListener('click', restaurarReloj);
  mostrarHoraActual();
  setInterval(mostrarHoraActual, MS_ACTUALIZACION_RELOJ);
}

// ---------- Reservas activas ----------
async function marcarDevolucion(reserva, boton) {
  limpiarMensaje();
  marcarProcesando(boton, true, 'Registrando...');
  try {
    const { reserva: devuelta, penalizado } = await registrarDevolucion(
      reserva.id,
      (actual, equipo) => calcularDevolucion(actual, equipo, ahora()),
    );
    mostrarMensaje(mensajeDevolucion(devuelta, penalizado), penalizado ? 'warning' : 'success');
  } catch (error) {
    mostrarError(error);
  }
  await cargarDatos();
}

function crearFilaActiva(reserva) {
  const id = reserva.id;
  const vencida = esDevolucionTardia(reserva.fin, ahora());
  const boton = crearBoton({
    texto: 'Marcar Devolución', id: `btn-devolucion-${id}`, clases: ['btn-primary'],
    alHacerClic: (b) => marcarDevolucion(reserva, b),
  });
  const situacion = crearElemento('span', {
    texto: vencida ? 'Vencida' : 'A tiempo',
    clases: ['badge', vencida ? 'text-bg-danger' : 'text-bg-success'],
    atributos: { id: `situacion-activa-${id}`, 'data-testid': `situacion-activa-${id}` },
  });
  return crearFila(`fila-activa-${id}`, [
    crearCelda(reserva.nombreEstudiante, `estudiante-activa-${id}`),
    crearCelda(reserva.uidEstudiante, `codigo-activa-${id}`),
    crearCelda(reserva.nombreEquipo, `equipo-activa-${id}`),
    crearCelda(formatearFecha(reserva.fecha), `fecha-activa-${id}`),
    crearCelda(formatearHorario(reserva.horaInicio, reserva.horaFin), `horario-activa-${id}`),
    crearCeldaAcciones(situacion),
    crearCeldaAcciones(boton),
  ]);
}

function renderizarActivas() {
  const visibles = filtrarReservas(reservasActivas, campoBuscar.value);
  renderizarFilas(cuerpoActivas, visibles.map(crearFilaActiva), textoSinActivas);
}

// ---------- Penalizados ----------
async function retirarPenalizacion(usuario, boton) {
  limpiarMensaje();
  marcarProcesando(boton, true, 'Procesando...');
  try {
    const actualizado = await quitarPenalizacion(usuario.uid, validarQuitarPenalizacion);
    mostrarExito(mensajePenalizacionRetirada(actualizado));
  } catch (error) {
    mostrarError(error);
  }
  await cargarDatos();
}

function crearFilaPenalizado(usuario) {
  const uid = usuario.uid;
  const boton = crearBoton({
    texto: 'Quitar penalización', id: `btn-quitar-penalizacion-${uid}`, clases: ['btn-outline-success'],
    alHacerClic: (b) => retirarPenalizacion(usuario, b),
  });
  return crearFila(`fila-penalizado-${uid}`, [
    crearCelda(usuario.nombre, `nombre-penalizado-${uid}`),
    crearCelda(usuario.codigo, `codigo-penalizado-${uid}`),
    crearCeldaEstado(usuario.estado, `estado-penalizado-${uid}`),
    crearCeldaAcciones(boton),
  ]);
}

async function cargarDatos() {
  try {
    const [activas, penalizados] = await Promise.all([
      listarReservasPorEstado(ESTADOS_RESERVA.APROBADA),
      listarUsuariosPenalizados(),
    ]);
    reservasActivas = activas;
    renderizarActivas();
    renderizarFilas(cuerpoPenalizados, penalizados.map(crearFilaPenalizado), textoSinPenalizados);
  } catch (error) {
    mostrarError(error);
  }
}

const perfil = await protegerPagina([ROLES.ENCARGADO]);
if (perfil) {
  inicializarReloj();
  campoBuscar.addEventListener('input', renderizarActivas);
  await cargarDatos();
}
