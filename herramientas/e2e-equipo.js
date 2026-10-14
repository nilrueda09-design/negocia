#!/usr/bin/env node
/* =====================================================================
 * Partida completa del modo equipo «Mesa de crisis» por la interfaz real.
 * Uso: node herramientas/e2e-equipo.js [dirCapturas] [urlBase] [claudeFalso=0|1|fuga] [ancho] [alto]
 *  - claudeFalso=1 inyecta un window.claude falso con la capacidad «sample»
 *    (como dentro de claude.ai) para probar ese camino sin coste.
 *  - claudeFalso=fuga hace que la IA falsa filtre datos privados: la
 *    validación debe descartar la respuesta y usar la mediadora local.
 * ===================================================================== */
'use strict';
const path = require('path');
const fs = require('fs');
const { lanzar } = require('./e2e');

const dir = process.argv[2] || path.join(__dirname, '..', 'capturas', 'equipo');
const base = process.argv[3] || 'file://' + path.join(__dirname, '..', 'index.html');
const falso = process.argv[4] || '0';
const ancho = +(process.argv[5] || 1440), alto = +(process.argv[6] || 900);
fs.mkdirSync(dir, { recursive: true });

const CLAUDE_FALSO = `(() => {
  window.__llamadas = [];
  const fuga = ${falso === 'fuga'};
  const sample = async (p) => ({ text: '{}' });
  sample.json = async (prompt, op) => {
    window.__llamadas.push({ secciones: (prompt.match(/<([a-z_]+)>/g) || []), tier: op && op.modelTier });
    await new Promise((r) => setTimeout(r, 300));
    if (prompt.includes('Evalúa la actuación')) return { resumen: 'Claude (falso): el equipo encontró un plan.', roles: { direccion: 'Bien la apertura.', sindicato: 'Buena exigencia.', fondo: 'Supo ceder.' }, leccion: 'Cede en lo barato, gana en lo importante.' };
    const ev = (prompt.split('<eventos_disponibles>')[1].split('</eventos_disponibles>')[0].match(/"id": "([a-z-]+)"/) || [])[1] || null;
    return { analisis: fuga ? 'El sindicato tiene un mínimo de 47 pts.' : 'Claude (falso): falta un gesto hacia la plantilla.', propuesta: [1, 2, 2, 2, 2], razon: 'Cada parte gana en lo que más le importa.', evento: ev, anuncio_evento: ev ? 'Claude (falso) anuncia una noticia.' : '' };
  };
  window.claude = { use: async (n) => (n === 'sample' ? sample : null) };
  return 1;
})()`;

(async () => {
  const nav = await lanzar({ ancho, alto, movil: ancho < 700 });
  let n = 1;
  const foto = (nombre) => nav.captura(path.join(dir, String(n++).padStart(2, '0') + '-' + nombre + '.png'));
  const clic = (sel, texto) => nav.eval(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => !x.disabled && x.offsetParent !== null && (!${JSON.stringify(texto || '')} || x.textContent.includes(${JSON.stringify(texto || '')}))); if (!b) return false; b.click(); return true; })()`);
  try {
    await nav.ir(base);
    await nav.eval(`localStorage.setItem('negocia.v1', JSON.stringify({version:1, escenarios:{}, logros:{}, conceptos:[], ajustes:{sonido:false, volumen:0.5, velocidadTexto:'rapida', temporizadores:'sin', movimiento:'auto'}, guiaVista:true, tutorialVisto:true, partidas:0})); 1`);
    await nav.ir(base);
    await nav.espera(800);
    await foto('menu');
    if (falso !== '0') await nav.eval(CLAUDE_FALSO);
    await clic('.btn', 'Mesa de crisis');
    await nav.hasta(`!!document.querySelector('.eq-roles')`, 10000);
    await nav.eval(`(() => { const n = {direccion: 'Ana', sindicato: 'Luis', fondo: 'Marc'}; Object.keys(n).forEach((k) => { document.querySelector('input[name="' + k + '"]').value = n[k]; }); return 1; })()`);
    await nav.espera(400);
    await foto('intro');
    await clic('.btn', 'Empezar la reunión');
    let pasos = 0, rondaFoto = {};
    while (pasos++ < 120) {
      await nav.espera(500);
      if (await nav.eval(`!!document.querySelector('.eq-final-total')`)) break;
      if (await nav.eval(`!!document.querySelector('.cinematica [data-continuar]')`)) { await nav.espera(1500); await foto('cinematica'); await clic('.cinematica [data-continuar]'); continue; }
      const ronda = await nav.eval(`NG && document.querySelector('.eq-ronda b') ? document.querySelector('.eq-ronda b').firstChild.textContent : '?'`);
      if (await nav.eval(`!!document.querySelector('.eq-postura')`)) {
        if (!rondaFoto['postura']) { rondaFoto['postura'] = 1; await foto('postura'); }
        await nav.eval(`(() => { const b = document.querySelectorAll('.eq-postura'); b[Math.floor(Math.random() * 3)].click(); return 1; })()`);
        continue;
      }
      if (await nav.eval(`[...document.querySelectorAll('.btn')].some((b) => b.textContent.includes('Empezar la fase 2'))`)) { await foto('posturas-reveladas'); await clic('.btn', 'Empezar la fase 2'); continue; }
      if (await nav.eval(`[...document.querySelectorAll('.btn')].some((b) => b.textContent.includes('Firmar el plan'))`)) { await foto('ratificacion'); await clic('.btn', 'Firmar el plan'); continue; }
      if (await clic('.btn', 'Turno de')) { continue; }
      if (await nav.eval(`!!document.querySelector('.eq-pasar')`)) {
        if (!rondaFoto['pasar']) { rondaFoto['pasar'] = 1; await foto('pasar-dispositivo'); }
        await clic('.eq-pasar .btn'); continue;
      }
      if (await nav.eval(`[...document.querySelectorAll('.btn')].some((b) => b.textContent.includes('Presentar a la mesa'))`)) {
        if (!rondaFoto['prop' + ronda]) { rondaFoto['prop' + ronda] = 1; await foto('propuesta-r' + ronda); }
        if (!(await clic('.btn', 'Usar la de la mediadora'))) await clic('.btn', 'Presentar a la mesa');
        continue;
      }
      if (await nav.eval(`!!document.querySelector('.eq-pide')`)) {
        if (!rondaFoto['voto' + ronda]) { rondaFoto['voto' + ronda] = 1; await foto('voto-r' + ronda); }
        const ok = await nav.eval(`!!document.querySelector('.eq-tabla b.ok')`);
        if (!ok) await nav.eval(`(() => { const s = document.querySelector('.eq-pide [name="var"]'); s.value = '0'; s.dispatchEvent(new Event('change')); return 1; })()`);
        await clic('.btn', ok ? 'Aceptar' : 'Rechazar');
        continue;
      }
      if (await nav.eval(`[...document.querySelectorAll('.btn')].some((b) => b.textContent.includes('Siguiente ronda'))`)) {
        if (!rondaFoto['res' + ronda]) { rondaFoto['res' + ronda] = 1; await foto('resolucion-r' + ronda); }
        await clic('.btn', 'Siguiente ronda'); continue;
      }
      if (await clic('.btn', 'Ver el desenlace')) continue;
    }
    await nav.hasta(`!!document.querySelector('.eq-eval') && document.querySelector('.eq-eval').textContent.length > 5`, 20000);
    await nav.espera(600);
    await foto('final');
    await nav.eval('window.scrollTo(0, 900); 1');
    await nav.espera(400);
    await foto('final-2');
    const res = await nav.eval(`({ total: document.querySelector('.eq-final-total b').textContent, titulo: document.querySelector('.eq-final-cab h2').textContent, fuente: document.querySelector('.eq-fuente').textContent, ia: [...document.querySelectorAll('.eq-registro li')].map((l) => l.textContent.slice(0, 140)), llamadas: window.__llamadas ? window.__llamadas.length : 0, secciones: window.__llamadas && window.__llamadas[0] ? window.__llamadas[0].secciones.join(' ') : '', ancho: document.documentElement.scrollWidth })`);
    console.log(JSON.stringify(res, null, 1));
  } catch (e) {
    console.error('FALLO:', e.message);
    await foto('zz-fallo');
    process.exitCode = 1;
  } finally {
    const err = nav.errores();
    console.log(err.length ? 'ERRORES DE CONSOLA:\n' + err.join('\n') : 'Sin errores de consola ✓');
    if (err.length) process.exitCode = 1;
    await nav.cerrar();
  }
})();
