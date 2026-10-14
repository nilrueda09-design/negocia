/* Carga el núcleo y los datos en Node en el mismo orden que index.html.
 * Los archivos son scripts clásicos que cuelgan sus módulos de globalThis.NG. */
'use strict';
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const ARCHIVOS = [
  'js/nucleo/util.js',
  'js/nucleo/personalidades.js',
  'js/nucleo/analisis.js',
  'js/datos/dialogos.js',
  'js/datos/conceptos.js',
  'js/datos/logros.js',
  'js/datos/escenarios/e1-proveedor.js',
  'js/datos/escenarios/e2-talento.js',
  'js/datos/escenarios/e3-cliente.js',
  'js/datos/escenarios/e4-adquisicion.js',
  'js/datos/escenarios/e5-multiparte.js',
  'js/nucleo/preparacion.js',
  'js/nucleo/motor.js',
  'js/nucleo/sesgos.js',
  'js/nucleo/puntuacion.js',
  'js/nucleo/progreso.js',
  'js/nucleo/estadoVisual.js',
  'js/ia/cliente-ia.js'
];

const fs = require('fs');
for (const f of ARCHIVOS) {
  const ruta = path.join(RAIZ, f);
  if (fs.existsSync(ruta)) require(ruta);
}
module.exports = globalThis.NG;
