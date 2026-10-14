#!/usr/bin/env node
/* =====================================================================
 * NEGOCIA · servidor/pruebas.mjs — pruebas del Modo IA (sin clave, sin red)
 * Uso: node servidor/pruebas.mjs
 * Usan el cliente simulado: comprueban esquemas, validación, seguridad del
 * proxy y la vuelta al modo clásico. No llaman a la API real.
 * ===================================================================== */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { arrancar } from './servidor.mjs';
import { interpretar, narrar, validarAccion } from './ia.mjs';
import { crearClienteSimulado } from './simulado.mjs';

const require = createRequire(import.meta.url);
const NG = require('../tests/cargar.js');

const pruebas = [];
const prueba = (nombre, fn) => pruebas.push({ nombre, fn });

function partida(escId = 'e1-proveedor') {
  const esc = NG.Escenarios.obtener(escId);
  const prep = NG.Preparacion.crear(esc);
  NG.Preparacion.definir(prep, esc, { batnaId: 'turco', reserva: 34, objetivo: 75, apertura: [0, 1, 3] });
  const p = NG.Motor.crearPartida(esc, prep, { semilla: 7, variacion: false });
  NG.Motor.iniciar(p);
  p.eventosOcurridos = esc.eventos.map((e) => e.id);
  return p;
}
const clienteQueDevuelve = (datos, stop = 'end_turn') => ({ beta: { messages: { create: async () => ({ stop_reason: stop, content: stop === 'refusal' ? [] : [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(datos) }] }) } } });

/* ---------- ia.mjs ---------- */
prueba('validarAccion rechaza acciones no disponibles, ids inventados y paquetes mal formados', () => {
  const ctx = NG.IA.contextoInterpretacion(partida());
  assert.equal(validarAccion({ tipo: 'aceptar' }, ctx), null);
  assert.equal(validarAccion({ tipo: 'pregunta', id: 'nada' }, ctx), null);
  assert.equal(validarAccion({ tipo: 'oferta', paquete: [0, 1] }, ctx), null);
  assert.equal(validarAccion({ tipo: 'oferta', paquete: [0, 1, 99] }, ctx), null);
  assert.equal(validarAccion({ tipo: 'borrar_todo' }, ctx), null);
  assert.deepEqual(validarAccion({ tipo: 'oferta', paquete: [0, 1, 3], justifica: true, final: true, explicacion: 'x' }, ctx),
    { tipo: 'oferta', paquete: [0, 1, 3], justifica: false, final: false, explicacion: 'x' });
});

prueba('interpretar: una respuesta no válida se convierte en charla (sin efecto en el juego)', async () => {
  const ctx = NG.IA.contextoInterpretacion(partida());
  const a = await interpretar(clienteQueDevuelve({ tipo: 'aceptar', paquete: null, id: null, justifica: false, final: false, explicacion: '' }), ctx, 'acepto');
  assert.equal(a.tipo, 'charla');
});

prueba('interpretar: se ignoran los bloques de razonamiento y se lee el texto', async () => {
  const ctx = NG.IA.contextoInterpretacion(partida());
  const a = await interpretar(clienteQueDevuelve({ tipo: 'pregunta', paquete: null, id: 'planes', justifica: false, final: false, explicacion: 'Pregunta por sus planes' }), ctx, '¿Qué planes tienen?');
  assert.deepEqual([a.tipo, a.id], ['pregunta', 'planes']);
});

prueba('un rechazo del modelo (stop_reason refusal) se trata como error, no como respuesta', async () => {
  const ctx = NG.IA.contextoInterpretacion(partida());
  await assert.rejects(() => interpretar(clienteQueDevuelve(null, 'refusal'), ctx, 'hola'), /declinada/);
});

prueba('narrar descarta respuestas de personajes que no tienen decisión', async () => {
  const p = partida();
  const S = NG.Motor.ejecutar(p, { tipo: 'pregunta', id: 'planes' });
  const ctx = NG.IA.contextoNarracion(p, '¿Qué planes tienen?', NG.IA.decisiones(p, S));
  const r = await narrar(clienteQueDevuelve({ respuestas: [{ quien: 'intruso', texto: 'x' }, { quien: 'jordi', texto: 'Bien.' }] }), ctx);
  assert.deepEqual(r, [{ quien: 'jordi', texto: 'Bien.' }]);
});

prueba('cliente simulado: interpreta una oferta citando opciones por su nombre', async () => {
  const ctx = NG.IA.contextoInterpretacion(partida());
  const v = ctx.variables;
  const msg = 'Propongo ' + v[0].opciones[2] + ' y ' + v[2].opciones[1] + ', según el índice de mercado';
  const a = await interpretar(crearClienteSimulado(), ctx, msg);
  assert.equal(a.tipo, 'oferta');
  assert.equal(a.paquete[0], 2); assert.equal(a.paquete[2], 1); assert.equal(a.paquete[1], 1, 'lo no mencionado se copia de tu última oferta');
});

/* ---------- servidor.mjs ---------- */
async function conServidor(entorno, fn) {
  const s = await arrancar({ puerto: 0, entorno, silencioso: true });
  const base = 'http://127.0.0.1:' + s.puerto;
  try { await fn(base, s.puerto); } finally { await s.cerrar(); }
}
const cabeceras = (extra) => Object.assign({ 'Content-Type': 'application/json', 'X-Negocia': '1' }, extra || {});

prueba('sin clave: el juego se sirve y el Modo IA se declara no disponible', () => conServidor({}, async (base) => {
  const r = await fetch(base + '/');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /NEGOCIA/);
  const e = await (await fetch(base + '/api/ia/estado')).json();
  assert.equal(e.disponible, false);
  assert.match(e.motivo, /ANTHROPIC_API_KEY/);
  const ctx = NG.IA.contextoInterpretacion(partida());
  const x = await fetch(base + '/api/ia/interpretar', { method: 'POST', headers: cabeceras(), body: JSON.stringify({ contexto: ctx, mensaje: 'hola' }) });
  assert.equal(x.status, 503);
}));

prueba('con clave pero sin el SDK instalado: lo explica y sigue en modo clásico', () => conServidor({ ANTHROPIC_API_KEY: 'clave-de-prueba-no-valida' }, async (base) => {
  const e = await (await fetch(base + '/api/ia/estado')).json();
  if (e.disponible) return; // el SDK está instalado en este equipo: nada que comprobar
  assert.match(e.motivo, /npm install/);
  assert.ok(!JSON.stringify(e).includes('clave-de-prueba'), 'la clave nunca se devuelve al navegador');
}));

prueba('el servidor no sirve su propio código, archivos ocultos ni nada fuera del proyecto', () => conServidor({}, async (base) => {
  for (const ruta of ['/servidor/ia.mjs', '/servidor/package.json', '/.git/config', '/.tools/node/bin/node', '/%2e%2e/%2e%2e/etc/passwd']) {
    const r = await fetch(base + ruta);
    assert.ok(r.status === 403 || r.status === 404, ruta + ' → ' + r.status);
  }
}));

prueba('el proxy exige la cabecera propia, el host local y un origen local', () => conServidor({ NEGOCIA_IA_SIMULADA: '1' }, async (base, puerto) => {
  const cuerpo = JSON.stringify({ contexto: NG.IA.contextoInterpretacion(partida()), mensaje: 'hola' });
  const sinCabecera = await fetch(base + '/api/ia/interpretar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo });
  assert.equal(sinCabecera.status, 403);
  const otroOrigen = await fetch(base + '/api/ia/interpretar', { method: 'POST', headers: cabeceras({ Origin: 'https://web-ajena.example' }), body: cuerpo });
  assert.equal(otroOrigen.status, 403);
  const ok = await fetch(base + '/api/ia/interpretar', { method: 'POST', headers: cabeceras({ Origin: 'http://localhost:' + puerto }), body: cuerpo });
  assert.equal(ok.status, 200);
}));

prueba('el proxy rechaza cuerpos enormes y contextos mal formados', () => conServidor({ NEGOCIA_IA_SIMULADA: '1' }, async (base) => {
  const grande = await fetch(base + '/api/ia/interpretar', { method: 'POST', headers: cabeceras(), body: JSON.stringify({ x: 'a'.repeat(100 * 1024) }) }).catch(() => ({ status: 413 }));
  assert.equal(grande.status, 413);
  const malo = await fetch(base + '/api/ia/narrar', { method: 'POST', headers: cabeceras(), body: JSON.stringify({ contexto: { decisiones: 'no' } }) });
  assert.equal(malo.status, 400);
}));

prueba('flujo completo simulado: interpretar → motor → narrar; y un fallo de la API devuelve error', () => conServidor({ NEGOCIA_IA_SIMULADA: '1' }, async (base) => {
  const est = await (await fetch(base + '/api/ia/estado')).json();
  assert.equal(est.disponible, true);
  const p = partida();
  const r1 = await (await fetch(base + '/api/ia/interpretar', { method: 'POST', headers: cabeceras(), body: JSON.stringify({ contexto: NG.IA.contextoInterpretacion(p), mensaje: '¿Cómo encaja nuestro volumen en sus planes de producción?' }) })).json();
  const accion = NG.IA.accionMotor(p, r1.accion);
  assert.deepEqual(accion, { tipo: 'pregunta', id: 'planes' });
  const S = NG.Motor.ejecutar(p, accion);
  const ctx = NG.IA.contextoNarracion(p, 'pregunta', NG.IA.decisiones(p, S));
  const r2 = await (await fetch(base + '/api/ia/narrar', { method: 'POST', headers: cabeceras(), body: JSON.stringify({ contexto: ctx }) })).json();
  assert.equal(r2.respuestas[0].quien, 'jordi');
  assert.match(r2.respuestas[0].texto, /^\[Simulación IA\]/);
  const fallo = await fetch(base + '/api/ia/interpretar', { method: 'POST', headers: cabeceras(), body: JSON.stringify({ contexto: NG.IA.contextoInterpretacion(p), mensaje: 'hola #error' }) });
  assert.equal(fallo.status, 502);
  assert.match((await fallo.json()).error, /Fallo simulado/);
}));

/* ---------- Ejecución ---------- */
let ok = 0, fallos = 0;
for (const t of pruebas) {
  try { await t.fn(); ok++; console.log('  \x1b[32m✓\x1b[0m ' + t.nombre); } catch (e) { fallos++; console.log('  \x1b[31m✗ ' + t.nombre + '\x1b[0m\n      ' + (e && e.message)); }
}
console.log('\n' + (fallos ? '\x1b[31m' : '\x1b[32m') + ok + ' superadas, ' + fallos + ' fallidas\x1b[0m');
process.exit(fallos ? 1 : 0);
