#!/usr/bin/env node
/* Mini-runner de tests sin dependencias.
 * Uso: node tests/ejecutar.js [filtro]
 * Cada archivo *.test.js registra pruebas con prueba(nombre, fn). */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const pruebas = [];
let archivoActual = '';
global.prueba = (nombre, fn) => pruebas.push({ nombre, fn, archivo: archivoActual });
global.assert = assert;
global.NG = require('./cargar.js');

const filtro = process.argv[2] || '';
const archivos = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js') && f.includes(filtro)).sort();
for (const f of archivos) { archivoActual = f; require(path.join(__dirname, f)); }

let ok = 0, fallos = 0;
const inicio = Date.now();
let ultimo = '';
for (const t of pruebas) {
  if (t.archivo !== ultimo) { console.log('\n\x1b[1m' + t.archivo + '\x1b[0m'); ultimo = t.archivo; }
  try {
    t.fn();
    ok++;
    console.log('  \x1b[32m✓\x1b[0m ' + t.nombre);
  } catch (e) {
    fallos++;
    console.log('  \x1b[31m✗ ' + t.nombre + '\x1b[0m\n      ' + String(e && e.message || e).split('\n').join('\n      '));
  }
}
console.log('\n' + (fallos ? '\x1b[31m' : '\x1b[32m') + ok + ' superadas, ' + fallos + ' fallidas\x1b[0m (' + ((Date.now() - inicio) / 1000).toFixed(1) + ' s)');
process.exit(fallos ? 1 : 0);
