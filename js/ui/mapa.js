/* =====================================================================
 * NEGOCIA · ui/mapa.js — mapa de campaña
 * Ciudad nocturna con los cinco escenarios como edificios-nodo unidos
 * por un camino que se ilumina al avanzar. Los nodos son botones HTML
 * superpuestos (accesibles con teclado y lector de pantalla).
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  /* Posiciones de los nodos en el viewBox 1200×700 y silueta de cada edificio. */
  const NODOS = [
    { x: 170, y: 540, edificio: 'aceria' },
    { x: 420, y: 400, edificio: 'oficina' },
    { x: 660, y: 520, edificio: 'torre' },
    { x: 880, y: 360, edificio: 'conservera' },
    { x: 1060, y: 210, edificio: 'textil' }
  ];

  function edificio(tipo, x, y, encendido) {
    const luz = encendido ? '#ffd27a' : '#3b4566';
    const ventanas = (x0, y0, cols, filas, w, h, gx, gy) => {
      let s = '';
      for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) s += '<rect x="' + (x0 + i * gx) + '" y="' + (y0 + j * gy) + '" width="' + w + '" height="' + h + '" fill="' + luz + '" opacity="' + (encendido ? (0.55 + ((i + j) % 3) * 0.15) : 0.6) + '"/>';
      return s;
    };
    const g = (c) => '<g transform="translate(' + (x - 60) + ' ' + (y - 150) + ')">' + c + '</g>';
    switch (tipo) {
      case 'aceria': return g('<rect x="0" y="70" width="120" height="80" fill="#2a3150"/><path d="M0 70 l30 -24 l30 24 l30 -24 l30 24 Z" fill="#323a5c"/><rect x="88" y="10" width="16" height="70" fill="#323a5c"/>' + (encendido ? '<ellipse cx="96" cy="2" rx="20" ry="9" fill="#9aa7b8" opacity=".5"/>' : '') + ventanas(10, 90, 5, 2, 12, 10, 22, 22));
      case 'oficina': return g('<rect x="20" y="10" width="80" height="140" rx="4" fill="#26315a"/><rect x="20" y="10" width="80" height="140" rx="4" fill="#5b8cff" opacity=".08"/>' + ventanas(28, 20, 4, 8, 12, 9, 18, 16));
      case 'torre': return g('<rect x="30" y="-10" width="60" height="160" fill="#2b2f4a"/><path d="M30 -10 l30 -30 l30 30 Z" fill="#363b5c"/>' + ventanas(36, 0, 3, 9, 12, 9, 17, 16));
      case 'conservera': return g('<rect x="0" y="80" width="120" height="70" fill="#3a2e33"/><path d="M0 80 l60 -36 l60 36 Z" fill="#46383d"/><rect x="40" y="96" width="40" height="54" fill="#2a2226"/>' + ventanas(8, 96, 2, 2, 14, 12, 92, 26));
      default: return g('<rect x="0" y="50" width="120" height="100" fill="#2d3348"/><path d="M0 50 l20 -16 l20 16 l20 -16 l20 16 l20 -16 l20 16 Z" fill="#373d55"/>' + ventanas(10, 66, 5, 3, 12, 10, 22, 26));
    }
  }

  NG.Pantallas.mapa = {
    titulo: 'Mapa de campaña',
    montar(cont, params, app) {
      const prog = app.progreso;
      const esc = NG.Escenarios.todos().filter((e) => /^e\d/.test(e.id));
      const r = NG.Progreso.rango(prog);
      const sig = NG.Progreso.siguienteEscenario(prog);
      const estados = esc.map((e) => ({ e, abierto: NG.Progreso.desbloqueado(prog, e), reg: NG.Progreso.registro(prog, e.id) }));

      // Camino entre nodos (tramos completados en oro)
      let camino = '';
      for (let i = 0; i < NODOS.length - 1; i++) {
        const a = NODOS[i], b = NODOS[i + 1];
        const hecho = estados[i] && estados[i].reg.superado;
        const cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - 40;
        camino += '<path d="M' + a.x + ' ' + a.y + ' Q' + cx + ' ' + cy + ' ' + b.x + ' ' + b.y + '" class="tramo' + (hecho ? ' hecho' : '') + '"/>';
      }
      const fondo = '<svg class="mapa-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<defs>' + NG.Objetos.grad('mapa-cielo', [['0', '#0a0f22'], ['1', '#18204a']]) + '</defs>' +
        '<rect width="1200" height="700" fill="url(#mapa-cielo)"/>' +
        Array.from({ length: 40 }, (_, i) => '<circle cx="' + ((i * 271) % 1200) + '" cy="' + ((i * 97) % 220) + '" r="1.4" fill="#fff" opacity="' + (0.25 + (i % 4) * 0.15) + '"/>').join('') +
        NG.Objetos.skyline(-20, 160, 1240, 220, { semilla: 4, luces: 0.12, colorLuz: '#8fa8ff', capas: [{ color: '#151c3d', alto: 0.8, ancho: [40, 90] }] }) +
        '<path d="M0 430 C200 400 400 470 600 440 C800 410 1000 470 1200 430 L1200 700 L0 700 Z" fill="#111733"/>' +
        '<path d="M0 640 C250 600 450 690 720 650 C950 615 1080 680 1200 650" stroke="#24305e" stroke-width="40" fill="none" opacity=".7"/>' +
        '<g class="tramos">' + camino + '</g>' +
        NODOS.map((n, i) => (estados[i] ? edificio(n.edificio, n.x, n.y - 30, estados[i].abierto) : '')).join('') +
        '</svg>';

      cont.innerHTML =
        '<div class="contenedor mapa">' +
        '  <header class="mapa-cabecera"><div><h1>Mapa de campaña</h1><p class="texto-suave">Cinco negociaciones de dificultad creciente. Supera cada una (★) para desbloquear la siguiente.</p></div></header>' +
        '  <div class="mapa-rejilla">' +
        '    <div class="mapa-lienzo">' + fondo + '<ol class="mapa-nodos" aria-label="Escenarios de la campaña"></ol></div>' +
        '    <aside class="mapa-lateral">' +
        '      <section class="panel tarjeta-rango"><div class="panel-cuerpo"><h2 class="panel-titulo">' + UI().icono('trofeo') + ' Tu rango</h2>' +
        '        <div class="rango-grande"><span class="rango-insignia r-' + r.id + '">' + UI().icono('trofeo') + '</span><div><strong>' + r.nombre + '</strong><small>' + r.descripcion + '</small></div></div>' +
        '        <div class="escalera-rangos">' + NG.Progreso.RANGOS.map((x, i) => '<span class="' + (i <= r.indice ? 'alcanzado' : '') + (i === r.indice ? ' actual' : '') + '"><b>' + x.nombre + '</b><small>' + x.desde + '</small></span>').join('') + '</div>' +
        '        <p class="texto-tenue">' + (r.siguiente ? 'Te faltan <strong>' + r.faltan + ' puntos</strong> para ' + r.siguiente.nombre + ' (suma de tus mejores puntuaciones).' : 'Has alcanzado el rango máximo.') + '</p></div></section>' +
        '      <section class="panel"><div class="panel-cuerpo mapa-accesos"></div></section>' +
        '    </aside>' +
        '  </div>' +
        '</div>';

      const lista = cont.querySelector('.mapa-nodos');
      estados.forEach(({ e, abierto, reg }, i) => {
        const n = NODOS[i];
        const li = UI().el('li', { class: 'nodo' + (abierto ? '' : ' bloqueado') + (reg.superado ? ' superado' : '') + (e.id === sig.id && abierto ? ' siguiente' : ''), style: 'left:' + (n.x / 1200 * 100) + '%;top:' + (n.y / 700 * 100) + '%' });
        const etiqueta = 'Escenario ' + e.orden + ': ' + e.titulo + (abierto ? (reg.superado ? ', superado con ' + reg.estrellas + ' estrellas, mejor puntuación ' + reg.mejor : ', disponible') : ', bloqueado');
        const b = UI().el('button', { type: 'button', class: 'nodo-boton', 'aria-label': etiqueta, 'data-sonido': 'clic' },
          '<span class="nodo-circulo">' + (abierto ? e.orden : UI().icono('candado')) + '</span>' +
          '<span class="nodo-ficha"><strong>' + UI().escapar(e.titulo) + '</strong><small>' + UI().escapar(e.subtitulo) + '</small>' +
          (reg.intentos ? UI().estrellas(reg.estrellas) + '<em>Mejor: ' + reg.mejor + '</em>' : (abierto ? '<em class="nuevo">¡Disponible!</em>' : '<em>Supera el anterior</em>')) + '</span>');
        b.addEventListener('click', () => {
          if (!abierto) { NG.Sonido.reproducir('error'); UI().toast({ titulo: 'Escenario bloqueado', texto: 'Supera «' + esc[i - 1].titulo + '» (al menos una estrella) para desbloquearlo.', icono: 'candado' }); return; }
          app.ir('briefing', { escenario: e.id });
        });
        li.appendChild(b);
        lista.appendChild(li);
      });

      const acc = cont.querySelector('.mapa-accesos');
      acc.appendChild(UI().boton({ texto: 'Biblioteca de conceptos', icono: 'libro', clase: 'btn-bloque', onClick: () => app.ir('biblioteca') }));
      acc.appendChild(UI().boton({ texto: 'Logros (' + Object.keys(prog.logros).length + '/' + NG.Logros.length + ')', icono: 'trofeo', clase: 'btn-bloque', onClick: () => app.ir('logros') }));
      acc.appendChild(UI().boton({ texto: 'Menú principal', icono: 'atras', clase: 'btn-fantasma btn-bloque', onClick: () => app.ir('menu') }));
      const foco = params.foco && lista.querySelector('.siguiente .nodo-boton');
      if (foco) setTimeout(() => foco.focus({ preventScroll: true }), 300);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
