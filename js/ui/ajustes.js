/* =====================================================================
 * NEGOCIA · ui/ajustes.js — ajustes y guía «Cómo se juega»
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  /* ---------- Guía rápida (entender el juego en 2 minutos) ---------- */
  const PASOS = [
    { icono: 'carpeta', titulo: '1 · Prepara', texto: 'Antes de sentarte, tienes un tiempo limitado para investigar. Elige bien: no puedes saberlo todo. Define tu <strong>BATNA</strong> (tu mejor alternativa si no hay acuerdo), tu <strong>punto de reserva</strong> (lo mínimo que aceptarás) y tu <strong>objetivo</strong>.' },
    { icono: 'apreton', titulo: '2 · Negocia', texto: 'Cada turno eliges una acción: ofertar, preguntar, compartir información, conceder, presionar, pedir una pausa, aceptar o levantarte. Observa a tu contraparte: su cara, su postura y el <strong>reloj</strong> de la mesa delatan su confianza y su paciencia.' },
    { icono: 'rayo', titulo: '3 · Decide bajo presión', texto: 'Llamadas, mensajes y filtraciones te obligarán a decidir con información parcial, a veces con cuenta atrás. Respira: la prisa es el terreno de los sesgos.' },
    { icono: 'grafico', titulo: '4 · Aprende', texto: 'Al terminar verás tu puntuación en cinco dimensiones, lo que quedó sobre la mesa, tus aciertos y errores turno a turno y los sesgos que cometiste. Repite con otra estrategia: el resultado cambiará.' }
  ];
  NG.Guia = {
    abrir(paso) {
      let i = paso || 0;
      const cont = UI().el('div', { class: 'guia' });
      const pintar = () => {
        const p = PASOS[i];
        const caja = cont.closest('.modal');
        if (caja) {
          const bts = caja.querySelectorAll('.modal-pie .btn');
          if (bts[0]) bts[0].style.visibility = i === 0 ? 'hidden' : 'visible';
          if (bts[1]) bts[1].querySelector('span').textContent = i === PASOS.length - 1 ? '¡A negociar!' : 'Siguiente';
        }
        cont.innerHTML = '<div class="guia-paso"><div class="guia-icono">' + UI().icono(p.icono) + '</div><h3>' + p.titulo + '</h3><p>' + p.texto + '</p></div>' +
          '<div class="guia-puntos" aria-hidden="true">' + PASOS.map((_, k) => '<span class="' + (k === i ? 'activo' : '') + '"></span>').join('') + '</div>';
      };
      pintar();
      const m = UI().modal({
        titulo: 'Cómo se juega', icono: 'ayuda', contenido: cont,
        acciones: [{ texto: 'Anterior', clase: 'btn-fantasma', cerrar: false, onClick: () => { i = Math.max(0, i - 1); pintar(); } },
          { texto: 'Siguiente', clase: 'btn-primario', cerrar: false, onClick: () => { if (i < PASOS.length - 1) { i++; pintar(); } else UI().cerrarModal(); } }]
      });
      pintar();
      return m;
    }
  };

  /* ---------- Ajustes ---------- */
  NG.Ajustes = {
    abrir() {
      const app = NG.App;
      const a = app.progreso.ajustes;
      const radio = (nombre, valor, texto, actual) => '<label class="opcion-seg"><input type="radio" name="' + nombre + '" value="' + valor + '"' + (actual === valor ? ' checked' : '') + '><span>' + texto + '</span></label>';
      const cont = UI().el('form', { class: 'ajustes', onsubmit: (e) => e.preventDefault() });
      cont.innerHTML =
        '<fieldset class="segmentado"><legend>Sonido</legend>' + radio('sonido', 'si', 'Activado', a.sonido ? 'si' : 'no') + radio('sonido', 'no', 'Silenciado', a.sonido ? 'si' : 'no') + '</fieldset>' +
        '<label class="ajuste-rango"><span>Volumen</span><input type="range" name="volumen" min="0" max="1" step="0.05" value="' + a.volumen + '"></label>' +
        '<fieldset class="segmentado"><legend>Velocidad del texto</legend>' + radio('velocidadTexto', 'lenta', 'Lenta', a.velocidadTexto) + radio('velocidadTexto', 'normal', 'Normal', a.velocidadTexto) + radio('velocidadTexto', 'rapida', 'Rápida', a.velocidadTexto) + radio('velocidadTexto', 'instantanea', 'Instantánea', a.velocidadTexto) + '</fieldset>' +
        '<fieldset class="segmentado"><legend>Temporizadores de los imprevistos</legend>' + radio('temporizadores', 'normal', 'Normales', a.temporizadores) + radio('temporizadores', 'ampliado', 'Doble de tiempo', a.temporizadores) + radio('temporizadores', 'sin', 'Sin límite', a.temporizadores) + '</fieldset>' +
        '<fieldset class="segmentado"><legend>Animaciones</legend>' + radio('movimiento', 'auto', 'Completas', a.movimiento) + radio('movimiento', 'reducido', 'Reducidas', a.movimiento) + '</fieldset>' +
        '<p class="texto-tenue">El juego respeta también la preferencia de «reducir movimiento» de tu sistema.</p>' +
        '<hr class="separador"><button type="button" class="btn btn-peligro btn-pequeno" data-reiniciar>' + UI().icono('repetir') + '<span>Borrar todo el progreso</span></button>';
      cont.addEventListener('change', () => {
        const f = new FormData(cont);
        a.sonido = f.get('sonido') === 'si';
        a.volumen = parseFloat(f.get('volumen'));
        a.velocidadTexto = f.get('velocidadTexto');
        a.temporizadores = f.get('temporizadores');
        a.movimiento = f.get('movimiento');
        app.aplicarAjustes(); app.guardar();
        NG.Sonido.reproducir('seleccion');
      });
      cont.querySelector('[data-reiniciar]').addEventListener('click', () => {
        UI().modal({
          titulo: '¿Borrar todo el progreso?', icono: 'repetir',
          contenido: '<p>Se borrarán tus puntuaciones, logros y escenarios desbloqueados. No se puede deshacer.</p>',
          acciones: [{ texto: 'Cancelar', clase: 'btn-fantasma' }, { texto: 'Borrar', clase: 'btn-peligro', onClick: () => { app.progreso = NG.Progreso.reiniciar(); app.progreso.guiaVista = true; app.guardar(); app.aplicarAjustes(); app.ir('menu'); } }]
        });
      });
      UI().modal({ titulo: 'Ajustes', icono: 'ajustes', contenido: cont, acciones: [{ texto: 'Listo', clase: 'btn-primario' }] });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
