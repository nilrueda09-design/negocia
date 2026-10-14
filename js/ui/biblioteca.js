/* =====================================================================
 * NEGOCIA · ui/biblioteca.js — Biblioteca de conceptos y sesgos
 * Fichas que se voltean: delante, la definición; detrás, un ejemplo,
 * cómo aplicarlo y la fuente. Se marcan las que ya has visto en partida.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  NG.Pantallas.biblioteca = {
    titulo: 'Biblioteca',
    montar(cont, params, app) {
      const vistos = new Set(app.progreso.conceptos);
      const fichas = NG.Conceptos.lista();
      const categorias = ['Todas'].concat(Array.from(new Set(fichas.map((f) => f.categoria))));
      let filtro = 'Todas', busqueda = '';
      cont.innerHTML =
        '<div class="contenedor biblioteca">' +
        '  <header class="bib-cabecera"><div><h1>Biblioteca</h1><p class="texto-suave">' + fichas.length + ' fichas de negociación y decisión. Las que has puesto en práctica en tus partidas llevan la marca ' + UI().icono('check', 'icono-en-linea') + '. ' +
        '<strong>' + fichas.filter((f) => vistos.has(f.id)).length + '/' + fichas.length + '</strong> descubiertas.</p></div>' +
        '    <label class="buscador">' + UI().icono('lupa') + '<span class="solo-lectores">Buscar en la biblioteca</span><input type="search" placeholder="Buscar: BATNA, anclaje, sesgo…"></label></header>' +
        '  <div class="filtros" role="tablist" aria-label="Categorías"></div>' +
        '  <div class="fichas-rejilla"></div>' +
        '</div>';
      const filtros = cont.querySelector('.filtros');
      categorias.forEach((c) => {
        const b = UI().el('button', { type: 'button', role: 'tab', class: 'filtro', 'aria-selected': c === filtro ? 'true' : 'false', 'data-sonido': 'seleccion' }, c);
        b.addEventListener('click', () => { filtro = c; filtros.querySelectorAll('.filtro').forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false')); pintar(); });
        filtros.appendChild(b);
      });
      cont.querySelector('.buscador input').addEventListener('input', (e) => { busqueda = e.target.value.toLowerCase().trim(); pintar(); });

      function pintar() {
        const rej = cont.querySelector('.fichas-rejilla');
        const lista = fichas.filter((f) => (filtro === 'Todas' || f.categoria === filtro) &&
          (!busqueda || (f.nombre + ' ' + f.definicion + ' ' + f.categoria).toLowerCase().includes(busqueda)));
        rej.innerHTML = lista.length ? '' : '<p class="texto-tenue">No hay fichas que coincidan.</p>';
        lista.forEach((f, i) => {
          const visto = vistos.has(f.id);
          const art = UI().el('article', { class: 'ficha-bib' + (visto ? ' vista' : '') + (f.categoria === 'Sesgos' ? ' sesgo' : ''), style: '--retardo:' + (i * 30) + 'ms' });
          art.innerHTML = '<div class="ficha-interior">' +
            '<div class="ficha-cara frente"><span class="ficha-cat">' + UI().icono(f.icono || 'libro', 'icono-en-linea') + ' ' + UI().escapar(f.categoria) + (visto ? '<span class="vista-marca" title="La has puesto en práctica">' + UI().icono('check') + '</span>' : '') + '</span>' +
            '<h2>' + UI().escapar(f.nombre) + '</h2><p>' + UI().escapar(f.definicion) + '</p>' +
            '<button type="button" class="btn btn-pequeno btn-fantasma voltear" aria-label="Ver ejemplo y cómo aplicar: ' + UI().escapar(f.nombre) + '">Ejemplo y aplicación ' + UI().icono('repetir') + '</button></div>' +
            '<div class="ficha-cara dorso">' + (f.ejemplo ? '<h3>Ejemplo</h3><p>' + UI().escapar(f.ejemplo) + '</p>' : '') + '<h3>Cómo aplicarlo</h3><p>' + UI().escapar(f.aplicar) + '</p>' +
            (f.fuente ? '<p class="fuente">' + UI().icono('libro', 'icono-en-linea') + ' ' + UI().escapar(f.fuente) + '</p>' : '') +
            '<button type="button" class="btn btn-pequeno btn-fantasma voltear" aria-label="Volver a la definición">Volver ' + UI().icono('repetir') + '</button></div></div>';
          art.querySelectorAll('.voltear').forEach((b) => b.addEventListener('click', () => {
            art.classList.toggle('volteada');
            NG.Sonido.reproducir('seleccion');
            const visible = art.querySelector(art.classList.contains('volteada') ? '.dorso .voltear' : '.frente .voltear');
            art.querySelectorAll('.ficha-cara').forEach((c) => { c.scrollTop = 0; });
            setTimeout(() => visible.focus({ preventScroll: true }), 250);
          }));
          rej.appendChild(art);
        });
      }
      pintar();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
