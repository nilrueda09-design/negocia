#!/usr/bin/env node
/* =====================================================================
 * Recorrido completo de un escenario a través de la interfaz real:
 * menú → briefing → preparación → negociación (con imprevistos) →
 * cinemática → debrief. Hace capturas y falla si hay errores de consola.
 *
 * Uso: node herramientas/e2e-partida.js [dirCapturas] [urlBase] [escenario] [ancho] [alto]
 *   urlBase puede ser http://localhost:5173/ o file:///ruta/index.html
 * ===================================================================== */
'use strict';
const path = require('path');
const fs = require('fs');
const { lanzar } = require('./e2e');

const dir = process.argv[2] || path.join(__dirname, '..', 'capturas');
const base = process.argv[3] || 'http://localhost:5173/';
const escId = process.argv[4] || 'e1-proveedor';
const ancho = +(process.argv[5] || 1440), alto = +(process.argv[6] || 900);
fs.mkdirSync(dir, { recursive: true });

/* Utilidades inyectadas en la página para pulsar por texto. */
const AYUDA = `
window.__clic = (sel, texto) => {
  const els = [...document.querySelectorAll(sel)].filter(e => !texto || e.textContent.includes(texto));
  const e = els.find(x => !x.disabled) || els[0];
  if (!e) return 'NO:' + sel + ' ' + (texto || '');
  e.click(); return 'ok';
};
window.__listo = () => !!document.querySelector('.acciones-rejilla') || !!document.querySelector('.evento-capa') || !!document.querySelector('.cinematica.visible') || !!document.querySelector('.comentario-modelo.grande');
`;

(async () => {
  const nav = await lanzar({ ancho, alto, movil: ancho < 700 });
  const paso = async (nombre, js, ms) => {
    const r = js ? await nav.eval(js) : null;
    await nav.espera(ms || 500);
    if (nombre) await nav.captura(path.join(dir, nombre + '.png'));
    return r;
  };
  try {
    await nav.ir(base);
    // Progreso de partida: los escenarios anteriores al que se prueba, superados (si no, estaría bloqueado)
    await nav.eval(`(() => { const esc = {}; NG.Escenarios.todos().filter(e => /^e\\d/.test(e.id) && e.orden < NG.Escenarios.obtener('${escId}').orden).forEach(e => { esc[e.id] = { mejor: 60, estrellas: 1, intentos: 1, superado: true }; });
      localStorage.setItem('negocia.v1', JSON.stringify({version:1, escenarios: esc, logros:{}, conceptos:[], ajustes:{sonido:false, volumen:0.5, velocidadTexto:'rapida', temporizadores:'normal', movimiento:'auto'}, guiaVista:true, tutorialVisto:false, partidas:0})); return 1; })()`);
    await nav.ir(base);
    await nav.eval(AYUDA);
    await paso('01-menu', null, 900);
    await paso('02-briefing', `NG.App.ir('briefing', {escenario: '${escId}'}); 1`, 900);
    await paso('03-preparacion', `__clic('.btn', 'Empezar la preparación')`, 1400);
    const esc = await nav.eval(`(() => { const e = NG.Escenarios.obtener('${escId}'); return { fichas: e.investigacion.map(f => f.titulo), modelo: e.partidaModelo.preparacion }; })()`);
    for (const id of esc.modelo.investigar) {
      await nav.eval(`(() => { const f = NG.Escenarios.obtener('${escId}').investigacion.find(x => x.id === '${id}'); return __clic('.carpeta-ficha', f.titulo); })()`);
      await nav.espera(250);
    }
    await paso('04-investigado', `document.querySelector('.tutorial-tarjeta [data-ok]') && document.querySelector('.tutorial-tarjeta [data-ok]').click(); 1`, 700);
    await paso('05-estrategia', `__clic('.btn', 'Siguiente')`, 900);
    const def = esc.modelo.definir;
    await nav.eval(`(() => { const r = document.querySelector('.batnas input[value="${def.batnaId}"]'); if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); } return 1; })()`);
    await nav.espera(300);
    await nav.eval(`(() => { const s = (n, v) => { const i = document.querySelector('.deslizadores input[name="' + n + '"]'); i.value = v; i.dispatchEvent(new Event('input', {bubbles:true})); }; s('reserva', ${def.reserva}); s('objetivo', ${def.objetivo}); return 1; })()`);
    await paso('06-estrategia-definida', null, 500);
    const tieneApertura = await nav.eval(`[...document.querySelectorAll('.prep-pie .btn')].some(b => b.textContent.includes('Siguiente: apertura'))`);
    if (tieneApertura) {
      await paso(null, `__clic('.btn', 'Siguiente: apertura')`, 900);
      if (def.apertura) await nav.eval(`(() => { const ap = ${JSON.stringify(def.apertura)}; document.querySelectorAll('.editor-variable').forEach((fs, i) => { const r = fs.querySelectorAll('input')[ap[i]]; r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); }); return 1; })()`);
      await paso('07-apertura', null, 600);
    }
    await paso('08-reunion', `__clic('.btn', 'Ir a la reunión')`, 2500);
    await nav.hasta('__listo()', 20000);
    await paso('09-negociacion-inicio', `document.querySelector('.tutorial-tarjeta [data-ok]') && document.querySelector('.tutorial-tarjeta [data-ok]').click(); 1`, 400);

    // Sigue el guion de la partida modelo, pero pulsando en la interfaz
    const pasos = await nav.eval(`NG.Escenarios.obtener('${escId}').partidaModelo.pasos.map(p => p.accion)`);
    let n = 10;
    for (const ac of pasos) {
      await nav.hasta('__listo()', 25000);
      // Imprevistos: elegir la opción de la experta
      while (await nav.eval(`!!document.querySelector('.evento-capa')`)) {
        await paso(String(n++).padStart(2, '0') + '-evento', null, 200);
        await nav.eval(`(() => { const ev = NG.Motor; const btns = [...document.querySelectorAll('.evento-opcion')]; btns[0].click(); return 1; })()`);
        await nav.espera(900);
        await nav.hasta('__listo()', 25000);
      }
      if (await nav.eval(`!!document.querySelector('.cinematica.visible')`)) break;
      const disponible = await nav.eval(`!!document.querySelector('[data-accion="${ac.tipo}"]:not([disabled])')`);
      if (!disponible) continue;
      await nav.eval(`__clic('[data-accion="${ac.tipo}"]')`);
      await nav.espera(400);
      if (ac.tipo === 'oferta') {
        await nav.eval(`(() => { const ap = ${JSON.stringify(ac.paquete)}; document.querySelectorAll('.neg-acciones .editor-variable').forEach((fs, i) => { const r = fs.querySelectorAll('input')[ap[i]]; r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); }); return 1; })()`);
        await paso(String(n++).padStart(2, '0') + '-editor-oferta', null, 300);
        await nav.eval(`__clic('.neg-acciones .btn', 'Enviar oferta')`);
      } else if (ac.tipo === 'pregunta' || ac.tipo === 'compartir') {
        await nav.eval(`(() => { const e = NG.Escenarios.obtener('${escId}'); const l = '${ac.tipo}' === 'pregunta' ? e.preguntas : e.informacion; const it = l.find(x => x.id === '${ac.id}'); return __clic('.opcion-lista', it.texto); })()`);
      } else if (ac.tipo === 'concesion') {
        await nav.eval(`(() => { const r = document.querySelector('input[name="ceder"][value="${ac.variable}"]'); r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); return 1; })()`);
        await nav.espera(200);
        await paso(String(n++).padStart(2, '0') + '-concesion', null, 200);
        await nav.eval(`__clic('.neg-acciones .btn', 'Proponer la concesión')`);
      } else if (ac.tipo === 'bilateral') {
        await nav.eval(`(() => { const e = NG.Escenarios.obtener('${escId}'); const c = (e.compromisos || []).find(x => x.id === '${ac.id}'); const q = (e.preguntas || []).find(x => x.id === '${ac.id}'); return __clic('.bilateral-grupo .opcion-lista', (c || q).texto); })()`);
        await paso(String(n++).padStart(2, '0') + '-bilateral', null, 200);
      } else if (ac.tipo === 'aceptar' || ac.tipo === 'presionar' || ac.tipo === 'abandonar') {
        await nav.espera(300);
        await nav.eval(`__clic('.modal-pie .btn-primario, .modal-pie .btn-peligro')`);
      }
      await nav.espera(1200);
      await paso(String(n++).padStart(2, '0') + '-tras-' + ac.tipo, null, 300);
    }
    // Si el guion termina sin cierre, aceptar lo que haya o levantarse
    await nav.hasta('__listo()', 25000);
    if (!(await nav.eval(`!!document.querySelector('.cinematica.visible')`))) {
      const puede = await nav.eval(`!!document.querySelector('[data-accion="aceptar"]:not([disabled])')`);
      await nav.eval("__clic('[data-accion=\"" + (puede ? 'aceptar' : 'abandonar') + "\"]')");
      await nav.espera(400);
      await nav.eval("__clic('.modal-pie .btn-primario, .modal-pie .btn-peligro')");
    }
    await nav.hasta(`!!document.querySelector('.cinematica.visible')`, 25000);
    await nav.espera(2600);
    await paso(String(n++).padStart(2, '0') + '-cinematica', null, 100);
    await nav.eval(`__clic('[data-continuar]')`);
    await nav.espera(2200);
    await paso(String(n++).padStart(2, '0') + '-debrief', null, 300);
    const alto = await nav.eval('document.documentElement.scrollHeight');
    for (let y = 900, k = 1; y < alto; y += 800, k++) {
      await nav.eval('window.scrollTo(0,' + y + '); 1');
      await paso(String(n++).padStart(2, '0') + '-debrief-' + k, null, 500);
    }
    const resumen = await nav.eval(`({ pantalla: NG.App.nombreActual, progreso: JSON.parse(localStorage.getItem('negocia.v1')).escenarios })`);
    console.log('Resultado:', JSON.stringify(resumen));
  } catch (e) {
    console.error('FALLO:', e.message);
    await nav.captura(path.join(dir, 'zz-fallo.png'));
    process.exitCode = 1;
  } finally {
    const err = nav.errores();
    console.log(err.length ? 'ERRORES DE CONSOLA:\n' + err.join('\n') : 'Sin errores de consola ✓');
    if (err.length) process.exitCode = 1;
    await nav.cerrar();
  }
})();
