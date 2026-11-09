/**
 * Reloj de pruebas (HU-05): permite simular otra fecha/hora desde la interfaz o la consola.
 *
 * Guarda un DESFASE (ms) respecto de la hora real en sessionStorage, así la hora simulada
 * sigue avanzando y se conserva al navegar entre páginas de la misma pestaña.
 *
 * Consola del navegador:
 *   labtrackReloj.fijar('2026-11-10T18:30')   // fija la hora simulada
 *   labtrackReloj.adelantar(120)              // adelanta 120 minutos
 *   labtrackReloj.restaurar()                 // vuelve a la hora real
 *   labtrackReloj.ahora()                     // muestra la hora que usa la app
 */
import { ahora, fijarProveedorHora, relojSimulado, restaurarReloj } from '../logic/reloj.js';
import { formatearFechaHora } from '../logic/formato.js';

const CLAVE_DESFASE = 'labtrack.desfaseReloj';
const MS_POR_MINUTO = 60_000;

function leerDesfase() {
  try {
    return Number(window.sessionStorage.getItem(CLAVE_DESFASE)) || 0;
  } catch {
    return 0; // sessionStorage no disponible (modo privado estricto): se usa la hora real.
  }
}

function guardarDesfase(desfase) {
  try {
    if (desfase) {
      window.sessionStorage.setItem(CLAVE_DESFASE, String(desfase));
    } else {
      window.sessionStorage.removeItem(CLAVE_DESFASE);
    }
  } catch {
    // Sin sessionStorage el reloj simulado solo dura hasta recargar la página.
  }
}

function aplicarDesfase(desfase) {
  if (desfase) {
    fijarProveedorHora(() => new Date(Date.now() + desfase));
  } else {
    restaurarReloj();
  }
}

/** Fija la hora simulada. Acepta un Date o un texto "AAAA-MM-DDTHH:MM". */
export function fijarHoraSimulada(valor) {
  const fecha = valor instanceof Date ? valor : new Date(String(valor));
  if (Number.isNaN(fecha.getTime())) {
    throw new TypeError('Fecha inválida. Usa el formato AAAA-MM-DDTHH:MM, por ejemplo 2026-11-10T18:30');
  }
  const desfase = fecha.getTime() - Date.now();
  guardarDesfase(desfase);
  aplicarDesfase(desfase);
}

export function adelantarMinutos(minutos) {
  fijarHoraSimulada(new Date(ahora().getTime() + Number(minutos) * MS_POR_MINUTO));
}

export function restaurarHoraReal() {
  guardarDesfase(0);
  restaurarReloj();
}

/** Texto descriptivo de la hora que está usando la app. */
export function describirReloj() {
  const tipo = relojSimulado() ? 'SIMULADA' : 'real';
  return `Hora ${tipo}: ${formatearFechaHora(ahora())}`;
}

aplicarDesfase(leerDesfase());

window.labtrackReloj = Object.freeze({
  fijar(valor) {
    fijarHoraSimulada(valor);
    return describirReloj();
  },
  adelantar(minutos) {
    adelantarMinutos(minutos);
    return describirReloj();
  },
  restaurar() {
    restaurarHoraReal();
    return describirReloj();
  },
  ahora: describirReloj,
});
