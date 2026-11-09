/**
 * Construcción segura de tablas (createElement + textContent).
 */
import { ESTADOS_EQUIPO, ESTADOS_RESERVA, ESTADOS_USUARIO } from '../logic/constantes.js';
import { crearElemento } from './ui.js';

const CLASE_POR_ESTADO = Object.freeze({
  [ESTADOS_EQUIPO.DISPONIBLE]: 'text-bg-success',
  [ESTADOS_EQUIPO.PRESTADO]: 'text-bg-secondary',
  [ESTADOS_RESERVA.PENDIENTE]: 'text-bg-warning',
  [ESTADOS_RESERVA.APROBADA]: 'text-bg-primary',
  [ESTADOS_RESERVA.RECHAZADA]: 'text-bg-danger',
  [ESTADOS_RESERVA.DEVUELTA]: 'text-bg-secondary',
  [ESTADOS_USUARIO.ACTIVO]: 'text-bg-success',
  [ESTADOS_USUARIO.PENALIZADO]: 'text-bg-danger',
});

/** Celda de texto. Si se indica testid, se usa como id y data-testid. */
export function crearCelda(texto, testid = null) {
  const atributos = testid ? { id: testid, 'data-testid': testid } : {};
  return crearElemento('td', { texto: texto ?? '—', atributos });
}

/** Celda con una insignia de color según el estado. */
export function crearCeldaEstado(estado, testid) {
  const celda = crearElemento('td');
  const insignia = crearElemento('span', {
    texto: estado,
    clases: ['badge', CLASE_POR_ESTADO[estado] ?? 'text-bg-light'],
    atributos: { id: testid, 'data-testid': testid },
  });
  celda.append(insignia);
  return celda;
}

/** Celda que contiene los elementos indicados (botones, enlaces...). */
export function crearCeldaAcciones(...elementos) {
  const celda = crearElemento('td', { clases: ['text-nowrap'] });
  celda.append(...elementos);
  return celda;
}

export function crearFila(id, celdas) {
  const fila = crearElemento('tr', { atributos: { id, 'data-testid': id } });
  fila.append(...celdas);
  return fila;
}

/** Reemplaza el contenido del tbody y muestra/oculta el texto de "sin resultados". */
export function renderizarFilas(cuerpo, filas, elementoVacio = null) {
  cuerpo.replaceChildren(...filas);
  if (elementoVacio) {
    elementoVacio.hidden = filas.length > 0;
  }
}
