/**
 * Errores de negocio: su mensaje es seguro para mostrarse al usuario.
 */
import { MENSAJES, mensajeCuentaBloqueada } from './mensajes.js';

export class ErrorNegocio extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorNegocio';
  }
}

export class ErrorCredenciales extends ErrorNegocio {
  constructor() {
    super(MENSAJES.CREDENCIALES_INVALIDAS);
    this.name = 'ErrorCredenciales';
  }
}

export class ErrorCuentaBloqueada extends ErrorNegocio {
  constructor() {
    super(mensajeCuentaBloqueada());
    this.name = 'ErrorCuentaBloqueada';
  }
}
