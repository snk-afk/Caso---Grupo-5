/**
 * Controlador de la página de login (HU-01).
 */
import { cerrarSesion, iniciarSesion, obtenerUidSesion } from '../repos/authRepo.js';
import { obtenerUsuario } from '../repos/usuariosRepo.js';
import { guardarSeguridad, obtenerSeguridad, reiniciarSeguridad } from '../repos/seguridadLoginRepo.js';
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
import { ErrorCredenciales, ErrorNegocio } from '../logic/errores.js';
import { alertaSeguridadBloqueo, mensajeCuentaBloqueada } from '../logic/mensajes.js';
import {
  limpiarAlertaSeguridad,
  limpiarMensaje,
  marcarProcesando,
  mostrarAlertaSeguridad,
  mostrarError,
} from './ui.js';

const formulario = document.getElementById('form-login');
const campoCodigo = document.getElementById('codigo');
const campoClave = document.getElementById('clave');
const botonIngresar = document.getElementById('btn-ingresar');

/**
 * El bloqueo usa la hora REAL del dispositivo (no el reloj inyectable de HU-05),
 * porque las reglas de Firestore lo validan contra la hora del servidor.
 */
function horaActual() {
  return new Date();
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

function verificarBloqueo(seguridad) {
  if (estaBloqueado(seguridad, horaActual())) {
    mostrarAlertaSeguridad(alertaSeguridadBloqueo());
    throw new ErrorNegocio(mensajeCuentaBloqueada(minutosRestantesBloqueo(seguridad, horaActual())));
  }
}

async function registrarFallo(codigo, seguridad) {
  const ahora = horaActual();
  const nuevaSeguridad = registrarIntentoFallido(seguridad, ahora);
  await guardarSeguridad(codigo, nuevaSeguridad);
  if (estaBloqueado(nuevaSeguridad, ahora)) {
    mostrarAlertaSeguridad(alertaSeguridadBloqueo());
  }
}

async function autenticar(codigo, clave, seguridad) {
  try {
    return await iniciarSesion(codigoACorreo(codigo), clave);
  } catch (error) {
    if (error instanceof ErrorCredenciales) {
      await registrarFallo(codigo, seguridad);
    }
    throw error;
  }
}

async function intentarIngreso(codigoIngresado, clave) {
  validarDatosLogin(codigoIngresado, clave);
  const codigo = normalizarCodigo(codigoIngresado);
  const seguridad = await obtenerSeguridad(codigo);
  verificarBloqueo(seguridad);
  const uid = await autenticar(codigo, clave, seguridad);
  if (requiereReinicioSeguridad(seguridad)) {
    await reiniciarSeguridad(codigo);
  }
  await redirigirSegunRol(uid);
}

async function manejarEnvio(evento) {
  evento.preventDefault();
  limpiarMensaje();
  limpiarAlertaSeguridad();
  marcarProcesando(botonIngresar, true, 'Ingresando...');
  try {
    await intentarIngreso(campoCodigo.value, campoClave.value);
  } catch (error) {
    campoClave.value = '';
    mostrarError(error);
  } finally {
    marcarProcesando(botonIngresar, false);
  }
}

async function redirigirSiHaySesion() {
  const uid = await obtenerUidSesion();
  if (uid) {
    await redirigirSegunRol(uid).catch(() => cerrarSesion());
  }
}

formulario.addEventListener('submit', manejarEnvio);
await redirigirSiHaySesion();
