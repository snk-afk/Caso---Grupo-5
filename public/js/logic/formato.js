/**
 * Utilidades puras de formato de fechas y horas (hora local del navegador).
 */

const dosDigitos = (n) => String(n).padStart(2, '0');

/** Date -> "YYYY-MM-DD" (hora local). */
export function fechaISO(fecha) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** Date -> "HH:MM" (hora local). */
export function horaHHMM(fecha) {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY". */
export function formatearFecha(fechaIso) {
  const [anio, mes, dia] = String(fechaIso).split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Date -> "DD/MM/YYYY HH:MM". */
export function formatearFechaHora(fecha) {
  return `${formatearFecha(fechaISO(fecha))} ${horaHHMM(fecha)}`;
}

/** "HH:MM", "HH:MM" -> "HH:MM – HH:MM". */
export function formatearHorario(horaInicio, horaFin) {
  return `${horaInicio} – ${horaFin}`;
}
