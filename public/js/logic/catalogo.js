/**
 * Lógica pura del catálogo (HU-02).
 */
import { CATEGORIAS } from './constantes.js';

function sinTildes(texto) {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/**
 * Devuelve la categoría oficial que corresponde al valor (sin importar tildes ni mayúsculas),
 * o null si no corresponde a ninguna.
 */
export function resolverCategoria(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }
  return CATEGORIAS.find((categoria) => sinTildes(categoria) === sinTildes(valor)) ?? null;
}

/** Interpreta el parámetro ?categoria= de la URL. */
export function leerFiltroCategoria(parametro) {
  const categoria = resolverCategoria(parametro);
  return {
    categoria,
    invalida: Boolean(parametro) && categoria === null,
  };
}

/** Identificador estable para ids/data-testid: "Cómputo" -> "computo". */
export function slugCategoria(categoria) {
  return sinTildes(categoria);
}
