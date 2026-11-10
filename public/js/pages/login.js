/**
 * Controlador de la página de login (HU-01).
 *
 * Cada envío del formulario se encola y se procesa en orden: así ningún intento se pierde
 * aunque se envíe varias veces seguidas (por ejemplo, desde Selenium IDE sin esperas).
 */
import { cerrarSesion, iniciarSesion, obtenerUidSesion } from '../repos/authRepo.js';
import { obtenerUsuario } from '../repos/usuariosRepo.js';
import { obtenerSeguridad, registrarFallo, reiniciarSeguridad } from '../repos/seguridadLoginRepo.js';
import {
  codigoACorreo,
  estaBloqueado,
  minutosRestantesBloqueo,
  normalizarCodigo,
  paginaInicioPorRol,
  registrarIntentoFallido,
  requiereReinicioSeguridad,
  validarDatosLogin,
} from '../logic/autenticacion.js';
import { ErrorCredenciales, ErrorCuentaBloqueada } from '../logic/errores.js';
import { alertaSeguridadBloqueo } from '../logic/mensajes.js';
import { limpiarAlertaSeguridad, limpiarMensaje, mostrarAlertaSeguridad, mostrarError } from './ui.js';

const formulario = document.getElementById('form-login');
const campoCodigo = document.getElementById('codigo');
const campoClave = document.getElementById('clave');

let colaDeIntentos = Promise.resolve();

/**
 * El bloqueo usa la hora REAL del dispositivo (no el reloj inyectable de HU-05),
 * porque las reglas de Firestore lo validan contra la hora del servidor.
 */
function horaActual() {
  return new Date();
}

/** Muestra la alerta de seguridad y lanza el error con el mensaje de bloqueo para #mensaje. */
function rechazarPorBloqueo(seguridad) {
  mostrarAlertaSeguridad(alertaSeguridadBloqueo(minutosRestantesBloqueo(seguridad, horaActual())));
  throw new ErrorCuentaBloqueada();
}

function verificarBloqueo(seguridad) {
  if (estaBloqueado(seguridad, horaActual())) {
    rechazarPorBloqueo(seguridad);
  }
}

/** Suma el intento fallido (de forma atómica) y, si alcanza el máximo, bloquea la cuenta. */
async function registrarIntentoFallidoDe(codigo) {
  const nuevaSeguridad = await registrarFallo(codigo, (actual) => (
    estaBloqueado(actual, horaActual()) ? null : registrarIntentoFallido(actual, horaActual())
  ));
  verificarBloqueo(nuevaSeguridad);
}

async function autenticar(codigo, clave) {
  try {
    return await iniciarSesion(codigoACorreo(codigo), clave);
  } catch (error) {
    if (error instanceof ErrorCredenciales) {
      await registrarIntentoFallidoDe(codigo);
    }
    throw error;
  }
}

async function redirigirSegunRol(uid) {
  const perfil = await obtenerUsuario(uid);
  const pagina = paginaInicioPorRol(perfil?.rol);
  if (!pagina) {
    await cerrarSesion();
    throw new ErrorCredenciales();
  }
  window.location.replace(pagina);
}

async function intentarIngreso(codigoIngresado, clave) {
  validarDatosLogin(codigoIngresado, clave);
  const codigo = normalizarCodigo(codigoIngresado);
  const seguridad = await obtenerSeguridad(codigo);
  verificarBloqueo(seguridad);
  const uid = await autenticar(codigo, clave);
  if (requiereReinicioSeguridad(seguridad)) {
    await reiniciarSeguridad(codigo);
  }
  await redirigirSegunRol(uid);
}

async function procesarIntento({ codigo, clave }) {
  limpiarMensaje();
  limpiarAlertaSeguridad();
  formulario.setAttribute('aria-busy', 'true');
  try {
    await intentarIngreso(codigo, clave);
  } catch (error) {
    mostrarError(error);
  } finally {
    formulario.removeAttribute('aria-busy');
  }
}

function manejarEnvio(evento) {
  evento.preventDefault();
  // Se capturan los valores en el momento del envío y se procesan en orden de llegada.
  const datos = { codigo: campoCodigo.value, clave: campoClave.value };
  colaDeIntentos = colaDeIntentos.then(() => procesarIntento(datos));
}

async function redirigirSiHaySesion() {
  const uid = await obtenerUidSesion();
  if (uid) {
    await redirigirSegunRol(uid).catch(() => cerrarSesion());
  }
}

formulario.addEventListener('submit', manejarEnvio);
await redirigirSiHaySesion();
