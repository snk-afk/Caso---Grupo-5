/**
 * Controlador del catálogo de equipos (HU-02).
 */
import { listarEquipos } from '../repos/equiposRepo.js';
import { ESTADOS_EQUIPO, ROLES } from '../logic/constantes.js';
import { leerFiltroCategoria } from '../logic/catalogo.js';
import { MENSAJES, mensajeCategoriaInvalida } from '../logic/mensajes.js';
import { protegerPagina } from './guardia.js';
import { crearCelda, crearCeldaAcciones, crearCeldaEstado, crearFila, renderizarFilas } from './tablas.js';
import { crearElemento, limpiarMensaje, mostrarError, mostrarMensaje } from './ui.js';

const cuerpoTabla = document.getElementById('cuerpo-equipos');
const contador = document.getElementById('contador-equipos');
const botonesFiltro = document.querySelectorAll('[data-categoria]');

function crearBotonReservar(equipo) {
  if (equipo.estado !== ESTADOS_EQUIPO.DISPONIBLE) {
    return crearElemento('span', { texto: '—', clases: ['text-muted'] });
  }
  const id = `btn-reservar-${equipo.id}`;
  return crearElemento('a', {
    texto: 'Reservar',
    clases: ['btn', 'btn-sm', 'btn-outline-primary'],
    atributos: { id, 'data-testid': id, href: `reservas.html?equipo=${encodeURIComponent(equipo.id)}` },
  });
}

function crearFilaEquipo(equipo) {
  const codigo = equipo.codigoInventario;
  return crearFila(`fila-equipo-${codigo}`, [
    crearCelda(equipo.nombre, `nombre-equipo-${codigo}`),
    crearCelda(codigo, `codigo-equipo-${codigo}`),
    crearCelda(equipo.categoria, `categoria-equipo-${codigo}`),
    crearCeldaEstado(equipo.estado, `estado-equipo-${codigo}`),
    crearCeldaAcciones(crearBotonReservar(equipo)),
  ]);
}

function marcarFiltroActivo(categoria) {
  for (const boton of botonesFiltro) {
    const activo = (boton.dataset.categoria || null) === categoria;
    boton.classList.toggle('active', activo);
    boton.setAttribute('aria-pressed', String(activo));
  }
}

function actualizarUrl(categoria) {
  const url = new URL(window.location.href);
  if (categoria) {
    url.searchParams.set('categoria', categoria);
  } else {
    url.searchParams.delete('categoria');
  }
  window.history.pushState({}, '', url);
}

async function cargarEquipos(categoria) {
  marcarFiltroActivo(categoria);
  const equipos = await listarEquipos(categoria);
  renderizarFilas(cuerpoTabla, equipos.map(crearFilaEquipo));
  contador.textContent = `${equipos.length} equipo(s)`;
  if (equipos.length === 0) {
    mostrarMensaje(categoria ? MENSAJES.CATALOGO_SIN_EQUIPOS : MENSAJES.CATALOGO_VACIO, 'info');
  }
}

async function cargarDesdeUrl() {
  limpiarMensaje();
  const parametro = new URLSearchParams(window.location.search).get('categoria');
  const { categoria, invalida } = leerFiltroCategoria(parametro);
  try {
    await cargarEquipos(categoria);
    if (invalida) {
      mostrarMensaje(mensajeCategoriaInvalida(parametro), 'warning');
    }
  } catch (error) {
    mostrarError(error);
  }
}

function aplicarFiltro(evento) {
  actualizarUrl(evento.currentTarget.dataset.categoria || null);
  return cargarDesdeUrl();
}

const perfil = await protegerPagina([ROLES.ESTUDIANTE]);
if (perfil) {
  botonesFiltro.forEach((boton) => boton.addEventListener('click', aplicarFiltro));
  window.addEventListener('popstate', cargarDesdeUrl);
  await cargarDesdeUrl();
}
