/**
 * Protección de páginas por rol (HU-01) y barra de navegación común.
 */
import { cerrarSesion, obtenerUidSesion } from '../repos/authRepo.js';
import { obtenerUsuario } from '../repos/usuariosRepo.js';
import { ESTADOS_USUARIO, ROLES } from '../logic/constantes.js';
import { tieneAcceso } from '../logic/autenticacion.js';
import { crearElemento } from './ui.js';

const PAGINA_LOGIN = 'index.html';

const ENLACES_POR_ROL = Object.freeze({
  [ROLES.ESTUDIANTE]: [
    { id: 'nav-catalogo', texto: 'Catálogo', href: 'catalogo.html' },
    { id: 'nav-reservas', texto: 'Mis reservas', href: 'reservas.html' },
  ],
  [ROLES.ENCARGADO]: [
    { id: 'nav-admin', texto: 'Solicitudes', href: 'admin.html' },
    { id: 'nav-devoluciones', texto: 'Devoluciones', href: 'devoluciones.html' },
  ],
});

function crearEnlace({ id, texto, href }) {
  const activo = window.location.pathname.endsWith(href);
  const enlace = crearElemento('a', {
    texto,
    clases: ['nav-link', ...(activo ? ['active', 'fw-semibold'] : [])],
    atributos: { id, 'data-testid': id, href },
  });
  const item = crearElemento('li', { clases: ['nav-item'] });
  item.append(enlace);
  return item;
}

function crearDatosUsuario(perfil) {
  const contenedor = crearElemento('div', { clases: ['d-flex', 'align-items-center', 'gap-2'] });
  const nombre = crearElemento('span', {
    texto: `${perfil.nombre} (${perfil.codigo})`,
    clases: ['text-white-50', 'small'],
    atributos: { id: 'usuario-actual', 'data-testid': 'usuario-actual' },
  });
  const penalizado = perfil.estado === ESTADOS_USUARIO.PENALIZADO;
  const estado = crearElemento('span', {
    texto: perfil.estado,
    clases: ['badge', penalizado ? 'text-bg-danger' : 'text-bg-success'],
    atributos: { id: 'estado-usuario', 'data-testid': 'estado-usuario' },
  });
  const salir = crearElemento('button', {
    texto: 'Cerrar sesión',
    clases: ['btn', 'btn-outline-light', 'btn-sm'],
    atributos: { id: 'btn-cerrar-sesion', 'data-testid': 'btn-cerrar-sesion', type: 'button' },
  });
  salir.addEventListener('click', salirDelSistema);
  contenedor.append(nombre, estado, salir);
  return contenedor;
}

function renderizarNavegacion(perfil) {
  const barra = document.getElementById('barra-navegacion');
  const marca = crearElemento('span', { texto: 'LabTrack', clases: ['navbar-brand', 'fw-bold'] });
  const enlaces = crearElemento('ul', { clases: ['navbar-nav', 'flex-row', 'gap-3', 'me-auto'] });
  enlaces.append(...ENLACES_POR_ROL[perfil.rol].map(crearEnlace));
  const contenedor = crearElemento('div', {
    clases: ['container', 'd-flex', 'flex-wrap', 'align-items-center', 'gap-3'],
  });
  contenedor.append(marca, enlaces, crearDatosUsuario(perfil));
  barra.replaceChildren(contenedor);
}

async function salirDelSistema() {
  await cerrarSesion();
  window.location.replace(PAGINA_LOGIN);
}

/**
 * Verifica sesión y rol. Si no corresponde, redirige al login y devuelve null.
 * @param {string[]} rolesPermitidos
 * @returns {Promise<object|null>} perfil del usuario autenticado
 */
export async function protegerPagina(rolesPermitidos) {
  const uid = await obtenerUidSesion();
  const perfil = uid ? await obtenerUsuario(uid) : null;
  if (!tieneAcceso(perfil, rolesPermitidos)) {
    window.location.replace(PAGINA_LOGIN);
    return null;
  }
  renderizarNavegacion(perfil);
  document.getElementById('contenido').hidden = false;
  return perfil;
}
