/* =====================================================================
 * NEGOCIA · visual/objetos.js
 * Piezas SVG reutilizables para componer escenas (estilo flat).
 * Todas devuelven cadenas SVG. Las que usan degradados reciben un "uid"
 * para que los id de <defs> no colisionen entre escenas.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const U = NG.Util;
  const C = () => NG.Avatar.color;

  const grad = (id, stops, x2, y2) =>
    '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 === undefined ? 0 : x2) + '" y2="' + (y2 === undefined ? 1 : y2) + '">' +
    stops.map(([o, c, op]) => '<stop offset="' + o + '" stop-color="' + c + '"' + (op !== undefined ? ' stop-opacity="' + op + '"' : '') + '/>').join('') + '</linearGradient>';

  const CIELOS = {
    dia: [['0', '#9cc7ec'], ['1', '#dbe9f3']],
    atardecer: [['0', '#3b3a6e'], ['.45', '#c0607a'], ['.8', '#f2a65a'], ['1', '#f7cf8a']],
    noche: [['0', '#0b1430'], ['1', '#23305a']],
    nublado: [['0', '#a9b4c2'], ['1', '#d6dce4']]
  };

  /* Silueta de ciudad con ventanas iluminadas (determinista con semilla). */
  function skyline(x, y, w, h, opts) {
    opts = opts || {};
    const rng = U.crearRng(opts.semilla || 7);
    const capas = opts.capas || [{ color: '#7d8fab', alto: 0.55, ancho: [40, 90] }, { color: '#5d6f8e', alto: 0.8, ancho: [50, 110] }];
    let s = '';
    capas.forEach((capa, ci) => {
      let cx = x - 20;
      while (cx < x + w) {
        const bw = U.entero(rng, capa.ancho[0], capa.ancho[1]);
        const bh = h * capa.alto * U.entre(rng, 0.45, 1);
        const by = y + h - bh;
        s += '<rect x="' + cx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw + '" height="' + bh.toFixed(1) + '" fill="' + capa.color + '"/>';
        if (U.probabilidad(rng, 0.3)) s += '<rect x="' + (cx + bw * 0.4).toFixed(1) + '" y="' + (by - 14).toFixed(1) + '" width="' + (bw * 0.2).toFixed(1) + '" height="14" fill="' + capa.color + '"/>';
        if (opts.luces && ci === capas.length - 1) {
          let v = '';
          for (let wy = by + 10; wy < y + h - 8; wy += 14) for (let wx = cx + 7; wx < cx + bw - 8; wx += 12) {
            if (U.probabilidad(rng, opts.luces)) v += '<rect x="' + wx.toFixed(1) + '" y="' + wy.toFixed(1) + '" width="5" height="7" fill="' + (opts.colorLuz || '#ffd98a') + '" opacity="' + U.entre(rng, 0.45, 0.95).toFixed(2) + '"/>';
          }
          s += '<g class="ventanas-ciudad" style="animation-delay:' + U.entre(rng, 0, 6).toFixed(1) + 's">' + v + '</g>';
        }
        cx += bw + U.entero(rng, 0, 6);
      }
    });
    return s;
  }

  /* Ventana con vista (ciudad, fábrica, árboles) y marco con montantes. */
  function ventana(uid, o) {
    const id = uid + '-cielo';
    const hora = o.hora || 'dia';
    let s = '<defs>' + grad(id, CIELOS[hora]) + '<clipPath id="' + uid + '-clipv"><rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '"/></clipPath></defs>';
    s += '<g clip-path="url(#' + uid + '-clipv)">';
    s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="url(#' + id + ')"/>';
    if (hora === 'atardecer') s += '<circle cx="' + (o.x + o.w * 0.72) + '" cy="' + (o.y + o.h * 0.78) + '" r="' + (o.h * 0.13) + '" fill="#ffe2a8" opacity=".9"/>';
    if (hora === 'dia') s += '<ellipse cx="' + (o.x + o.w * 0.25) + '" cy="' + (o.y + o.h * 0.22) + '" rx="60" ry="16" fill="#fff" opacity=".7"/><ellipse cx="' + (o.x + o.w * 0.3) + '" cy="' + (o.y + o.h * 0.2) + '" rx="34" ry="14" fill="#fff" opacity=".8"/>';
    if (o.vista === 'fabrica') {
      const by = o.y + o.h * 0.58;
      s += skyline(o.x, o.y + o.h * 0.35, o.w, o.h * 0.4, { semilla: 3, capas: [{ color: '#9aa7b8', alto: 0.6, ancho: [60, 120] }] });
      s += '<rect x="' + o.x + '" y="' + by + '" width="' + o.w + '" height="' + (o.h * 0.42) + '" fill="#7b8696"/>';
      for (let i = 0; i < 5; i++) {
        const nx = o.x + 20 + i * (o.w / 5);
        s += '<path d="M' + nx + ' ' + by + ' l' + (o.w / 10) + ' -28 l' + (o.w / 10) + ' 28 Z" fill="#6c7787"/>';
      }
      s += '<rect x="' + (o.x + o.w * 0.78) + '" y="' + (o.y + o.h * 0.18) + '" width="22" height="' + (o.h * 0.42) + '" fill="#6a7381"/>';
      s += '<ellipse cx="' + (o.x + o.w * 0.78 + 11) + '" cy="' + (o.y + o.h * 0.12) + '" rx="30" ry="14" fill="#fff" opacity=".5"/>';
      s += '<rect x="' + o.x + '" y="' + (o.y + o.h * 0.88) + '" width="' + o.w + '" height="' + (o.h * 0.12) + '" fill="#596273"/>';
    } else if (o.vista === 'arboles') {
      s += skyline(o.x, o.y + o.h * 0.3, o.w, o.h * 0.5, { semilla: 5, capas: [{ color: '#b5c3d3', alto: 0.7, ancho: [50, 100] }] });
      for (let i = 0; i < 7; i++) s += '<circle cx="' + (o.x + 30 + i * o.w / 6.5) + '" cy="' + (o.y + o.h * 0.82) + '" r="' + (40 + (i % 3) * 10) + '" fill="' + (i % 2 ? '#6f9a6e' : '#5e8a62') + '"/>';
    } else {
      const noche = hora === 'noche' || hora === 'atardecer';
      s += skyline(o.x, o.y + o.h * 0.2, o.w, o.h * 0.8, {
        semilla: o.semilla || 11, luces: noche ? 0.35 : 0,
        capas: noche ? [{ color: '#3a3f66', alto: 0.6, ancho: [40, 90] }, { color: '#232849', alto: 0.85, ancho: [50, 110] }] : [{ color: '#a9bad0', alto: 0.6, ancho: [40, 90] }, { color: '#8597b3', alto: 0.85, ancho: [50, 110] }]
      });
    }
    s += '</g>';
    // Marco y montantes
    const m = o.marco || '#e9e6df';
    s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="none" stroke="' + m + '" stroke-width="' + (o.grosor || 12) + '"/>';
    const cols = o.columnas || 2, filas = o.filas || 1;
    for (let i = 1; i < cols; i++) s += '<rect x="' + (o.x + (o.w * i) / cols - 4) + '" y="' + o.y + '" width="8" height="' + o.h + '" fill="' + m + '"/>';
    for (let j = 1; j < filas; j++) s += '<rect x="' + o.x + '" y="' + (o.y + (o.h * j) / filas - 3) + '" width="' + o.w + '" height="6" fill="' + m + '"/>';
    s += '<rect x="' + (o.x - 14) + '" y="' + (o.y + o.h + 4) + '" width="' + (o.w + 28) + '" height="12" rx="3" fill="' + C().oscurecer(m, 0.12) + '"/>';
    // Reflejo
    s += '<path d="M' + (o.x + o.w * 0.08) + ' ' + (o.y + o.h) + ' L' + (o.x + o.w * 0.3) + ' ' + o.y + ' L' + (o.x + o.w * 0.38) + ' ' + o.y + ' L' + (o.x + o.w * 0.16) + ' ' + (o.y + o.h) + ' Z" fill="#fff" opacity=".07"/>';
    return s;
  }

  function estanteria(o) {
    const c = o.color || '#6b4f3a', osc = C().oscurecer(c, 0.25);
    const rng = U.crearRng(o.semilla || 21);
    const libros = ['#8a3b3b', '#2f5d7a', '#d3b26a', '#3e6b4f', '#5b4a7a', '#c7c2b6', '#b5643a', '#334155'];
    let s = '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="' + osc + '"/>';
    const baldas = o.baldas || 4, alto = o.h / baldas;
    for (let b = 0; b < baldas; b++) {
      const y0 = o.y + b * alto;
      s += '<rect x="' + o.x + '" y="' + (y0 + alto - 8) + '" width="' + o.w + '" height="8" fill="' + c + '"/>';
      let bx = o.x + 10;
      while (bx < o.x + o.w - 22) {
        if (o.objetos && U.probabilidad(rng, 0.12)) {
          s += o.objetos(bx, y0 + alto - 8, rng); bx += 46; continue;
        }
        const bw = U.entero(rng, 10, 18), bh = alto * U.entre(rng, 0.55, 0.82);
        const inclinado = U.probabilidad(rng, 0.1);
        s += '<rect x="' + bx + '" y="' + (y0 + alto - 8 - bh).toFixed(1) + '" width="' + bw + '" height="' + bh.toFixed(1) + '" rx="1.5" fill="' + U.elegir(rng, o.colores || libros) + '"' +
          (inclinado ? ' transform="rotate(8 ' + bx + ' ' + (y0 + alto - 8) + ')"' : '') + '/>';
        bx += bw + (inclinado ? 8 : 1.5);
        if (U.probabilidad(rng, 0.08)) bx += 24;
      }
    }
    s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="none" stroke="' + c + '" stroke-width="10"/>';
    return s;
  }

  function planta(o) {
    const s0 = o.s || 1, x = o.x, y = o.y;
    const maceta = o.maceta || '#d8cfc2';
    let s = '<g transform="translate(' + x + ' ' + y + ') scale(' + s0 + ')">';
    const hoja = (d, c) => '<path d="' + d + '" fill="' + c + '"/>';
    if (o.tipo === 'cactus') {
      s += hoja('M-12 -10 C-14 -90 14 -90 12 -10 Z', '#4f8a5b') + hoja('M-12 -50 C-34 -52 -36 -80 -28 -80 C-22 -80 -22 -62 -12 -62 Z', '#5c9a67');
    } else if (o.tipo === 'alta') {
      for (let i = 0; i < 9; i++) {
        const a = -70 + i * 17, l = 150 + (i % 3) * 30;
        const ex = Math.sin(a * Math.PI / 180) * l, ey = -Math.cos(a * Math.PI / 180) * l;
        s += '<path d="M0 -10 Q' + (ex * 0.3) + ' ' + (ey * 0.6) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1) + ' Q' + (ex * 0.55 + 14) + ' ' + (ey * 0.5) + ' 4 -10 Z" fill="' + (i % 2 ? '#3f7d57' : '#4f9467') + '"/>';
      }
    } else {
      const hojas = [[-60, 90], [-30, 110], [0, 120], [30, 105], [60, 88], [-45, 70], [45, 70]];
      hojas.forEach(([a, l], i) => {
        const r = a * Math.PI / 180, ex = Math.sin(r) * l, ey = -Math.cos(r) * l;
        s += '<ellipse cx="' + (ex * 0.6).toFixed(1) + '" cy="' + (ey * 0.6 - 10).toFixed(1) + '" rx="' + (l * 0.32).toFixed(1) + '" ry="' + (l * 0.14).toFixed(1) + '" transform="rotate(' + (a - 90) + ' ' + (ex * 0.6).toFixed(1) + ' ' + (ey * 0.6 - 10).toFixed(1) + ')" fill="' + (i % 2 ? '#4a8a5f' : '#5fa070') + '"/>';
      });
    }
    s += '<path d="M-34 -12 L34 -12 L26 52 L-26 52 Z" fill="' + maceta + '"/><rect x="-38" y="-18" width="76" height="10" rx="4" fill="' + C().oscurecer(maceta, 0.08) + '"/>';
    s += '</g>';
    return s;
  }

  function cuadro(o) {
    const marco = o.marco || '#2a2f3a';
    let s = '<rect x="' + (o.x - 8) + '" y="' + (o.y - 8) + '" width="' + (o.w + 16) + '" height="' + (o.h + 16) + '" fill="' + marco + '"/>';
    s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="' + (o.fondo || '#efe8dc') + '"/>';
    if (o.arte === 'retrato') {
      s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="#4a3a2a"/>';
      s += '<circle cx="' + (o.x + o.w / 2) + '" cy="' + (o.y + o.h * 0.38) + '" r="' + (o.w * 0.2) + '" fill="#d9b48f"/>';
      s += '<path d="M' + (o.x + o.w * 0.18) + ' ' + (o.y + o.h) + ' Q' + (o.x + o.w / 2) + ' ' + (o.y + o.h * 0.52) + ' ' + (o.x + o.w * 0.82) + ' ' + (o.y + o.h) + ' Z" fill="#2b2420"/>';
      s += '<path d="M' + (o.x + o.w * 0.3) + ' ' + (o.y + o.h * 0.3) + ' Q' + (o.x + o.w / 2) + ' ' + (o.y + o.h * 0.1) + ' ' + (o.x + o.w * 0.7) + ' ' + (o.y + o.h * 0.3) + '" fill="#cfcfcf"/>';
    } else if (o.arte === 'paisaje') {
      s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h * 0.6 + '" fill="#bcd3e0"/>';
      s += '<path d="M' + o.x + ' ' + (o.y + o.h * 0.65) + ' L' + (o.x + o.w * 0.35) + ' ' + (o.y + o.h * 0.3) + ' L' + (o.x + o.w * 0.6) + ' ' + (o.y + o.h * 0.6) + ' L' + (o.x + o.w * 0.8) + ' ' + (o.y + o.h * 0.42) + ' L' + (o.x + o.w) + ' ' + (o.y + o.h * 0.65) + ' L' + (o.x + o.w) + ' ' + (o.y + o.h) + ' L' + o.x + ' ' + (o.y + o.h) + ' Z" fill="#6f8f73"/>';
    } else {
      const cs = o.colores || ['#f2b84b', '#3cc6b0', '#5b8cff', '#ff6b6b'];
      s += '<circle cx="' + (o.x + o.w * 0.35) + '" cy="' + (o.y + o.h * 0.45) + '" r="' + (Math.min(o.w, o.h) * 0.26) + '" fill="' + cs[0] + '"/>';
      s += '<rect x="' + (o.x + o.w * 0.45) + '" y="' + (o.y + o.h * 0.3) + '" width="' + (o.w * 0.4) + '" height="' + (o.h * 0.5) + '" fill="' + cs[1] + '" opacity=".85"/>';
      s += '<path d="M' + (o.x + o.w * 0.1) + ' ' + (o.y + o.h * 0.85) + ' L' + (o.x + o.w * 0.9) + ' ' + (o.y + o.h * 0.75) + '" stroke="' + cs[2] + '" stroke-width="6"/>';
    }
    return s;
  }

  function puerta(o) {
    const c = o.color || '#8a6a4f';
    let s = '<rect x="' + (o.x - 10) + '" y="' + (o.y - 10) + '" width="' + (o.w + 20) + '" height="' + (o.h + 10) + '" fill="' + C().oscurecer(c, 0.3) + '"/>';
    s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="#141a28"/>';
    s += '<g class="puerta-hoja" style="transform-origin:' + o.x + 'px ' + o.y + 'px">';
    s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="' + c + '"/>';
    s += '<rect x="' + (o.x + 16) + '" y="' + (o.y + 18) + '" width="' + (o.w - 32) + '" height="' + (o.h * 0.4) + '" fill="none" stroke="' + C().oscurecer(c, 0.15) + '" stroke-width="4"/>';
    s += '<rect x="' + (o.x + 16) + '" y="' + (o.y + o.h * 0.5) + '" width="' + (o.w - 32) + '" height="' + (o.h * 0.42) + '" fill="none" stroke="' + C().oscurecer(c, 0.15) + '" stroke-width="4"/>';
    s += '<circle cx="' + (o.x + o.w - 18) + '" cy="' + (o.y + o.h * 0.5) + '" r="6" fill="#d9c27a"/>';
    s += '</g>';
    return s;
  }

  function pizarraBlanca(o) {
    let s = '<rect x="' + (o.x - 8) + '" y="' + (o.y - 8) + '" width="' + (o.w + 16) + '" height="' + (o.h + 16) + '" rx="4" fill="#9aa3b2"/>';
    s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="#f6f7f9"/>';
    if (o.garabatos !== false) {
      s += '<path d="M' + (o.x + 30) + ' ' + (o.y + 50) + ' l60 0 M' + (o.x + 30) + ' ' + (o.y + 80) + ' l90 0 M' + (o.x + 30) + ' ' + (o.y + 110) + ' l40 0" stroke="#5b8cff" stroke-width="5" stroke-linecap="round" opacity=".6"/>';
      s += '<path d="M' + (o.x + o.w - 150) + ' ' + (o.y + o.h - 40) + ' l40 -40 l30 20 l50 -60" fill="none" stroke="#ff6b6b" stroke-width="5" stroke-linecap="round" opacity=".6"/>';
    }
    s += '<rect x="' + (o.x + o.w * 0.3) + '" y="' + (o.y + o.h + 8) + '" width="' + (o.w * 0.4) + '" height="10" rx="3" fill="#8b93a1"/>';
    return s;
  }

  /* Pantalla de pared con gráfico (tendencia: 'baja' | 'sube'). */
  function pantalla(o) {
    let s = '<rect x="' + (o.x - 10) + '" y="' + (o.y - 10) + '" width="' + (o.w + 20) + '" height="' + (o.h + 20) + '" rx="8" fill="#0e1220"/>';
    s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" fill="#18213a"/>';
    for (let i = 1; i < 4; i++) s += '<path d="M' + o.x + ' ' + (o.y + (o.h * i) / 4) + ' L' + (o.x + o.w) + ' ' + (o.y + (o.h * i) / 4) + '" stroke="#2b3757" stroke-width="2"/>';
    const pts = o.tendencia === 'baja' ? [0.25, 0.3, 0.28, 0.4, 0.52, 0.5, 0.7, 0.82] : [0.8, 0.7, 0.72, 0.55, 0.5, 0.42, 0.3, 0.2];
    const d = pts.map((v, i) => (i ? 'L' : 'M') + (o.x + 20 + (i * (o.w - 40)) / (pts.length - 1)).toFixed(1) + ' ' + (o.y + o.h * v).toFixed(1)).join(' ');
    s += '<path d="' + d + '" fill="none" stroke="' + (o.tendencia === 'baja' ? '#ff6b6b' : '#3cc6b0') + '" stroke-width="6" stroke-linejoin="round"/>';
    if (o.titulo) s += '<text x="' + (o.x + 20) + '" y="' + (o.y + 34) + '" fill="#c0c9dc" font-family="system-ui, sans-serif" font-size="22" font-weight="700">' + o.titulo + '</text>';
    return s;
  }

  function lampara(o) {
    const x = o.x, y = o.y, s0 = o.s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s0 + ')">' +
      '<ellipse cx="0" cy="0" rx="34" ry="8" fill="#6b5a2e"/><rect x="-4" y="-70" width="8" height="70" fill="#b39448"/>' +
      '<path d="M-62 -70 Q0 -110 62 -70 L56 -60 L-56 -60 Z" fill="#2f6b4c"/><ellipse cx="0" cy="-60" rx="56" ry="8" fill="#ffe7a3" opacity=".8"/>' +
      '<path d="M-56 -58 L-110 40 L110 40 L56 -58 Z" fill="#ffe7a3" opacity=".08"/></g>';
  }

  /* ---------- Mesa en perspectiva ---------- */
  function mesa(uid, o) {
    const t = o.tipo || 'madera';
    const colores = { madera: ['#7a5638', '#5e3f28'], oscura: ['#2a2f3d', '#1a1e29'], blanca: ['#e8e6e1', '#cfccc5'], clara: ['#c9a87f', '#a98a63'], cristal: ['#9fb4c8', '#7b93ab'] }[t];
    const id = uid + '-mesa';
    let s = '<defs>' + grad(id, [['0', colores[1]], ['1', colores[0]]]) + '</defs>';
    if (o.forma === 'redonda') {
      s += '<ellipse cx="800" cy="' + (o.y + 260) + '" rx="900" ry="300" fill="url(#' + id + ')"/>';
      s += '<ellipse cx="800" cy="' + (o.y + 260) + '" rx="900" ry="300" fill="none" stroke="' + C().aclarar(colores[0], 0.15) + '" stroke-width="4" opacity=".6"/>';
      return s;
    }
    const yb = o.y, x0 = o.x0 || 240, x1 = o.x1 || 1360;
    s += '<path d="M' + x0 + ' ' + yb + ' L' + x1 + ' ' + yb + ' L1760 920 L-160 920 Z" fill="url(#' + id + ')"/>';
    s += '<path d="M' + x0 + ' ' + yb + ' L' + x1 + ' ' + yb + '" stroke="' + C().aclarar(colores[0], 0.25) + '" stroke-width="3" opacity=".7"/>';
    if (t === 'madera' || t === 'clara') {
      for (let i = 1; i < 7; i++) {
        const xa = x0 + ((x1 - x0) * i) / 7, xb = -160 + (1920 * i) / 7;
        s += '<path d="M' + xa.toFixed(0) + ' ' + yb + ' L' + xb.toFixed(0) + ' 920" stroke="' + colores[1] + '" stroke-width="2" opacity=".35"/>';
      }
    }
    if (t === 'oscura' || t === 'cristal') s += '<path d="M' + (x0 + 120) + ' ' + (yb + 6) + ' L' + (x0 + 260) + ' ' + (yb + 6) + ' L' + (x0 + 40) + ' 920 L' + (x0 - 200) + ' 920 Z" fill="#fff" opacity=".05"/>';
    return s;
  }

  function silla(o) {
    const c = o.color || '#232a3a';
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s || 1) + ')">' +
      '<path d="M-122 0 C-128 -160 -110 -214 0 -222 C110 -214 128 -160 122 0 Z" fill="' + c + '"/>' +
      '<path d="M-100 -10 C-104 -150 -88 -196 0 -202 C88 -196 104 -150 100 -10 Z" fill="' + C().aclarar(c, 0.07) + '"/>' +
      '<path d="M-70 -192 C-30 -204 30 -204 70 -192" stroke="#fff" stroke-width="5" opacity=".1" fill="none"/></g>';
  }

  /* Reloj de mesa: la aguja marca la paciencia restante de la contraparte. */
  function relojMesa(o) {
    // Grupo exterior posiciona; el interior (.reloj-mesa) es el que anima CSS (origen = centro local)
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s || 1) + ')"><g class="reloj-mesa">' +
      '<g><rect x="-38" y="-46" width="76" height="80" rx="16" fill="#2b3245"/><rect x="-30" y="34" width="60" height="8" rx="3" fill="#1c2232"/>' +
      '<circle cx="0" cy="-6" r="28" fill="#f6f2e8"/><circle class="esfera-color" cx="0" cy="-6" r="28" fill="#3cc6b0" opacity=".18"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => { const a = i * 30 * Math.PI / 180; return '<line x1="' + (Math.sin(a) * 22).toFixed(1) + '" y1="' + (-6 - Math.cos(a) * 22).toFixed(1) + '" x2="' + (Math.sin(a) * 25).toFixed(1) + '" y2="' + (-6 - Math.cos(a) * 25).toFixed(1) + '" stroke="#8a90a0" stroke-width="2"/>'; }).join('') +
      '<g class="aguja" style="transform-origin:0px -6px"><line x1="0" y1="-6" x2="0" y2="-28" stroke="#e05656" stroke-width="3.5" stroke-linecap="round"/></g>' +
      '<line x1="0" y1="-6" x2="10" y2="-12" stroke="#2b3245" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-6" r="3.5" fill="#2b3245"/></g></g></g>';
  }

  function cafe(o) {
    const c = o.color || '#f4f1ea';
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s || 1) + ')">' +
      (o.vapor !== false ? '<g class="vapor" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M-8 -40 q-6 -10 0 -20 q6 -10 0 -20"/><path d="M4 -42 q-6 -10 0 -20 q6 -10 0 -20"/><path d="M14 -38 q-6 -10 0 -20 q6 -10 0 -20"/></g>' : '') +
      '<ellipse cx="0" cy="8" rx="38" ry="10" fill="' + C().oscurecer(c, 0.12) + '"/>' +
      '<path d="M-24 -34 L24 -34 L20 4 Q0 12 -20 4 Z" fill="' + c + '"/><path d="M24 -26 q18 2 12 16 q-4 8 -14 6" fill="none" stroke="' + c + '" stroke-width="6"/>' +
      '<ellipse cx="0" cy="-34" rx="24" ry="6" fill="#5a3a22"/></g>';
  }

  function portatil(o) {
    const c = o.color || '#b7bec9';
    if (!o.abierto) return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s || 1) + ')"><path d="M-110 0 L110 0 L96 -28 L-96 -28 Z" fill="' + c + '"/><path d="M-110 0 L110 0 L110 6 L-110 6 Z" fill="' + C().oscurecer(c, 0.25) + '"/><circle cx="0" cy="-14" r="6" fill="#fff" opacity=".4"/></g>';
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s || 1) + ')">' +
      '<path d="M-90 -130 L90 -130 L96 -6 L-96 -6 Z" fill="' + C().oscurecer(c, 0.35) + '"/><path d="M-82 -122 L82 -122 L88 -14 L-88 -14 Z" fill="#202b45"/>' +
      '<path d="M-60 -100 l70 0 M-60 -84 l110 0 M-60 -68 l50 0" stroke="#5b8cff" stroke-width="5" opacity=".5"/>' +
      '<path d="M-120 0 L120 0 L100 -12 L-100 -12 Z" fill="' + c + '"/></g>';
  }

  function carpeta(o) {
    const c = o.color || '#c9a24a';
    return '<g transform="translate(' + o.x + ' ' + o.y + ') rotate(' + (o.rot || 0) + ') scale(' + (o.s || 1) + ')">' +
      '<path d="M-90 0 L90 0 L78 -44 L-78 -44 Z" fill="' + C().oscurecer(c, 0.12) + '"/>' +
      '<path d="M-84 -4 L84 -4 L74 -40 L-74 -40 Z" fill="#f3f0e8"/><path d="M-60 -30 l90 0 M-62 -20 l110 0" stroke="#9aa0ad" stroke-width="3"/>' +
      '<path d="M-92 4 L92 4 L80 -36 L-80 -36 Z" fill="' + c + '" opacity=".95"/><path d="M-80 -36 L-40 -36 L-36 -44 L-74 -44 Z" fill="' + c + '"/></g>';
  }

  function documentos(o) {
    return '<g transform="translate(' + o.x + ' ' + o.y + ') rotate(' + (o.rot || -6) + ') scale(' + (o.s || 1) + ')">' +
      '<path d="M-70 0 L70 0 L62 -40 L-62 -40 Z" fill="#dcd8cf"/><path d="M-66 -6 L66 -6 L58 -46 L-58 -46 Z" fill="#f4f1ea"/>' +
      '<path d="M-44 -34 l70 0 M-46 -24 l84 0 M-48 -14 l60 0" stroke="#a3a9b5" stroke-width="3"/></g>';
  }

  function movil(o) {
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s || 1) + ')"><g class="movil-mesa">' +
      '<path d="M-26 0 L26 0 L22 -16 L-22 -16 Z" fill="#141924"/><path class="pantalla-movil" d="M-22 -2 L22 -2 L19 -14 L-19 -14 Z" fill="#5b8cff"/></g></g>';
  }

  function placa(o) {
    const ancho = Math.max(150, o.texto.length * 12 + 40);
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s || 1) + ')">' +
      '<path d="M' + (-ancho / 2) + ' 0 L' + (ancho / 2) + ' 0 L' + (ancho / 2 - 8) + ' -34 L' + (-ancho / 2 + 8) + ' -34 Z" fill="#20283b"/>' +
      '<text x="0" y="-11" text-anchor="middle" fill="#f2b84b" font-family="system-ui, sans-serif" font-weight="700" font-size="18" letter-spacing="1">' + o.texto + '</text></g>';
  }

  function cuaderno(o) {
    return '<g transform="translate(' + o.x + ' ' + o.y + ') rotate(' + (o.rot || 8) + ') scale(' + (o.s || 1) + ')">' +
      '<rect x="-150" y="-100" width="300" height="200" rx="10" fill="#26324f"/><rect x="-140" y="-92" width="282" height="186" rx="6" fill="#f5f2ea"/>' +
      [0, 1, 2, 3, 4, 5].map((i) => '<path d="M-120 ' + (-60 + i * 26) + ' l' + (i % 2 ? 180 : 220) + ' 0" stroke="#b9c2d3" stroke-width="3"/>').join('') +
      '<path d="M-118 -66 l90 0" stroke="#5b8cff" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="100" y="-120" width="16" height="230" rx="6" transform="rotate(22 108 0)" fill="#f2b84b"/><path d="M98 112 l10 18 l10 -18 Z" transform="rotate(22 108 0)" fill="#2b2b2b"/></g>';
  }

  function vaso(o) {
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s || 1) + ')">' +
      '<path d="M-22 -60 L22 -60 L18 0 L-18 0 Z" fill="#cfe3f5" opacity=".55"/><path d="M-20 -36 L20 -36 L18 0 L-18 0 Z" fill="#9fc9ee" opacity=".55"/>' +
      '<path d="M-14 -54 L-12 -8" stroke="#fff" stroke-width="3" opacity=".7"/></g>';
  }

  NG.Objetos = {
    grad, skyline, ventana, estanteria, planta, cuadro, puerta, pizarraBlanca, pantalla, lampara,
    mesa, silla, relojMesa, cafe, portatil, carpeta, documentos, movil, placa, cuaderno, vaso, CIELOS
  };
})(typeof window !== 'undefined' ? window : globalThis);
