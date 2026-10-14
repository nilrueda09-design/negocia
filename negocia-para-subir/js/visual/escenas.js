/* =====================================================================
 * NEGOCIA · visual/escenas.js
 * Escenas ilustradas por capas (fondo · escenario · primer plano) con
 * profundidad por parallax. viewBox 1600×900 (16:9).
 *
 * Capa "escenario": sillas → cuerpos de los personajes → mesa → objetos
 * → brazos/manos de los personajes → objetos delanteros. Cuerpo y brazos
 * comparten capa para moverse juntos con el parallax.
 *
 * NG.Escenas.montar(contenedor, id, opciones) devuelve un controlador
 * con acceso a avatares, reloj de paciencia, móvil, puerta y anclas para
 * los globos de diálogo.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const O = () => NG.Objetos;
  const C = () => NG.Avatar.color;
  let contador = 0;

  /* ---------- Paredes ---------- */
  function pared(uid, o) {
    const base = o.color || '#c9c3b8';
    let s = '<rect x="0" y="0" width="1600" height="' + (o.alto || 640) + '" fill="' + base + '"/>';
    if (o.patron === 'ladrillo') {
      s += '<defs><pattern id="' + uid + '-lad" width="120" height="56" patternUnits="userSpaceOnUse">' +
        '<rect width="120" height="56" fill="' + base + '"/>' +
        '<rect x="2" y="2" width="56" height="24" rx="2" fill="' + C().oscurecer(base, 0.06) + '"/><rect x="62" y="2" width="56" height="24" rx="2" fill="' + C().aclarar(base, 0.04) + '"/>' +
        '<rect x="-28" y="30" width="56" height="24" rx="2" fill="' + C().aclarar(base, 0.03) + '"/><rect x="32" y="30" width="56" height="24" rx="2" fill="' + C().oscurecer(base, 0.09) + '"/><rect x="92" y="30" width="56" height="24" rx="2" fill="' + C().oscurecer(base, 0.03) + '"/>' +
        '</pattern></defs><rect x="0" y="0" width="1600" height="' + (o.alto || 640) + '" fill="url(#' + uid + '-lad)"/>';
    } else if (o.patron === 'paneles') {
      s += '<defs><pattern id="' + uid + '-pan" width="160" height="640" patternUnits="userSpaceOnUse">' +
        '<rect width="160" height="640" fill="' + base + '"/><rect x="14" y="40" width="132" height="250" rx="4" fill="none" stroke="' + C().oscurecer(base, 0.18) + '" stroke-width="5"/>' +
        '<rect x="14" y="320" width="132" height="280" rx="4" fill="none" stroke="' + C().oscurecer(base, 0.18) + '" stroke-width="5"/><rect x="0" y="0" width="4" height="640" fill="' + C().oscurecer(base, 0.22) + '"/>' +
        '</pattern></defs><rect x="0" y="0" width="1600" height="' + (o.alto || 640) + '" fill="url(#' + uid + '-pan)"/>';
    } else if (o.patron === 'franjas') {
      for (let x = 0; x < 1600; x += 200) s += '<rect x="' + x + '" y="0" width="100" height="' + (o.alto || 640) + '" fill="' + C().aclarar(base, 0.03) + '"/>';
    }
    s += '<rect x="0" y="' + ((o.alto || 640) - 26) + '" width="1600" height="26" fill="' + C().oscurecer(base, 0.3) + '"/>';
    s += '<rect x="0" y="' + (o.alto || 640) + '" width="1600" height="' + (900 - (o.alto || 640)) + '" fill="' + (o.suelo || '#5d5148') + '"/>';
    return s;
  }
  /* Luz que entra por la ventana y halo cálido */
  function luz(uid, o) {
    return '<defs><linearGradient id="' + uid + '-luz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (o.color || '#fff6dc') + '" stop-opacity=".28"/><stop offset="1" stop-color="' + (o.color || '#fff6dc') + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="luz-ventana" d="M' + o.x0 + ' ' + o.y0 + ' L' + o.x1 + ' ' + o.y0 + ' L' + (o.x1 + o.abre) + ' 900 L' + (o.x0 - o.abre) + ' 900 Z" fill="url(#' + uid + '-luz)"/>';
  }
  function letrero(x, y, texto, color, fondo) {
    return '<g transform="translate(' + x + ' ' + y + ')"><rect x="' + (-texto.length * 9 - 26) + '" y="-30" width="' + (texto.length * 18 + 52) + '" height="56" rx="6" fill="' + (fondo || '#1f2636') + '"/>' +
      '<text x="0" y="8" text-anchor="middle" fill="' + (color || '#e9e6df') + '" font-family="system-ui, sans-serif" font-weight="800" font-size="24" letter-spacing="4">' + texto + '</text></g>';
  }

  /* ---------- Definición de escenas ---------- */
  const DEF = {
    'despacho': {
      nombre: 'Tu despacho',
      descripcion: 'Tu despacho: escritorio con carpetas de investigación, un tablón de corcho y una ventana a la ciudad.',
      personajes: [],
      fondo(uid) {
        return pared(uid, { color: '#3d4a63', patron: 'franjas', suelo: '#2a2f3d' }) +
          O().ventana(uid + 'v', { x: 1080, y: 90, w: 400, h: 400, hora: 'atardecer', columnas: 2, filas: 2, marco: '#cfd5df', semilla: 4 }) +
          luz(uid, { x0: 1090, x1: 1470, y0: 490, abre: 160, color: '#ffd9a8' }) +
          // Tablón de corcho (los datos descubiertos se "clavan" aquí desde la UI)
          '<rect x="150" y="70" width="820" height="440" rx="10" fill="#6b4a2f"/><rect x="166" y="86" width="788" height="408" rx="4" fill="#c79a63"/>' +
          '<rect x="166" y="86" width="788" height="408" fill="url(#' + uid + '-corcho)"/><defs><pattern id="' + uid + '-corcho" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r="1.4" fill="#a87d4c"/><circle cx="12" cy="11" r="1.2" fill="#d8ae78"/></pattern></defs>' +
          O().estanteria({ x: 1500, y: 60, w: 110, h: 560, baldas: 5, color: '#5a4636', semilla: 9 }) +
          O().planta({ x: 1020, y: 600, s: 0.9, tipo: 'alta', maceta: '#e7e2d8' });
      },
      escenario(uid) {
        return '<path d="M-40 640 L1640 640 L1700 920 L-100 920 Z" fill="#5a4231"/><path d="M-40 640 L1640 640" stroke="#7d5c44" stroke-width="5"/>' +
          O().lampara({ x: 1320, y: 690, s: 1.3 }) +
          O().portatil({ x: 820, y: 760, s: 1.6, abierto: true, color: '#c3c9d3' }) +
          O().cafe({ x: 1120, y: 800, s: 1.3 });
      },
      frente(uid) { return O().cuaderno({ x: 330, y: 860, s: 1.2, rot: -6 }); }
    },

    'sala-proveedor': {
      nombre: 'Sala de reuniones de Aceros Levante',
      descripcion: 'Sala de reuniones de una acería: pared de ladrillo, ventanal con vista a la nave y muestras de bobinas de acero.',
      personajes: [{ x: 800, mesaY: 600, escala: 0.95 }],
      mesaY: 600,
      fondo(uid) {
        return pared(uid, { color: '#a5674e', patron: 'ladrillo', suelo: '#4b4038' }) +
          O().ventana(uid + 'v', { x: 470, y: 70, w: 660, h: 410, hora: 'dia', vista: 'fabrica', columnas: 4, filas: 2, marco: '#3a4352', grosor: 14 }) +
          luz(uid, { x0: 480, x1: 1120, y0: 480, abre: 140 }) +
          letrero(800, 30 + 18, 'ACEROS LEVANTE', '#f2b84b', '#262b38') +
          // Estantería con muestras de bobinas
          '<rect x="80" y="160" width="280" height="420" fill="#3a3f4b"/>' + [0, 1, 2].map((i) => '<rect x="80" y="' + (290 + i * 130) + '" width="280" height="10" fill="#575e6e"/>' +
            [0, 1, 2].map((j) => '<circle cx="' + (130 + j * 90) + '" cy="' + (255 + i * 130) + '" r="32" fill="#9ea7b3"/><circle cx="' + (130 + j * 90) + '" cy="' + (255 + i * 130) + '" r="12" fill="#5d6574"/>').join('')).join('') +
          O().cuadro({ x: 1250, y: 150, w: 210, h: 150, arte: 'abstracto', colores: ['#f2b84b', '#5d6574', '#a5674e'] }) +
          O().planta({ x: 1400, y: 610, s: 1.1 });
      },
      mesa(uid) { return O().mesa(uid, { y: 600, tipo: 'madera' }); },
      objetos(uid, ctx) {
        return O().portatil({ x: 1130, y: 650, s: 0.9, color: '#9aa2ae' }) + O().documentos({ x: 520, y: 668, s: 1.05 }) +
          O().relojMesa({ x: 330, y: 700, s: 1.1 }) + O().movil({ x: 1010, y: 640, s: 1 });
      },
      delante(uid, ctx) {
        return O().cafe({ x: 1240, y: 690, s: 1 }) + O().placa({ x: 800, y: 700, texto: ctx.nombres[0] || '' });
      },
      frente(uid) { return O().cuaderno({ x: 360, y: 880, s: 1.15, rot: 6 }) + O().cafe({ x: 1400, y: 880, s: 1.6, vapor: false, color: '#2b3a5c' }); },
      puerta: null
    },

    'oficina-rrhh': {
      nombre: 'Despacho de Personas',
      descripcion: 'Despacho luminoso con mamparas de cristal, plantas y una mesa de madera clara.',
      personajes: [{ x: 800, mesaY: 610, escala: 0.95 }],
      fondo(uid) {
        return pared(uid, { color: '#d9dee3', suelo: '#8c8478' }) +
          // Mampara de cristal con banda esmerilada y oficina detrás
          '<rect x="0" y="40" width="1600" height="560" fill="#b9c7d2" opacity=".55"/>' +
          [0, 1, 2, 3, 4].map((i) => '<rect x="' + (40 + i * 320) + '" y="40" width="10" height="560" fill="#8796a6"/>').join('') +
          '<rect x="0" y="250" width="1600" height="60" fill="#fff" opacity=".45"/>' +
          '<rect x="120" y="330" width="220" height="140" fill="#9eb0c0" opacity=".6"/><rect x="1260" y="330" width="220" height="140" fill="#9eb0c0" opacity=".6"/>' +
          O().ventana(uid + 'v', { x: 560, y: 80, w: 480, h: 380, hora: 'dia', vista: 'arboles', columnas: 3, marco: '#f4f4f2' }) +
          luz(uid, { x0: 570, x1: 1030, y0: 460, abre: 120 }) +
          O().cuadro({ x: 210, y: 110, w: 160, h: 120, arte: 'abstracto', colores: ['#3cc6b0', '#f2b84b', '#5b8cff'] }) +
          O().planta({ x: 260, y: 610, s: 1.2, tipo: 'alta' }) + O().planta({ x: 1360, y: 610, s: 1.0 });
      },
      mesa(uid) { return O().mesa(uid, { y: 610, tipo: 'clara' }); },
      objetos(uid) { return O().portatil({ x: 520, y: 680, s: 0.95, abierto: false, color: '#d6dbe2' }) + O().relojMesa({ x: 330, y: 710, s: 1.1 }) + O().movil({ x: 1050, y: 650, s: 1 }) + O().vaso({ x: 1160, y: 680, s: 1 }); },
      delante(uid, ctx) { return O().placa({ x: 800, y: 712, texto: ctx.nombres[0] || '' }) + O().cafe({ x: 1260, y: 700, s: 1, color: '#f2b84b' }); },
      frente(uid) { return O().cuaderno({ x: 360, y: 880, s: 1.15, rot: 6 }); }
    },

    'sala-juntas': {
      nombre: 'Sala de juntas del cliente',
      descripcion: 'Sala de juntas en un piso alto al atardecer, mesa oscura y una pantalla con un gráfico en caída.',
      personajes: [{ x: 800, mesaY: 600, escala: 0.95 }],
      fondo(uid) {
        return pared(uid, { color: '#2b2f40', suelo: '#1c1f2b' }) +
          O().ventana(uid + 'v', { x: 40, y: 40, w: 1520, h: 520, hora: 'atardecer', columnas: 6, marco: '#1a1d29', grosor: 10, semilla: 21 }) +
          luz(uid, { x0: 300, x1: 1300, y0: 560, abre: 200, color: '#ffbf7a' }) +
          O().pantalla({ x: 1180, y: 120, w: 320, h: 190, tendencia: 'baja', titulo: 'Incidencias Q3' });
      },
      mesa(uid) { return O().mesa(uid, { y: 600, tipo: 'oscura' }); },
      objetos(uid) { return O().documentos({ x: 540, y: 668, s: 1.05, rot: -3 }) + O().relojMesa({ x: 330, y: 700, s: 1.1 }) + O().movil({ x: 1020, y: 640, s: 1 }) + O().vaso({ x: 1150, y: 670, s: 1 }); },
      delante(uid, ctx) { return O().placa({ x: 800, y: 700, texto: ctx.nombres[0] || '' }); },
      frente(uid) { return O().cuaderno({ x: 360, y: 880, s: 1.15, rot: 6 }) + O().vaso({ x: 1380, y: 900, s: 1.8 }); }
    },

    'sala-adquisicion': {
      nombre: 'Biblioteca de Conservas Ferrán',
      descripcion: 'Sala con paneles de madera, librerías antiguas, el retrato del fundador y una lámpara verde de banquero.',
      personajes: [{ x: 800, mesaY: 600, escala: 0.95 }],
      fondo(uid) {
        return pared(uid, { color: '#6b4a34', patron: 'paneles', suelo: '#3a2a20' }) +
          O().estanteria({ x: 60, y: 60, w: 380, h: 540, baldas: 5, color: '#4a3324', semilla: 31, colores: ['#7a2e2e', '#2f4a3a', '#8a6a3a', '#3a3a5a', '#5a2a3a', '#c4b28a'] }) +
          O().estanteria({ x: 1160, y: 60, w: 380, h: 540, baldas: 5, color: '#4a3324', semilla: 37, colores: ['#7a2e2e', '#2f4a3a', '#8a6a3a', '#3a3a5a', '#5a2a3a', '#c4b28a'] }) +
          O().cuadro({ x: 478, y: 96, w: 170, h: 214, arte: 'retrato', marco: '#b08d4a' }) +
          '<text x="563" y="340" text-anchor="middle" fill="#d9c08a" font-family="Georgia, serif" font-size="16" font-style="italic">J. Ferrán · 1952</text>' +
          O().cuadro({ x: 952, y: 120, w: 170, h: 124, arte: 'paisaje', marco: '#b08d4a' });
      },
      mesa(uid) { return O().mesa(uid, { y: 600, tipo: 'madera' }); },
      objetos(uid) { return O().lampara({ x: 470, y: 680, s: 1.1 }) + O().relojMesa({ x: 300, y: 720, s: 1.1 }) + O().documentos({ x: 1100, y: 670, s: 1.1, rot: 4 }) + O().movil({ x: 1000, y: 640, s: 1 }); },
      delante(uid, ctx) { return O().placa({ x: 800, y: 700, texto: ctx.nombres[0] || '' }) + O().cafe({ x: 1250, y: 700, s: 1, color: '#f4f1ea' }); },
      frente(uid) { return O().carpeta({ x: 380, y: 880, s: 1.6, rot: 4, color: '#8a2f3c' }); }
    },

    'mesa-multiparte': {
      nombre: 'Sala de mediación',
      descripcion: 'Sala de mediación con mesa ovalada: la representante sindical a la izquierda, el inversor a la derecha y la mediadora en la cabecera.',
      personajes: [{ x: 800, mesaY: 560, escala: 0.72 }, { x: 470, mesaY: 640, escala: 0.92 }, { x: 1130, mesaY: 640, escala: 0.92 }],
      fondo(uid) {
        return pared(uid, { color: '#3b4c66', suelo: '#283246' }) +
          O().ventana(uid + 'v', { x: 80, y: 80, w: 340, h: 380, hora: 'nublado', columnas: 2, marco: '#d9dde4', semilla: 33 }) +
          O().ventana(uid + 'v2', { x: 1180, y: 80, w: 340, h: 380, hora: 'nublado', columnas: 2, marco: '#d9dde4', semilla: 44 }) +
          O().pizarraBlanca({ x: 560, y: 70, w: 480, h: 250, garabatos: false }) +
          '<text x="800" y="128" text-anchor="middle" fill="#3b4c66" font-family="system-ui, sans-serif" font-weight="800" font-size="34" letter-spacing="3">PLAN HORIZONTE</text>' +
          '<path d="M620 170 l140 0 M620 200 l200 0 M620 230 l110 0" stroke="#5b8cff" stroke-width="6" stroke-linecap="round" opacity=".55"/>' +
          '<path d="M860 260 l40 -36 l34 18 l60 -62" fill="none" stroke="#3cc6b0" stroke-width="6" stroke-linecap="round" opacity=".7"/>';
      },
      mesa(uid) {
        return '<ellipse cx="800" cy="840" rx="760" ry="290" fill="#6f5b48"/><ellipse cx="800" cy="830" rx="740" ry="276" fill="#8a7158"/><ellipse cx="800" cy="830" rx="740" ry="276" fill="none" stroke="#a88c6e" stroke-width="3" opacity=".6"/>';
      },
      objetos(uid) { return O().relojMesa({ x: 800, y: 700, s: 1.1 }) + O().documentos({ x: 640, y: 640, s: 0.8 }) + O().vaso({ x: 960, y: 640, s: 0.9 }) + O().movil({ x: 1240, y: 760, s: 1 }); },
      delante(uid, ctx) {
        return O().placa({ x: 470, y: 790, texto: ctx.nombres[1] || '', s: 0.95 }) + O().placa({ x: 1130, y: 790, texto: ctx.nombres[2] || '', s: 0.95 }) +
          '<path class="arco-coalicion" d="M560 380 Q800 300 1040 380" fill="none" stroke="#ff6b6b" stroke-width="6" stroke-linecap="round"/>';
      },
      frente(uid) { return O().cuaderno({ x: 800, y: 900, s: 1.1, rot: 2 }); }
    }
  };
  // Alias para escenarios futuros que quieran reutilizar una sala genérica
  DEF['sala-reuniones'] = DEF['sala-proveedor'];

  /* Transformación de un hueco de personaje: alinea la línea de mesa del avatar (y≈470) con la de la escena. */
  function transformacionSlot(pj) {
    const s = pj.escala || 1;
    return { s, tx: pj.x - 200 * s, ty: pj.mesaY - 470 * s };
  }

  /* ---------- Composición ---------- */
  function svgEscena(id, opciones) {
    const def = DEF[id];
    if (!def) throw new Error('Escena desconocida: ' + id);
    const uid = 'esc' + (++contador);
    const ctx = { nombres: (opciones.personajes || []).map((p) => (p && p.nombre ? p.nombre : '')), uid };
    const avs = (opciones.personajes || []).map((p, i) => (p ? NG.Avatar.svg(p.avatar, p.id || 'p' + i) : null));
    const huecos = def.personajes.map((pj, i) => {
      const t = transformacionSlot(pj);
      const tr = 'translate(' + t.tx.toFixed(1) + ' ' + t.ty.toFixed(1) + ') scale(' + t.s + ')';
      return {
        silla: O().silla({ x: pj.x, y: pj.mesaY - 10 * t.s, s: t.s * 1.32, color: opciones.colorSilla || '#232a3a' }),
        sombra: '<ellipse cx="' + pj.x + '" cy="' + (pj.mesaY + 26 * t.s) + '" rx="' + (150 * t.s) + '" ry="' + (16 * t.s) + '" fill="#000" opacity=".22"/>',
        cuerpo: '<g class="hueco hueco-cuerpo" data-hueco="' + i + '" transform="' + tr + '">' + (avs[i] ? avs[i].cuerpo : '') + '</g>',
        delante: '<g class="hueco hueco-delante" data-hueco="' + i + '" transform="' + tr + '">' + (avs[i] ? avs[i].delante : '') + '</g>'
      };
    });
    const ocupados = huecos.filter((h, i) => avs[i]);
    const svg = '<svg class="escena-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (def.descripcion || def.nombre) + '">' +
      '<g class="capa capa-fondo" data-parallax="0.25">' + def.fondo(uid, ctx) + '</g>' +
      '<g class="capa capa-medio" data-parallax="0.55">' +
      ocupados.map((h) => h.silla).join('') + huecos.map((h) => h.cuerpo).join('') +
      (def.mesa ? def.mesa(uid, ctx) : '') + (def.escenario ? def.escenario(uid, ctx) : '') + ocupados.map((h) => h.sombra).join('') + (def.objetos ? def.objetos(uid, ctx) : '') +
      huecos.map((h) => h.delante).join('') + (def.delante ? def.delante(uid, ctx) : '') +
      '</g>' +
      '<g class="capa capa-frente" data-parallax="1.2">' + (def.frente ? def.frente(uid, ctx) : '') + '</g>' +
      '</svg>';
    return { svg, def, avs };
  }

  /* Monta la escena en un contenedor y devuelve su controlador. */
  function montar(contenedor, id, opciones) {
    opciones = opciones || {};
    const { svg, def, avs } = svgEscena(id, opciones);
    const el = document.createElement('div');
    el.className = 'escena' + (opciones.entrada !== false ? ' entrando' : '');
    el.setAttribute('data-escena', id);
    el.innerHTML = svg + '<div class="escena-vineta"></div><div class="escena-hud"></div>';
    contenedor.appendChild(el);
    const raizSvg = el.querySelector('svg');
    const hud = el.querySelector('.escena-hud');
    const avatares = {};
    (opciones.personajes || []).forEach((p, i) => {
      if (!p) return;
      const idp = p.id || 'p' + i;
      avatares[idp] = {
        indice: i, params: avs[i].params,
        nodos: [el.querySelector('.hueco-cuerpo[data-hueco="' + i + '"] .avatar'), el.querySelector('.hueco-delante[data-hueco="' + i + '"] .avatar')]
      };
    });
    // Entrada tipo cámara
    if (opciones.entrada !== false) {
      const quitar = () => el.classList.remove('entrando');
      requestAnimationFrame(() => requestAnimationFrame(quitar));
      setTimeout(quitar, 120);
    }

    // Parallax con el puntero (solo escritorio y sin movimiento reducido)
    const capas = Array.from(el.querySelectorAll('.capa'));
    let rafId = 0, objetivo = [0, 0];
    const movimientoReducido = () => document.body.classList.contains('sin-movimiento') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function alMover(ev) {
      if (movimientoReducido()) return;
      const r = el.getBoundingClientRect();
      objetivo = [((ev.clientX - r.left) / r.width - 0.5) * 2, ((ev.clientY - r.top) / r.height - 0.5) * 2];
      if (!rafId) rafId = requestAnimationFrame(aplicarParallax);
    }
    function aplicarParallax() {
      rafId = 0;
      capas.forEach((c) => {
        const f = parseFloat(c.getAttribute('data-parallax')) || 0;
        c.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)';
        c.style.transform = 'translate(' + (-objetivo[0] * 14 * f).toFixed(2) + 'px,' + (-objetivo[1] * 6 * f).toFixed(2) + 'px)';
      });
    }
    if (opciones.parallax !== false && window.matchMedia && window.matchMedia('(pointer: fine)').matches) el.addEventListener('pointermove', alMover);

    const reloj = el.querySelector('.reloj-mesa');
    const ctrl = {
      el, svg: raizSvg, hud, def, avatares,
      /* Posición (en % del contenedor) sobre la cabeza de un personaje, para globos y números flotantes. */
      ancla(idPersonaje) {
        const a = avatares[idPersonaje];
        const pj = a ? def.personajes[a.indice] : { x: 800, mesaY: 600, escala: 1 };
        const t = transformacionSlot(pj);
        const x = pj.x, yCabeza = t.ty + 70 * t.s;
        // La escena usa "slice": calculamos el recorte real según la proporción del contenedor
        const r = el.getBoundingClientRect();
        const escala = Math.max(r.width / 1600, r.height / 900) || 1;
        const offX = (r.width - 1600 * escala) / 2, offY = (r.height - 900 * escala) / 2;
        return { x: ((x * escala + offX) / (r.width || 1)) * 100, y: ((yCabeza * escala + offY) / (r.height || 1)) * 100, lado: x > 900 ? 'izquierda' : 'derecha' };
      },
      estado(idPersonaje, estadoVisual) {
        const a = avatares[idPersonaje];
        if (!a) return;
        let mirada = estadoVisual.mirada;
        if (mirada && mirada.indexOf('hacia:') === 0) {
          const otro = avatares[mirada.slice(6)];
          mirada = otro ? (def.personajes[otro.indice].x < def.personajes[a.indice].x ? 'izquierda' : 'derecha') : 'jugador';
        }
        NG.Avatar.aplicarEstado(a.nodos, Object.assign({}, estadoVisual, { mirada }));
        if (estadoVisual.gesto) NG.Avatar.gesto(a.nodos, estadoVisual.gesto);
      },
      reloj(paciencia, maximo) {
        if (!reloj) return;
        const r = NG.EstadoVisual.reloj(paciencia, maximo);
        reloj.querySelector('.aguja').style.transform = 'rotate(' + r.angulo + 'deg)';
        reloj.querySelector('.esfera-color').setAttribute('fill', r.color);
        reloj.classList.toggle('urgente', r.urgente);
      },
      vibrarMovil() {
        const m = el.querySelector('.movil-mesa');
        if (!m) return;
        m.classList.remove('vibrando'); void m.getBoundingClientRect(); m.classList.add('vibrando');
        setTimeout(() => m.classList.remove('vibrando'), 1500);
      },
      coalicion(visible) { const a = el.querySelector('.arco-coalicion'); if (a) a.classList.toggle('visible', !!visible); },
      oscurecer(si) { el.classList.toggle('oscurecida', si !== false); },
      destruir() { el.removeEventListener('pointermove', alMover); if (rafId) cancelAnimationFrame(rafId); el.remove(); }
    };
    return ctrl;
  }

  /* ---------- Fondo del menú principal: ciudad nocturna con parallax ---------- */
  function fondoMenu() {
    const O_ = O();
    return '<svg class="fondo-menu-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' + O_.grad('menu-cielo', [['0', '#070b19'], ['.55', '#141d3d'], ['1', '#2a2350']]) +
      '<radialGradient id="menu-luna" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4d6"/><stop offset=".6" stop-color="#ffe3a3" stop-opacity=".4"/><stop offset="1" stop-color="#ffe3a3" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#menu-cielo)"/>' +
      '<circle cx="1260" cy="190" r="120" fill="url(#menu-luna)"/><circle cx="1260" cy="190" r="44" fill="#fff1cc"/>' +
      Array.from({ length: 70 }, (_, i) => '<circle cx="' + ((i * 397) % 1600) + '" cy="' + ((i * 131) % 420) + '" r="' + (i % 3 ? 1.2 : 1.8) + '" fill="#fff" opacity="' + (0.3 + (i % 5) * 0.12).toFixed(2) + '"/>').join('') +
      '<g class="capa-menu" data-p="0.2">' + O_.skyline(-40, 360, 1700, 420, { semilla: 3, luces: 0.18, colorLuz: '#8fa8ff', capas: [{ color: '#1a2147', alto: 0.7, ancho: [50, 100] }] }) + '</g>' +
      '<g class="capa-menu" data-p="0.45">' + O_.skyline(-40, 420, 1700, 480, { semilla: 8, luces: 0.25, colorLuz: '#ffd98a', capas: [{ color: '#121735', alto: 0.85, ancho: [60, 130] }] }) + '</g>' +
      '<g class="capa-menu" data-p="0.8">' + O_.skyline(-40, 560, 1700, 340, { semilla: 15, luces: 0.32, colorLuz: '#ffc96b', capas: [{ color: '#0a0e22', alto: 1, ancho: [80, 160] }] }) + '</g>' +
      '</svg>';
  }

  NG.Escenas = { DEF, montar, svgEscena, fondoMenu, transformacionSlot };
})(typeof window !== 'undefined' ? window : globalThis);
