/**
 * Controlador de admin.html (contenido completo en fases siguientes).
 */
import { ROLES } from '../logic/constantes.js';
import { protegerPagina } from './guardia.js';

await protegerPagina([ROLES.ENCARGADO]);
