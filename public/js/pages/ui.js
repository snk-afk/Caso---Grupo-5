/**
 * Utilidades de interfaz compartidas por los controladores.
 * Todo texto se asigna con textContent (nunca innerHTML) para evitar XSS.
 */
import { ErrorNegocio } from '../logic/errores.js';
import { MENSAJES } from '../logic/mensajes.js';

const CLASES_ALERTA = ['alert-success', 'alert-danger', 'alert-warning', 'alert-info'];

function mostrarAlerta(id, texto, tipo) {
  const contenedor = document.getElementById(id);
  if (!contenedor) {
    return;
  }
  contenedor.classList.remove('d-none', ...CLASES_ALERTA);
  contenedor.classList.add('alert', `alert-${tipo}`);
  contenedor.dataset.tipo = tipo;
  contenedor.textContent = texto;
}

function ocultarAlerta(id) {
  const contenedor = document.getElementById(id);
  if (!contenedor) {
    return;
  }
  contenedor.classList.add('d-none');
  contenedor.textContent = '';
  delete contenedor.dataset.tipo;
}

/** Muestra un mensaje en el contenedor #mensaje. tipo: success | danger | warning | info */
export function mostrarMensaje(texto, tipo = 'danger') {
  mostrarAlerta('mensaje', texto, tipo);
}

export function mostrarExito(texto) {
  mostrarMensaje(texto, 'success');
}

export function limpiarMensaje() {
  ocultarAlerta('mensaje');
}

/** Alerta de seguridad independiente de #mensaje (HU-01). */
export function mostrarAlertaSeguridad(texto) {
  mostrarAlerta('alerta-seguridad', texto, 'warning');
}

export function limpiarAlertaSeguridad() {
  ocultarAlerta('alerta-seguridad');
}

/** Muestra el mensaje de un error: el texto de negocio o uno genérico. */
export function mostrarError(error) {
  const texto = error instanceof ErrorNegocio ? error.message : MENSAJES.ERROR_INESPERADO;
  mostrarMensaje(texto, 'danger');
}

/** Crea un elemento con atributos y texto seguros. */
export function crearElemento(etiqueta, { texto = '', clases = [], atributos = {} } = {}) {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  elemento.classList.add(...clases);
  for (const [nombre, valor] of Object.entries(atributos)) {
    elemento.setAttribute(nombre, valor);
  }
  return elemento;
}

/** Deshabilita un botón mientras se procesa una acción y muestra un texto alternativo. */
export function marcarProcesando(boton, procesando, textoProcesando = 'Procesando...') {
  if (procesando) {
    boton.dataset.textoOriginal = boton.textContent;
    boton.textContent = textoProcesando;
  } else if (boton.dataset.textoOriginal) {
    boton.textContent = boton.dataset.textoOriginal;
  }
  boton.disabled = procesando;
}
