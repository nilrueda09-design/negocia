#!/usr/bin/env node
/* =====================================================================
 * NEGOCIA · servidor/servidor.mjs — servidor local para el Modo IA
 *
 * Sirve el juego y hace de proxy hacia la API de Anthropic. La clave se lee
 * de la variable de entorno ANTHROPIC_API_KEY y nunca sale de este proceso.
 * Sin clave (o sin el SDK instalado) el servidor sigue sirviendo el juego,
 * y el juego funciona en modo clásico.
 *
 *   export ANTHROPIC_API_KEY=...        (nunca en el código)
 *   cd servidor && npm install          (una vez: instala @anthropic-ai/sdk)
 *   node servidor/servidor.mjs          →  http://localhost:5173
 *
 * Variables opcionales: PORT (5173), NEGOCIA_MODELO (claude-opus-5-5),
 * NEGOCIA_IA_SIMULADA=1 (cliente falso, solo para pruebas automáticas).
 * ===================================================================== */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { interpretar, narrar, validarContextoInterpretacion, validarContextoNarracion, MODELO } from './ia.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon' };
const MAX_CUERPO = 64 * 1024;
const MAX_PETICIONES_MINUTO = 40;

/* ---------- Cliente de la API (opcional) ---------- */
export async function crearCliente(entorno = process.env) {
  if (entorno.NEGOCIA_IA_SIMULADA === '1') {
    const { crearClienteSimulado } = await import('./simulado.mjs');
    return { cliente: crearClienteSimulado(), motivo: 'simulado' };
  }
  if (!entorno.ANTHROPIC_API_KEY && !entorno.ANTHROPIC_AUTH_TOKEN) return { cliente: null, motivo: 'Falta la variable de entorno ANTHROPIC_API_KEY' };
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    // El SDK lee la clave del entorno; no se copia a ningún otro sitio
    return { cliente: new Anthropic({ maxRetries: 2, timeout: 60 * 1000 }), motivo: null, Anthropic };
  } catch (e) {
    return { cliente: null, motivo: 'Falta el SDK: ejecuta «npm install» dentro de la carpeta servidor' };
  }
}

/* ---------- Utilidades HTTP ---------- */
function json(res, estado, datos) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(datos));
}
function leerCuerpo(req) {
  return new Promise((resolver, rechazar) => {
    let total = 0;
    const trozos = [];
    req.on('data', (t) => {
      total += t.length;
      if (total > MAX_CUERPO) { rechazar(Object.assign(new Error('Petición demasiado grande'), { estado: 413 })); req.destroy(); return; }
      trozos.push(t);
    });
    req.on('end', () => {
      try { resolver(JSON.parse(Buffer.concat(trozos).toString('utf8') || '{}')); } catch (e) { rechazar(Object.assign(new Error('JSON no válido'), { estado: 400 })); }
    });
    req.on('error', rechazar);
  });
}
/* Solo el propio juego puede usar el proxy: se exige la cabecera X-Negocia
 * (fuerza una comprobación CORS previa que este servidor nunca concede) y,
 * si el navegador envía Origin, debe ser este mismo servidor. Así otra web
 * abierta en el navegador no puede gastar la clave del usuario. */
function origenPermitido(req, puerto) {
  const locales = ['localhost:' + puerto, '127.0.0.1:' + puerto];
  if (req.headers['x-negocia'] !== '1') return false;
  // Host: evita el «DNS rebinding» (un dominio ajeno que resuelve a 127.0.0.1)
  if (!locales.includes(req.headers.host)) return false;
  const o = req.headers.origin;
  return !o || locales.some((l) => o === 'http://' + l);
}

/* Errores de la API → mensaje para el jugador (sin detalles internos). */
function traducirError(e, Anthropic) {
  if (Anthropic && e instanceof Anthropic.AuthenticationError) return { estado: 502, error: 'La clave de la API no es válida' };
  if (Anthropic && e instanceof Anthropic.RateLimitError) return { estado: 429, error: 'Límite de uso de la API alcanzado; prueba en unos segundos' };
  if (Anthropic && e instanceof Anthropic.APIConnectionError) return { estado: 502, error: 'No hay conexión con la API' };
  if (Anthropic && e instanceof Anthropic.APIError) return { estado: 502, error: 'La API devolvió un error (' + (e.status || '?') + ')' };
  return { estado: 502, error: e && e.message ? String(e.message).slice(0, 160) : 'Error desconocido' };
}

/* ---------- Servidor ---------- */
export async function arrancar({ puerto = parseInt(process.env.PORT || '5173', 10), entorno = process.env, silencioso = false } = {}) {
  const { cliente, motivo, Anthropic } = await crearCliente(entorno);
  const modelo = entorno.NEGOCIA_IA_SIMULADA === '1' ? 'simulado' : (entorno.NEGOCIA_MODELO || MODELO);
  const ventana = [];
  let puertoReal = puerto;

  async function api(req, res, ruta) {
    if (ruta === '/api/ia/estado' && req.method === 'GET') {
      return json(res, 200, { disponible: !!cliente, modelo: cliente ? modelo : null, motivo: cliente ? null : motivo });
    }
    if (req.method !== 'POST' || !['/api/ia/interpretar', '/api/ia/narrar'].includes(ruta)) return json(res, 404, { error: 'No encontrado' });
    if (!origenPermitido(req, puertoReal)) return json(res, 403, { error: 'Origen no permitido' });
    if (!cliente) return json(res, 503, { error: motivo });
    const ahora = Date.now();
    while (ventana.length && ahora - ventana[0] > 60 * 1000) ventana.shift();
    if (ventana.length >= MAX_PETICIONES_MINUTO) return json(res, 429, { error: 'Demasiadas peticiones; espera un momento' });
    ventana.push(ahora);
    let cuerpo;
    try { cuerpo = await leerCuerpo(req); } catch (e) { return json(res, e.estado || 400, { error: e.message }); }
    try {
      if (ruta === '/api/ia/interpretar') {
        if (!validarContextoInterpretacion(cuerpo.contexto) || typeof cuerpo.mensaje !== 'string' || !cuerpo.mensaje.trim()) return json(res, 400, { error: 'Contexto no válido' });
        const accion = await interpretar(cliente, cuerpo.contexto, cuerpo.mensaje);
        return json(res, 200, { accion });
      }
      if (!validarContextoNarracion(cuerpo.contexto)) return json(res, 400, { error: 'Contexto no válido' });
      const respuestas = await narrar(cliente, cuerpo.contexto);
      return json(res, 200, { respuestas });
    } catch (e) {
      const t = traducirError(e, Anthropic);
      if (!silencioso) console.error('[IA] ' + t.error + (e && e.message && e.message !== t.error ? ' · ' + e.message : ''));
      return json(res, t.estado, { error: t.error });
    }
  }

  async function estatico(req, res, ruta) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = path.resolve(RAIZ, '.' + ruta);
    const relativo = path.relative(RAIZ, archivo);
    // Nada fuera del proyecto, ni archivos ocultos, ni el propio servidor o sus dependencias
    if (relativo.startsWith('..') || path.isAbsolute(relativo) || relativo.split(path.sep).some((s) => s.startsWith('.') || s === 'node_modules' || s === 'servidor')) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Prohibido');
    }
    try {
      const datos = await readFile(archivo);
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : datos);
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No encontrado');
    }
  }

  const servidor = http.createServer((req, res) => {
    let ruta;
    try { ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch (e) { res.writeHead(400); return res.end(); }
    (ruta.startsWith('/api/') ? api(req, res, ruta) : estatico(req, res, ruta)).catch((e) => {
      if (!res.headersSent) json(res, 500, { error: 'Error interno' });
      if (!silencioso) console.error(e);
    });
  });
  await new Promise((r) => servidor.listen(puerto, '127.0.0.1', r));
  const real = puertoReal = servidor.address().port;
  if (!silencioso) {
    console.log('NEGOCIA en http://localhost:' + real);
    console.log(cliente ? 'Modo IA activo · modelo ' + modelo + (modelo === 'simulado' ? '' : ' · con reintento automático en otro modelo si una respuesta es declinada (fallbacks)') : 'Modo IA no disponible (' + motivo + '). El juego funciona en modo clásico.');
  }
  return { servidor, puerto: real, cerrar: () => new Promise((r) => servidor.close(r)) };
}

// Ejecutado directamente (no importado por las pruebas)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  arrancar().catch((e) => { console.error(e); process.exit(1); });
}
