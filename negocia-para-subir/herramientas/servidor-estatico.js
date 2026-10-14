#!/usr/bin/env node
/* Servidor estático mínimo (sin dependencias) para previsualizar el juego.
 * El juego también funciona abriendo index.html con doble clic.
 * Uso: node herramientas/servidor-estatico.js [puerto=5173] */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PUERTO = parseInt(process.argv[2] || process.env.PORT || '5173', 10);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  // El Modo IA necesita servidor/servidor.mjs; aquí se declara no disponible (modo clásico)
  if (ruta === '/api/ia/estado') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ disponible: false, motivo: 'Usa node servidor/servidor.mjs para el Modo IA' })); }
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = path.normalize(path.join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ) || archivo.includes(path.sep + '.tools')) { res.writeHead(403); return res.end('Prohibido'); }
  fs.readFile(archivo, (err, datos) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(datos);
  });
}).listen(PUERTO, '127.0.0.1', () => console.log('NEGOCIA en http://localhost:' + PUERTO));
