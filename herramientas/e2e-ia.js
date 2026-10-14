#!/usr/bin/env node
/* =====================================================================
 * Prueba de extremo a extremo del Modo IA con el cliente SIMULADO
 * (no llama a la API real ni necesita clave). Arranca el servidor local,
 * juega E1 escribiendo frases y comprueba que:
 *   - la caja «Dilo con tus palabras» aparece y se puede desactivar;
 *   - charla, pregunta, compartir, oferta y aceptar llegan al motor;
 *   - las respuestas narradas sustituyen a las clásicas (marca «IA»);
 *   - un fallo de la API no rompe nada y conserva el borrador;
 *   - sin clave o con doble clic (file://) no aparece la caja.
 * Uso: node herramientas/e2e-ia.js [dirCapturas]
 * ===================================================================== */
'use strict';
const path = require('path');
const fs = require('fs');
const { lanzar } = require('./e2e');

const dir = process.argv[2] || path.join(__dirname, '..', 'capturas', 'ia');
fs.mkdirSync(dir, { recursive: true });

const PROGRESO = `localStorage.setItem('negocia.v1', JSON.stringify({version:1, escenarios:{}, logros:{}, conceptos:[], ajustes:{sonido:false, volumen:0.5, velocidadTexto:'rapida', temporizadores:'sin', movimiento:'auto', modoIA:true}, guiaVista:true, tutorialVisto:true, partidas:0})); 1`;
const AYUDA = `
window.__listo = () => !!document.querySelector('.acciones-rejilla') || !!document.querySelector('.evento-capa') || !!document.querySelector('.cinematica.visible');
window.__decir = (t) => { const ta = document.querySelector('.chat-ia textarea'); if (!ta) return 'SIN-CAJA'; ta.value = t; ta.dispatchEvent(new Event('input', {bubbles:true})); ta.closest('form').requestSubmit(); return 'ok'; };
window.__acta = () => document.querySelector('.acta').textContent;
`;

(async () => {
  const { arrancar } = await import('../servidor/servidor.mjs');
  const srv = await arrancar({ puerto: 0, entorno: { NEGOCIA_IA_SIMULADA: '1' }, silencioso: true });
  const sinClave = await arrancar({ puerto: 0, entorno: {}, silencioso: true });
  const base = 'http://localhost:' + srv.puerto + '/';
  const nav = await lanzar({ ancho: 1440, alto: 900 });
  const fallos = [];
  const comprobar = (cond, texto) => { if (!cond) fallos.push(texto); console.log((cond ? '  ✓ ' : '  ✗ ') + texto); };
  let n = 1;
  const foto = (nombre) => nav.captura(path.join(dir, String(n++).padStart(2, '0') + '-' + nombre + '.png'));
  async function esperarTurno() {
    await nav.hasta('__listo()', 30000);
    while (await nav.eval(`!!document.querySelector('.evento-capa')`)) {
      await foto('evento');
      await nav.eval(`document.querySelectorAll('.evento-opcion')[0].click(); 1`);
      await nav.espera(900);
      await nav.hasta('__listo()', 30000);
    }
  }
  async function decir(texto, nombre) {
    const antes = await nav.eval('__acta().length');
    comprobar((await nav.eval('__decir(' + JSON.stringify(texto) + ')')) === 'ok', 'caja de texto disponible para: «' + texto + '»');
    await nav.hasta(`!!document.querySelector('.bocadillo')`, 8000);
    await nav.espera(900);
    await foto(nombre);
    await esperarTurno();
    return (await nav.eval('__acta()')).slice(antes);
  }
  try {
    await nav.ir(base);
    await nav.eval(PROGRESO);
    await nav.ir(base);
    await nav.eval(AYUDA);
    await nav.eval(`NG.App.ir('negociacion', { escenario: 'e1-proveedor' }); 1`);
    await nav.hasta(`!!document.querySelector('.chat-ia textarea')`, 15000);
    await esperarTurno();
    await foto('caja-ia');
    comprobar(await nav.eval(`NG.IA.activo && NG.IA.estado.modelo === 'simulado'`), 'el juego detecta el servidor de IA');

    const v = await nav.eval(`NG.Escenarios.obtener('e1-proveedor').variables.map(x => x.opciones)`);

    const turno0 = await nav.eval(`document.querySelector('.neg-turno b').textContent`);
    let nuevo = await decir('Buenos días, Jordi. Gracias por recibirme.', 'charla');
    comprobar(nuevo.includes('Sin efecto en la negociación'), 'una cortesía se responde sin ser una jugada');
    comprobar((await nav.eval(`document.querySelector('.neg-turno b').textContent`)) === turno0, 'la charla no consume turno');

    nuevo = await decir('¿Cómo encaja nuestro volumen en sus planes de producción?', 'pregunta');
    comprobar(nuevo.includes('Interpretado como: Pregunta'), 'la pregunta se interpreta como acción del motor');
    comprobar(nuevo.includes('[Simulación IA]'), 'la respuesta de Jordi la redacta la IA');

    nuevo = await decir('Te cuento: vamos a lanzar una línea nueva de frigoríficos y podríamos necesitar más volumen.', 'compartir');
    comprobar(nuevo.includes('Interpretado como: Comparte'), 'compartir información llega al motor');

    // Fallo de la API: aviso, borrador conservado y la partida sigue
    await nav.eval('__decir("Propongo algo raro #error")');
    await nav.hasta(`!!document.querySelector('.chat-ia textarea') && document.querySelector('.chat-ia textarea').value.includes('#error')`, 15000);
    await foto('fallo-api');
    comprobar(await nav.eval(`[...document.querySelectorAll('.toast')].some(t => t.textContent.includes('La IA no ha respondido'))`), 'un fallo de la API muestra un aviso');
    comprobar(true, 'el borrador se conserva tras el fallo');
    await nav.eval(`(() => { const ta = document.querySelector('.chat-ia textarea'); ta.value = ''; ta.dispatchEvent(new Event('input', {bubbles:true})); return 1; })()`);

    const turnoAntes = +(await nav.eval(`document.querySelector('.neg-turno b').textContent`));
    nuevo = await decir('Propongo ' + v[0][1] + ', ' + v[1][2] + ' y ' + v[2][3] + '. Es justo según el índice de mercado.', 'oferta');
    comprobar(nuevo.includes('Interpretado como: Oferta'), 'la oferta en lenguaje natural llega al motor');
    comprobar(+(await nav.eval(`document.querySelector('.neg-turno b').textContent`)) > turnoAntes, 'la oferta consume un turno (el motor la ha procesado)');
    await foto('mesa-tras-oferta');

    // Desactivar el Modo IA: vuelven las líneas clásicas
    await nav.eval(`(() => { const c = document.querySelector('.chat-ia [name="activo"]'); c.checked = false; c.dispatchEvent(new Event('change', {bubbles:true})); return 1; })()`);
    await nav.espera(300);
    comprobar(await nav.eval(`!document.querySelector('.chat-ia textarea') && document.querySelector('.chat-ia').textContent.includes('desactivado')`), 'el Modo IA se puede desactivar');
    await foto('ia-desactivada');
    const antes = await nav.eval('__acta().length');
    await nav.eval(`document.querySelector('[data-accion="pregunta"]').click(); 1`);
    await nav.espera(300);
    await nav.eval(`document.querySelector('.opcion-lista').click(); 1`);
    await esperarTurno();
    comprobar(!(await nav.eval('__acta()')).slice(antes).includes('[Simulación IA]'), 'con el Modo IA desactivado se usan las líneas clásicas');
    await nav.eval(`(() => { const c = document.querySelector('.chat-ia [name="activo"]'); c.checked = true; c.dispatchEvent(new Event('change', {bubbles:true})); return 1; })()`);
    await nav.espera(300);

    // Cerrar: «acepto» pide confirmación siempre
    if (await nav.eval(`!!document.querySelector('[data-accion="aceptar"]:not([disabled])')`)) {
      await nav.eval('__decir("De acuerdo, acepto su propuesta. Trato hecho.")');
      await nav.hasta(`!!document.querySelector('.modal-pie .btn-primario')`, 15000);
      await foto('confirmar-aceptar');
      comprobar(true, '«acepto» abre la confirmación antes de cerrar');
      await nav.eval(`document.querySelector('.modal-pie .btn-primario').click(); 1`);
      await nav.hasta(`!!document.querySelector('.cinematica.visible')`, 30000);
      await nav.espera(1500);
      await foto('acuerdo');
      comprobar(true, 'la partida termina con la cinemática de acuerdo');
    } else console.log('  · No había propuesta suya que aceptar en esta semilla; se omite el cierre');

    // Móvil
    const movil = await lanzar({ ancho: 375, alto: 812, movil: true });
    await movil.ir(base);
    await movil.eval(PROGRESO);
    await movil.ir(base);
    await movil.eval(`NG.App.ir('negociacion', { escenario: 'e1-proveedor' }); 1`);
    await movil.hasta(`!!document.querySelector('.chat-ia textarea') && !!document.querySelector('.acciones-rejilla')`, 20000);
    await movil.eval(`document.querySelector('.neg-acciones').scrollIntoView(); 1`);
    await movil.espera(400);
    await movil.captura(path.join(dir, String(n++).padStart(2, '0') + '-movil.png'));
    comprobar(await movil.eval(`document.documentElement.scrollWidth <= 375`), 'móvil: sin desbordamiento horizontal');
    const errMovil = movil.errores();
    await movil.cerrar();
    comprobar(!errMovil.length, 'móvil: sin errores de consola' + (errMovil.length ? ' → ' + errMovil.join(' | ') : ''));

    // Servidor sin clave y doble clic: modo clásico, sin caja
    for (const [nombre, url] of [['sin clave', 'http://localhost:' + sinClave.puerto + '/'], ['file://', 'file://' + path.join(__dirname, '..', 'index.html')]]) {
      await nav.ir(url);
      await nav.eval(PROGRESO);
      await nav.ir(url);
      await nav.eval(`NG.App.ir('negociacion', { escenario: 'e1-proveedor' }); 1`);
      await nav.hasta(`!!document.querySelector('.acciones-rejilla')`, 20000);
      await nav.espera(800);
      comprobar(await nav.eval(`!document.querySelector('.chat-ia') && !NG.IA.activo`), nombre + ': modo clásico, sin caja de IA');
    }
  } catch (e) {
    fallos.push(e.message);
    console.error('FALLO:', e.message);
    await foto('zz-fallo');
  } finally {
    // El 502 provocado a propósito con «#error» aparece en la consola como recurso fallido
    const err = nav.errores().filter((x) => !/status of 502/.test(x));
    console.log(err.length ? 'ERRORES DE CONSOLA:\n' + err.join('\n') : 'Sin errores de consola ✓');
    await nav.cerrar();
    await srv.cerrar(); await sinClave.cerrar();
    if (err.length || fallos.length) { console.log(fallos.length + ' comprobaciones fallidas'); process.exitCode = 1; }
    else console.log('Todas las comprobaciones superadas ✓');
  }
})();
