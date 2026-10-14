#!/usr/bin/env node
/* =====================================================================
 * Herramienta de pruebas de extremo a extremo (sin dependencias).
 * Lanza Chrome en modo headless, lo controla por el protocolo DevTools
 * (WebSocket nativo de Node ≥ 22), ejecuta JavaScript en la página,
 * hace capturas y recoge errores de consola y excepciones.
 *
 *   const nav = await require('./e2e').lanzar({ ancho: 1440, alto: 900 });
 *   await nav.ir('http://localhost:5173/');  await nav.eval('1+1');
 *   await nav.captura('salida.png');  nav.errores();  await nav.cerrar();
 * ===================================================================== */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function lanzar(o) {
  o = o || {};
  const puerto = o.puerto || 9333 + Math.floor(Math.random() * 500);
  const dirUsuario = fs.mkdtempSync(path.join(o.tmp || os.tmpdir(), 'negocia-chrome-'));
  const args = ['--headless=new', '--remote-debugging-port=' + puerto, '--user-data-dir=' + dirUsuario, '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--window-size=' + (o.ancho || 1440) + ',' + (o.alto || 900)].concat(o.args || [], ['about:blank']);
  const proc = spawn(CHROME, args, { stdio: 'ignore' });
  let lista = null;
  for (let i = 0; i < 80 && !lista; i++) {
    await espera(150);
    try { lista = await (await fetch('http://127.0.0.1:' + puerto + '/json/list')).json(); } catch (e) { lista = null; }
  }
  if (!lista) throw new Error('No se pudo arrancar Chrome');
  const pagina = lista.find((t) => t.type === 'page');
  const ws = new WebSocket(pagina.webSocketDebuggerUrl);
  await new Promise((r, x) => { ws.onopen = r; ws.onerror = x; });
  let id = 0;
  const pendientes = new Map();
  const errores = [];
  const consola = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pendientes.has(m.id)) { const { r, x } = pendientes.get(m.id); pendientes.delete(m.id); m.error ? x(new Error(m.error.message)) : r(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') errores.push('EXCEPCIÓN: ' + ((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled') {
      const txt = m.params.args.map((a) => a.value !== undefined ? a.value : a.description).join(' ');
      consola.push(m.params.type + ': ' + txt);
      if (m.params.type === 'error' || m.params.type === 'assert') errores.push('console.error: ' + txt);
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errores.push('LOG: ' + m.params.entry.text + (m.params.entry.url ? ' (' + m.params.entry.url + ')' : ''));
  };
  const enviar = (method, params) => new Promise((r, x) => { const k = ++id; pendientes.set(k, { r, x }); ws.send(JSON.stringify({ id: k, method, params: params || {} })); });
  await enviar('Runtime.enable'); await enviar('Page.enable'); await enviar('Log.enable');
  await enviar('Emulation.setDeviceMetricsOverride', { width: o.ancho || 1440, height: o.alto || 900, deviceScaleFactor: o.escala || 1, mobile: !!o.movil });
  if (o.movil) await enviar('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (o.movimientoReducido) await enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

  const api = {
    async ir(url) {
      await enviar('Page.navigate', { url });
      for (let i = 0; i < 60; i++) { await espera(100); const r = await api.eval('document.readyState'); if (r === 'complete') break; }
      await espera(o.esperaCarga || 600);
    },
    async eval(expr) {
      const r = await enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error('Error evaluando: ' + ((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text));
      return r.result.value;
    },
    async captura(ruta) {
      const r = await enviar('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(ruta, Buffer.from(r.data, 'base64'));
      return ruta;
    },
    /* Espera hasta que una expresión sea verdadera (o se agote el tiempo). */
    async hasta(expr, ms) {
      const t0 = Date.now();
      while (Date.now() - t0 < (ms || 15000)) { if (await api.eval(expr)) return true; await espera(120); }
      return false;
    },
    /* Pulsa una tecla real (Tab, Enter, Escape, flechas…) como lo haría un usuario. */
    async tecla(key, mods) {
      const codigos = { Tab: 9, Enter: 13, Escape: 27, ' ': 32, ArrowDown: 40, ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39 };
      const base = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: codigos[key] || 0, modifiers: mods || 0 };
      await enviar('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown', text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined }, base));
      await enviar('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base));
      await espera(60);
    },
    espera,
    errores: () => errores.slice(),
    consola: () => consola.slice(),
    async cerrar() { try { ws.close(); } catch (e) { /* nada */ } proc.kill(); try { fs.rmSync(dirUsuario, { recursive: true, force: true }); } catch (e) { /* nada */ } }
  };
  return api;
}

module.exports = { lanzar, espera };
