/* =====================================================================
 * NEGOCIA · ui/tutorial.js — mentora y tutorial guiado (escenario 1)
 * Tarjetas no bloqueantes que aparecen en momentos clave y señalan el
 * elemento del que hablan. Se pueden saltar en cualquier momento.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  const MENTORA = { nombre: 'Elena Ruiz', cargo: 'Tu mentora', avatar: { semilla: 404, genero: 'm', piel: 1, pelo: 'melena', colorPelo: '#b9b9b9', gafas: 'finas', ropa: 'blazer', colorRopa: '#2e4a43', colorCamisa: '#f4ece0', edad: 57, pendientes: 'perla', cara: 'ovalada' } };

  const TEXTOS = {
    'prep-investiga': { titulo: 'Prepararse es la mitad del trabajo', texto: 'Tienes <strong>6 puntos de preparación</strong> y no puedes investigarlo todo. Busca dos cosas: qué <strong>necesita</strong> la otra parte (no lo que pide) y cómo <strong>mejorar tu alternativa</strong> si no hay acuerdo. Lo que descubras se clavará en el tablón.' },
    'prep-batna': { titulo: 'Tu BATNA: tu red de seguridad', texto: 'La <strong>BATNA</strong> (Mejor Alternativa a un Acuerdo Negociado) es lo que harás si te levantas. Cuanto mejor sea, más poder tienes. Ojo con las alternativas que <strong>nadie ha verificado</strong>: pueden ser espejismos.' },
    'prep-reserva': { titulo: 'Punto de reserva y objetivo', texto: 'Tu <strong>punto de reserva</strong> es lo mínimo que aceptarás; lo sensato es que coincida con el valor de tu BATNA. Tu <strong>objetivo</strong> debe ser ambicioso pero realista: quien apunta más alto suele conseguir más.' },
    'prep-apertura': { titulo: 'El poder de la primera oferta', texto: 'Quien abre <strong>ancla</strong> la negociación: la primera cifra arrastra las expectativas de todos. Una apertura <strong>ambiciosa pero creíble</strong> te favorece; una extrema ofende y endurece a la otra parte. Fíjate en tus puntos en cada opción: no todas las variables te importan igual.' },
    'neg-inicio': { titulo: 'Un turno, una acción', texto: 'Cada turno eliges <strong>una acción</strong>. Observa a Jordi: su cara, su postura y el <strong>reloj de la mesa</strong> (su paciencia) te dicen cómo va la negociación. Cuando se acabe su paciencia, se marchará.' },
    'neg-contraoferta': { titulo: 'Lee la contraoferta', texto: 'Compara su propuesta con la tuya en la <strong>mesa</strong>. ¿En qué variable insiste? Lo que la otra parte defiende con más fuerza suele ser su prioridad… o una táctica. <strong>Preguntar</strong> te ayuda a distinguirlo.' },
    'neg-pista': { titulo: '¡Una pista valiosa!', texto: 'Has descubierto un <strong>interés</strong> de la otra parte. Si algo le importa mucho a ella y poco a ti, cédelo <strong>a cambio</strong> de lo que a ti te importa: es un <strong>intercambio integrativo</strong>. Así crece el pastel antes de repartirlo.' },
    'neg-evento': { titulo: 'Imprevisto', texto: 'La presión de tiempo activa el pensamiento rápido (el «Sistema 1» de Kahneman), terreno abonado para los sesgos. Antes de pulsar, pregúntate: ¿esto cambia de verdad mi BATNA o mis intereses?' },
    'neg-cierre': { titulo: '¿Cerrar o seguir?', texto: 'Si su propuesta supera tu objetivo, quizá sea momento de cerrar. Exprimir el último punto puede costarte la relación… o la paciencia de la otra parte.' }
  };

  let vistos = new Set();
  let tarjeta = null;

  function activo(esc) {
    return !!(esc && esc.tutorial && NG.App && !NG.App.progreso.tutorialVisto);
  }
  function reiniciar() { vistos = new Set(); }

  function mostrar(clave, objetivo) {
    if (vistos.has(clave) || !TEXTOS[clave]) return;
    vistos.add(clave);
    cerrar();
    const t = TEXTOS[clave];
    tarjeta = UI().el('aside', { class: 'tutorial-tarjeta', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'Consejo de tu mentora' });
    tarjeta.innerHTML = '<div class="tutorial-retrato">' + NG.Avatar.retrato(MENTORA.avatar, { id: 'mentora', etiqueta: MENTORA.nombre, expresion: 'receptivo', fondo: '#2a3a5f' }) + '</div>' +
      '<div class="tutorial-texto"><span class="tutorial-quien">' + MENTORA.nombre + ' · ' + MENTORA.cargo + '</span><h3>' + t.titulo + '</h3><p>' + t.texto + '</p>' +
      '<div class="fila"><button type="button" class="btn btn-primario btn-pequeno" data-ok>Entendido</button><button type="button" class="btn btn-fantasma btn-pequeno" data-saltar>Saltar tutorial</button></div></div>';
    document.body.appendChild(tarjeta);
    if (objetivo) { objetivo.classList.add('foco-tutorial'); tarjeta._objetivo = objetivo; }
    tarjeta.querySelector('[data-ok]').addEventListener('click', cerrar);
    tarjeta.querySelector('[data-saltar]').addEventListener('click', () => {
      NG.App.progreso.tutorialVisto = true; NG.App.guardar(); cerrar();
      UI().toast({ titulo: 'Tutorial desactivado', texto: 'Puedes volver a leer los conceptos en la ayuda (?) y en la Biblioteca.', icono: 'info' });
    });
    NG.Sonido.reproducir('notificacion');
    UI().anunciar(t.titulo + '. ' + t.texto.replace(/<[^>]+>/g, ''));
  }
  function cerrar() {
    if (!tarjeta) return;
    if (tarjeta._objetivo) tarjeta._objetivo.classList.remove('foco-tutorial');
    tarjeta.remove();
    tarjeta = null;
  }

  NG.Tutorial = { activo, mostrar, cerrar, reiniciar, MENTORA, TEXTOS };
})(typeof window !== 'undefined' ? window : globalThis);
