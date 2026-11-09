/**
 * Lógica pura de autenticación (HU-01). No importa Firebase.
 */
import { DOMINIO_CORREO, ROLES, SEGURIDAD } from './constantes.js';
import { ErrorNegocio } from './errores.js';
import { MENSAJES } from './mensajes.js';

const PATRON_CODIGO = /^[a-z0-9]{3,20}$/;
const MS_POR_MINUTO = 60_000;

const PAGINA_INICIO_POR_ROL = Object.freeze({
  [ROLES.ESTUDIANTE]: 'catalogo.html',
  [ROLES.ENCARGADO]: 'admin.html',
});

/** Normaliza el código de estudiante: sin espacios y en minúsculas. */
export function normalizarCodigo(codigo) {
  return String(codigo ?? '').trim().toLowerCase();
}

/** Convierte el código de estudiante en el correo usado por Firebase Auth. */
export function codigoACorreo(codigo) {
  return `${normalizarCodigo(codigo)}@${DOMINIO_CORREO}`;
}

/**
 * Valida los datos del formulario antes de consultar a Firebase.
 * Un código con formato inválido se trata como credencial inválida.
 */
export function validarDatosLogin(codigo, clave) {
  if (!normalizarCodigo(codigo) || !clave) {
    throw new ErrorNegocio(MENSAJES.LOGIN_CAMPOS_VACIOS);
  }
  if (!PATRON_CODIGO.test(normalizarCodigo(codigo))) {
    throw new ErrorNegocio(MENSAJES.CREDENCIALES_INVALIDAS);
  }
}

/** ¿La cuenta tiene un bloqueo temporal vigente en el instante "ahora"? */
export function estaBloqueado(seguridad, ahora) {
  return Boolean(seguridad?.bloqueadoHasta) && seguridad.bloqueadoHasta > ahora;
}

/** Minutos (redondeados hacia arriba) que faltan para que termine el bloqueo. */
export function minutosRestantesBloqueo(seguridad, ahora) {
  if (!estaBloqueado(seguridad, ahora)) {
    return 0;
  }
  return Math.ceil((seguridad.bloqueadoHasta - ahora) / MS_POR_MINUTO);
}

/**
 * Calcula el nuevo estado de seguridad tras un intento fallido.
 * Si un bloqueo anterior ya venció, el contador vuelve a empezar.
 * Al llegar a MAX_INTENTOS se bloquea la cuenta MINUTOS_BLOQUEO minutos.
 */
export function registrarIntentoFallido(seguridad, ahora, config = SEGURIDAD) {
  const bloqueoVencido = Boolean(seguridad?.bloqueadoHasta) && !estaBloqueado(seguridad, ahora);
  const intentosPrevios = bloqueoVencido ? 0 : (seguridad?.intentosFallidos ?? 0);
  const intentosFallidos = intentosPrevios + 1;
  const debeBloquear = intentosFallidos >= config.MAX_INTENTOS;
  return {
    intentosFallidos,
    bloqueadoHasta: debeBloquear ? new Date(ahora.getTime() + config.MINUTOS_BLOQUEO * MS_POR_MINUTO) : null,
  };
}

/** ¿Hay que reiniciar el contador tras un login exitoso? */
export function requiereReinicioSeguridad(seguridad) {
  return Boolean(seguridad) && (seguridad.intentosFallidos > 0 || Boolean(seguridad.bloqueadoHasta));
}

/** Página a la que se redirige cada rol después del login (null si el rol no es válido). */
export function paginaInicioPorRol(rol) {
  return PAGINA_INICIO_POR_ROL[rol] ?? null;
}

/** ¿El perfil puede ver una página restringida a rolesPermitidos? */
export function tieneAcceso(perfil, rolesPermitidos) {
  return Boolean(perfil) && rolesPermitidos.includes(perfil.rol);
}
