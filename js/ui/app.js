/* =====================================================================
 * NEGOCIA · ui/app.js
 * Arranque y enrutado entre pantallas, barra superior, ajustes globales
 * (sonido, movimiento) y guardado del progreso.
 * Cada pantalla se registra en NG.Pantallas[nombre] = { titulo, barra, montar(cont, params, app) }
 * y su montar() puede devolver { desmontar() }.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  NG.Pantallas = NG.Pantallas || {};
  const UI = () => NG.UI;

  const app = {
    progreso: null,
    actual: null,
    nombreActual: null,
    contenedor: null,

    iniciar() {
      app.progreso = NG.Progreso.cargar();
      app.contenedor = document.getElementById('pantalla');
      app.aplicarAjustes();
      app.prepararBarra();
      window.addEventListener('error', (e) => { if (window.console) console.error('[NEGOCIA]', e.message); });
      const hash = (location.hash || '').replace('#', '');
      app.ir(NG.Pantallas[hash] && !NG.Pantallas[hash].requiereParams ? hash : 'menu');
    },

    guardar() { NG.Progreso.guardar(app.progreso); app.actualizarBarra(); },

    aplicarAjustes() {
      const a = app.progreso.ajustes;
      document.body.classList.toggle('sin-movimiento', a.movimiento === 'reducido');
      if (NG.Sonido) { NG.Sonido.activar(a.sonido); NG.Sonido.fijarVolumen(a.volumen); }
      const b = document.getElementById('btn-sonido');
      if (b) {
        b.setAttribute('aria-pressed', a.sonido ? 'true' : 'false');
        b.setAttribute('aria-label', a.sonido ? 'Silenciar el sonido' : 'Activar el sonido');
        b.innerHTML = UI().icono(a.sonido ? 'sonido' : 'silencio');
      }
    },
    movimientoReducido() {
      return app.progreso.ajustes.movimiento === 'reducido' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },
    /* Milisegundos por carácter del efecto de escritura según el ajuste. */
    velocidadTexto() {
      if (app.movimientoReducido()) return 0;
      return { lenta: 34, normal: 20, rapida: 9, instantanea: 0 }[app.progreso.ajustes.velocidadTexto] || 20;
    },
    factorTemporizador() { return { normal: 1, ampliado: 2, sin: 0 }[app.progreso.ajustes.temporizadores] || 1; },

    prepararBarra() {
      const barra = document.getElementById('barra');
      barra.querySelector('.barra-logo').innerHTML = UI().emblema() + '<b>NEGOCIA</b>';
      barra.querySelector('.barra-logo').addEventListener('click', () => app.confirmarSalida(() => app.ir('menu')));
      document.getElementById('btn-sonido').addEventListener('click', () => {
        app.progreso.ajustes.sonido = !app.progreso.ajustes.sonido;
        NG.Sonido.desbloquear();
        app.aplicarAjustes(); app.guardar();
        if (app.progreso.ajustes.sonido) NG.Sonido.reproducir('clic');
      });
      document.getElementById('btn-ayuda').innerHTML = UI().icono('ayuda');
      document.getElementById('btn-ayuda').addEventListener('click', () => NG.Guia.abrir());
      document.getElementById('btn-ajustes').innerHTML = UI().icono('ajustes');
      document.getElementById('btn-ajustes').addEventListener('click', () => NG.Ajustes.abrir());
      app.actualizarBarra();
    },
    actualizarBarra() {
      const r = NG.Progreso.rango(app.progreso);
      const el = document.getElementById('barra-rango');
      if (el) el.innerHTML = UI().icono('trofeo') + '<span>' + r.nombre + ' · ' + r.total + '</span>';
    },
    titulo(texto) { const t = document.getElementById('barra-titulo'); if (t) t.textContent = texto || ''; },

    /* Algunas pantallas (negociación) piden confirmación antes de salir. */
    salidaProtegida: null,
    confirmarSalida(continuar) {
      if (!app.salidaProtegida) return continuar();
      UI().modal({
        titulo: '¿Salir de la negociación?', icono: 'salir',
        contenido: '<p>Perderás el progreso de esta partida. La negociación no contará en tu historial.</p>',
        acciones: [{ texto: 'Seguir negociando', clase: 'btn-fantasma' }, { texto: 'Salir', clase: 'btn-peligro', onClick: () => { app.salidaProtegida = null; continuar(); } }]
      });
    },

    ir(nombre, params) {
      const def = NG.Pantallas[nombre];
      if (!def) throw new Error('Pantalla desconocida: ' + nombre);
      UI().cerrarModal(true);
      app.salidaProtegida = null;
      const cont = app.contenedor;
      const cambiar = () => {
        if (app.actual && app.actual.desmontar) { try { app.actual.desmontar(); } catch (e) { console.error(e); } }
        cont.innerHTML = '';
        cont.className = 'pantalla pantalla-' + nombre;
        document.getElementById('barra').hidden = def.barra === false;
        app.titulo(def.titulo || '');
        app.nombreActual = nombre;
        app.actual = def.montar(cont, params || {}, app) || null;
        cont.classList.add('entrando');
        const quitar = () => cont.classList.remove('entrando');
        requestAnimationFrame(() => requestAnimationFrame(quitar));
        setTimeout(quitar, 120); // respaldo: en pestañas ocultas rAF no se ejecuta
        window.scrollTo(0, 0);
        if (history.replaceState && !def.requiereParams) history.replaceState(null, '', nombre === 'menu' ? location.pathname : '#' + nombre);
        const h = cont.querySelector('h1, h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      };
      if (app.actual && !app.movimientoReducido()) {
        NG.Sonido.reproducir('barrido');
        cont.classList.add('saliendo');
        setTimeout(() => { cont.classList.remove('saliendo'); cambiar(); }, 220);
      } else cambiar();
    }
  };

  NG.App = app;
  document.addEventListener('DOMContentLoaded', () => app.iniciar());
})(typeof window !== 'undefined' ? window : globalThis);
