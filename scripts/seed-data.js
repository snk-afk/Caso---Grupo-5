/**
 * Datos semilla de LabTrack. Son cuentas de DEMOSTRACIÓN para pruebas del curso,
 * no credenciales de servicio.
 */
import {
  CATEGORIAS,
  ESTADOS_EQUIPO,
  ESTADOS_USUARIO,
  ROLES,
} from '../public/js/logic/constantes.js';
import { resolverCategoria } from '../public/js/logic/catalogo.js';

export const CLAVES_DEMO = Object.freeze({
  encargado: 'Admin123*',
  estudiante: 'Estudiante123*',
  jmeter: 'Jmeter123*',
});

export const CANTIDAD_USUARIOS_JMETER = 50;

const ENCARGADO = { codigo: 'admin01', nombre: 'Encargado de Laboratorio', rol: ROLES.ENCARGADO, clave: CLAVES_DEMO.encargado };

const ESTUDIANTES_EJEMPLO = [
  { codigo: 'est001', nombre: 'Ana Torres Ríos' },
  { codigo: 'est002', nombre: 'Bruno Díaz Paredes' },
  { codigo: 'est003', nombre: 'Carla Mendoza Quispe' },
];

const EQUIPOS = [
  ['CMP-001', 'Laptop Dell Latitude 5420', 'Cómputo'],
  ['CMP-002', 'Laptop HP ProBook 440', 'Cómputo'],
  ['CMP-003', 'Proyector Epson PowerLite', 'Cómputo'],
  ['CMP-004', 'Tablet Lenovo Tab M10', 'Cómputo'],
  ['ELE-001', 'Osciloscopio Rigol DS1054Z', 'Electrónica'],
  ['ELE-002', 'Multímetro Fluke 117', 'Electrónica'],
  ['ELE-003', 'Kit Arduino Uno R3', 'Electrónica'],
  ['ELE-004', 'Fuente de poder regulable 30V', 'Electrónica'],
  ['RED-001', 'Router Cisco ISR 1100', 'Redes'],
  ['RED-002', 'Switch Cisco Catalyst 2960', 'Redes'],
  ['RED-003', 'Access Point Ubiquiti UniFi', 'Redes'],
  ['RED-004', 'Kit de crimpado y tester RJ45', 'Redes'],
];

function comoEstudiante({ codigo, nombre }, clave) {
  return { codigo, nombre, rol: ROLES.ESTUDIANTE, clave };
}

export function generarEstudiantesJmeter(cantidad = CANTIDAD_USUARIOS_JMETER) {
  return Array.from({ length: cantidad }, (_, i) => {
    const numero = String(i + 1).padStart(3, '0');
    return comoEstudiante({ codigo: `jm${numero}`, nombre: `Estudiante JMeter ${numero}` }, CLAVES_DEMO.jmeter);
  });
}

/** Contenido de jmeter/usuarios.csv: codigo,correo,clave de los estudiantes de JMeter. */
export function generarCsvJmeter(correoDe) {
  const filas = generarEstudiantesJmeter().map((u) => `${u.codigo},${correoDe(u.codigo)},${u.clave}`);
  return ['codigo,correo,clave', ...filas].join('\n') + '\n';
}

/** Lista de usuarios a crear (Auth + documento en usuarios). */
export function construirUsuarios({ incluirJmeter = true } = {}) {
  const ejemplo = ESTUDIANTES_EJEMPLO.map((e) => comoEstudiante(e, CLAVES_DEMO.estudiante));
  const jmeter = incluirJmeter ? generarEstudiantesJmeter() : [];
  return [ENCARGADO, ...ejemplo, ...jmeter].map((u) => ({ ...u, estado: ESTADOS_USUARIO.ACTIVO }));
}

/** Lista de equipos, opcionalmente sin los de una categoría. */
export function construirEquipos({ categoriaVacia = null } = {}) {
  return EQUIPOS
    .filter(([, , categoria]) => categoria !== categoriaVacia)
    .map(([codigoInventario, nombre, categoria]) => ({
      codigoInventario,
      nombre,
      categoria,
      estado: ESTADOS_EQUIPO.DISPONIBLE,
      bloquesAprobados: [],
    }));
}

/** Acepta "Redes", "redes", "Computo" o "Cómputo" y devuelve la categoría oficial. */
export function categoriaObligatoria(valor) {
  const encontrada = resolverCategoria(valor);
  if (!encontrada) {
    throw new Error(`Categoría inválida: "${valor}". Usa una de: ${CATEGORIAS.join(', ')}`);
  }
  return encontrada;
}
