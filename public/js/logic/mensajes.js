/**
 * Textos que se muestran al usuario. Los marcados como EXACTO son criterios de aceptación.
 */
import { SEGURIDAD } from './constantes.js';

export const MENSAJES = Object.freeze({
  // HU-01 (EXACTO)
  CREDENCIALES_INVALIDAS: 'Credenciales inválidas',
  LOGIN_CAMPOS_VACIOS: 'Ingresa tu código de estudiante y tu contraseña.',
  DEMASIADAS_SOLICITUDES: 'Firebase bloqueó temporalmente los intentos desde este dispositivo. Intenta más tarde.',
  ERROR_INESPERADO: 'Ocurrió un error inesperado. Intenta nuevamente.',
  SIN_PERMISO: 'No tienes permiso para realizar esta acción o los datos cambiaron. Recarga la página.',

  // HU-02
  CATALOGO_SIN_EQUIPOS: 'No hay equipos disponibles en esta categoría', // EXACTO
  CATALOGO_VACIO: 'No hay equipos registrados.',

  // HU-03
  RESERVA_CAMPOS_VACIOS: 'Selecciona un equipo y completa la fecha, la hora de inicio y la hora de fin.',
  RESERVA_FORMATO_INVALIDO: 'La fecha o la hora ingresada no tiene un formato válido.',
  RESERVA_INICIO_MAYOR_FIN: 'La hora de inicio debe ser menor que la hora de fin.',
  RESERVA_FECHA_PASADA: 'No puedes reservar en una fecha pasada.',
  RESERVA_HORA_PASADA: 'La hora de inicio ya pasó. Elige un horario futuro.',
  RESERVA_ESTUDIANTE_PENALIZADO:
    'Tu cuenta está penalizada. No puedes reservar equipos hasta que el encargado retire la penalización.',
  RESERVA_LIMITE_SIMULTANEO:
    'Ya tienes un equipo reservado (pendiente o aprobado). Solo puedes tener 1 equipo reservado de forma simultánea.',
  RESERVA_EQUIPO_INEXISTENTE: 'El equipo seleccionado no existe.',
  RESERVA_EQUIPO_NO_DISPONIBLE: 'El equipo seleccionado no está disponible.',
  RESERVA_CREADA: 'Reserva registrada correctamente. Queda pendiente de aprobación por el encargado.',
});

export function mensajeCategoriaInvalida(valor) {
  return `La categoría "${valor}" no existe. Se muestran todos los equipos.`;
}

export function mensajeCuentaBloqueada(minutos) {
  return `Cuenta bloqueada temporalmente por intentos fallidos. Intenta nuevamente en ${minutos} minuto(s).`;
}

export function alertaSeguridadBloqueo(config = SEGURIDAD) {
  return `Alerta de seguridad: se registraron ${config.MAX_INTENTOS} intentos fallidos consecutivos. `
    + `La cuenta quedó bloqueada durante ${config.MINUTOS_BLOQUEO} minutos.`;
}
