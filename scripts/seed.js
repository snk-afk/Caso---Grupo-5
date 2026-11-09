/**
 * Datos semilla de LabTrack.
 *
 * Uso:
 *   npm run seed:emulador                       -> contra los emuladores locales
 *   npm run seed                                -> contra el proyecto real (requiere .env)
 *   npm run seed:emulador -- --sin-categoria=Redes   -> deja "Redes" sin equipos
 *   npm run seed:emulador -- --sin-jmeter            -> omite los 50 usuarios de JMeter
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { codigoACorreo } from '../public/js/logic/autenticacion.js';
import { conectarAdmin } from './lib/admin.js';
import { sembrar } from './lib/sembrador.js';
import { categoriaObligatoria, generarCsvJmeter } from './seed-data.js';

const RUTA_CSV_JMETER = new URL('../jmeter/usuarios.csv', import.meta.url);

function leerOpciones() {
  const { values } = parseArgs({
    options: {
      emulador: { type: 'boolean', default: false },
      'sin-categoria': { type: 'string' },
      'sin-jmeter': { type: 'boolean', default: false },
    },
  });
  const categoria = values['sin-categoria'];
  return {
    emulador: values.emulador,
    incluirJmeter: !values['sin-jmeter'],
    categoriaVacia: categoria ? categoriaObligatoria(categoria) : null,
  };
}

async function main() {
  const opciones = leerOpciones();
  const destino = opciones.emulador ? 'EMULADOR' : 'PROYECTO REAL';
  process.stdout.write(`Sembrando datos en ${destino}...\n`);

  const resumen = await sembrar(conectarAdmin(opciones), opciones);

  const vacia = opciones.categoriaVacia ? ` (categoría "${opciones.categoriaVacia}" sin equipos)` : '';
  process.stdout.write(`Listo: ${resumen.usuarios} usuarios y ${resumen.equipos} equipos${vacia}.\n`);

  if (opciones.incluirJmeter) {
    writeFileSync(RUTA_CSV_JMETER, generarCsvJmeter(codigoACorreo), 'utf8');
    process.stdout.write('Generado jmeter/usuarios.csv con los estudiantes de prueba de JMeter.\n');
  }
}

main().catch((error) => {
  process.stderr.write(`Error al sembrar datos: ${error.message}\n`);
  process.exitCode = 1;
});
