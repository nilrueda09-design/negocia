/* =====================================================================
 * NEGOCIA · visual/cinematicas.js
 * Momentos de cierre: apretón de manos (acuerdo), silla vacía y puerta
 * que se cierra (ruptura), retirada del jugador (abandono).
 * Cada cinemática se pinta sobre la escena y devuelve una promesa que se
 * resuelve cuando el jugador pulsa «Ver el análisis».
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  function manos(colorIzq, colorDer, pielIzq, pielDer) {
    // Dos antebrazos que entran desde los lados y se encuentran en el centro
    return '<svg class="apreton" viewBox="0 0 800 300" aria-hidden="true">' +
      '<g class="mano-izq"><path d="M-40 210 L300 170" stroke="' + colorIzq + '" stroke-width="70" stroke-linecap="round"/>' +
      '<rect x="270" y="138" width="40" height="64" rx="10" fill="#eef2f7" transform="rotate(-7 290 170)"/>' +
      '<path d="M300 140 C350 120 410 130 430 160 C440 180 420 196 400 196 L330 202 C310 204 300 190 300 170 Z" fill="' + pielIzq + '"/></g>' +
      '<g class="mano-der"><path d="M840 210 L500 170" stroke="' + colorDer + '" stroke-width="70" stroke-linecap="round"/>' +
      '<rect x="490" y="138" width="40" height="64" rx="10" fill="#eef2f7" transform="rotate(7 510 170)"/>' +
      '<path d="M500 140 C450 124 392 134 372 162 C364 182 384 198 404 196 L470 200 C490 202 500 190 500 170 Z" fill="' + pielDer + '"/>' +
      '<path d="M392 150 C402 146 418 148 426 154 M396 164 C406 160 420 162 430 168 M400 178 C410 174 422 176 430 182" stroke="' + NG.Avatar.color.oscurecer(pielDer, 0.2) + '" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
      '</svg>';
  }

  /* Capa a pantalla completa (legible también en móvil); la escena sigue viéndose detrás. */
  function capa(escena, clase, html) {
    const c = document.createElement('div');
    c.className = 'cinematica ' + clase;
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-modal', 'true');
    c.setAttribute('aria-label', 'Final de la negociación');
    c.innerHTML = html;
    document.body.appendChild(c);
    requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('visible')));
    setTimeout(() => c.classList.add('visible'), 80);
    return c;
  }
  function esperarBoton(c) {
    return new Promise((resolver) => {
      const b = c.querySelector('[data-continuar]');
      setTimeout(() => { b.focus(); }, 900);
      b.addEventListener('click', () => { c.remove(); resolver(); }, { once: true });
    });
  }

  /* Acuerdo: apretón de manos con destellos dorados. */
  function acuerdo(escena, datos) {
    NG.Sonido.reproducir('fanfarria');
    const pj = datos.avatarParams || {};
    const c = capa(escena, 'cine-acuerdo',
      manos('#2b3a5c', pj.colorRopa || '#3a4d6e', '#e2ad86', pj.piel || '#f0c8a6') +
      '<div class="cine-texto"><span class="etiqueta ambar">' + UI().icono('apreton', 'icono-en-linea') + ' Acuerdo cerrado</span>' +
      '<h2>' + UI().escapar(datos.titulo || '¡Trato hecho!') + '</h2>' +
      '<p>' + UI().escapar(datos.resumen || '') + '</p>' +
      '<button type="button" class="btn btn-primario btn-grande" data-continuar>' + UI().icono('grafico') + '<span>Ver el análisis</span></button></div>');
    setTimeout(() => NG.Efectos.particulas(c, 50, 42, 'oro', 40), 650);
    UI().anunciar('Acuerdo cerrado. ' + (datos.resumen || ''));
    return esperarBoton(c);
  }

  /* Ruptura: la contraparte se levanta, la silla queda vacía y la puerta se cierra. */
  function ruptura(escena, datos) {
    NG.Sonido.reproducir('ruptura');
    escena.el.classList.add('se-levanta');
    Object.values(escena.avatares).forEach((a) => a.nodos.forEach((n) => n && n.closest('.hueco') && n.closest('.hueco').classList.add('levantandose')));
    setTimeout(() => { NG.Sonido.reproducir('puerta'); escena.oscurecer(true); }, 1300);
    const c = capa(escena, 'cine-ruptura',
      '<div class="cine-texto"><span class="etiqueta coral">' + UI().icono('puerta', 'icono-en-linea') + ' Sin acuerdo</span>' +
      '<h2>' + UI().escapar(datos.titulo || 'Se ha marchado') + '</h2><p>' + UI().escapar(datos.resumen || '') + '</p>' +
      '<button type="button" class="btn btn-primario btn-grande" data-continuar>' + UI().icono('grafico') + '<span>Ver el análisis</span></button></div>');
    UI().anunciar('Sin acuerdo. ' + (datos.resumen || ''));
    return esperarBoton(c);
  }

  /* Abandono del jugador: la cámara se aleja y la sala se apaga. */
  function abandono(escena, datos) {
    NG.Sonido.reproducir('puerta');
    escena.el.classList.add('alejando');
    escena.oscurecer(true);
    const c = capa(escena, 'cine-abandono',
      '<div class="cine-texto"><span class="etiqueta">' + UI().icono('salir', 'icono-en-linea') + ' Te levantas de la mesa</span>' +
      '<h2>' + UI().escapar(datos.titulo || 'Te quedas con tu alternativa') + '</h2><p>' + UI().escapar(datos.resumen || '') + '</p>' +
      '<button type="button" class="btn btn-primario btn-grande" data-continuar>' + UI().icono('grafico') + '<span>Ver el análisis</span></button></div>');
    UI().anunciar('Has abandonado la negociación. ' + (datos.resumen || ''));
    return esperarBoton(c);
  }

  NG.Cinematicas = { acuerdo, ruptura, abandono };
})(typeof window !== 'undefined' ? window : globalThis);
