/**
 * Reloj inyectable (HU-05). Toda la lógica de negocio obtiene la hora actual desde aquí
 * para poder simular otra fecha/hora (por ejemplo, una devolución tardía).
 * Módulo puro: no importa Firebase.
 */

const relojDelSistema = () => new Date();

let proveedorHora = relojDelSistema;

/** Hora actual según el reloj configurado. */
export function ahora() {
  return new Date(proveedorHora().getTime());
}

/** Reemplaza el proveedor de la hora (función que devuelve un Date). */
export function fijarProveedorHora(proveedor) {
  proveedorHora = proveedor;
}

/** Vuelve a usar la hora real del sistema. */
export function restaurarReloj() {
  proveedorHora = relojDelSistema;
}

/** ¿Se está usando una hora simulada? */
export function relojSimulado() {
  return proveedorHora !== relojDelSistema;
}
