/* =====================================================================
 * NEGOCIA · visual/avatar.js
 * Generador paramétrico de personajes en SVG (estilo flat vectorial).
 *
 * Sistema de coordenadas local del avatar: 400 × 540 (persona sentada,
 * de cintura para arriba). La cara está centrada en (200, 160) y la
 * superficie de la mesa empieza hacia y ≈ 470.
 *
 * Cada avatar se dibuja en DOS capas que comparten coordenadas:
 *   · cuerpo  → detrás de la mesa (torso, cabeza, pelo…)
 *   · brazos  → delante de la mesa (antebrazos y manos apoyadas)
 * El estado (expresión, postura, mirada) se aplica con atributos
 * data-* y el CSS hace las transiciones: el SVG se genera UNA vez.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  /* ---------- Color ---------- */
  function hexARgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mezclar(a, b, t) {
    const x = hexARgb(a), y = hexARgb(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  const oscurecer = (c, t) => mezclar(c, '#000000', t);
  const aclarar = (c, t) => mezclar(c, '#ffffff', t);

  const PIELES = ['#f7dcc8', '#f0c8a6', '#e2ad86', '#c98d63', '#a66b45', '#7f4d30', '#5b3622'];
  const PELOS = { negro: '#1f1a17', castanoOscuro: '#3a281d', castano: '#6a4528', cobrizo: '#8c3d1f', rubio: '#c8a05a', gris: '#9b9b9b', blanco: '#dedede' };
  const ESTILOS = ['corto', 'ondulado', 'calvo', 'rapado', 'largo', 'melena', 'mono', 'coleta', 'rizado', 'afro'];
  const ROPAS = ['traje', 'blazer', 'jersey', 'camisa', 'blusa', 'cuelloAlto'];
  const COLORES_ROPA = ['#2f3e5c', '#3a4d6e', '#5a2f3c', '#2e4a43', '#4b4f58', '#6b4b2e', '#26324a', '#7a3b52', '#33546b'];

  /* Parámetros completos a partir de una semilla + lo que se especifique. */
  function normalizar(param) {
    param = Object.assign({}, param || {});
    const rng = NG.Util.crearRng((param.semilla || 1) * 9301 + 49297);
    const el = (l) => NG.Util.elegir(rng, l);
    const g = param.genero || el(['h', 'm']);
    const p = {
      genero: g,
      edad: param.edad || NG.Util.entero(rng, 28, 62),
      cara: param.cara || el(['ovalada', 'redonda', 'cuadrada', 'alargada']),
      piel: typeof param.piel === 'number' ? PIELES[param.piel] : (param.piel || el(PIELES)),
      pelo: param.pelo || (g === 'm' ? el(['largo', 'melena', 'mono', 'coleta', 'rizado', 'ondulado']) : el(['corto', 'ondulado', 'calvo', 'rapado', 'rizado'])),
      colorPelo: param.colorPelo || el([PELOS.negro, PELOS.castanoOscuro, PELOS.castano, PELOS.cobrizo, PELOS.rubio]),
      canas: typeof param.canas === 'number' ? param.canas : 0,
      gafas: param.gafas === undefined ? el([null, null, 'redondas', 'cuadradas', 'finas']) : param.gafas,
      barba: param.barba === undefined ? (g === 'h' ? el([null, null, 'barba', 'perilla', 'bigote', 'sombra']) : null) : param.barba,
      ropa: param.ropa || el(ROPAS),
      colorRopa: param.colorRopa || el(COLORES_ROPA),
      colorCamisa: param.colorCamisa || el(['#eef2f7', '#dfe9f5', '#f4ece0', '#e9e4f2']),
      corbata: param.corbata === undefined ? null : param.corbata,
      panuelo: param.panuelo || null,
      pendientes: param.pendientes === undefined ? (g === 'm' ? el([null, 'oro', 'perla', 'aro']) : null) : param.pendientes,
      colorOjos: param.colorOjos || el(['#4a3222', '#3b2a1d', '#2f4a5e', '#3d5a3a', '#5a4630']),
      cejas: param.cejas || (g === 'h' ? 5.5 : 4.2),
      pintalabios: param.pintalabios || null,
      reloj: param.reloj || '#c9b37e'
    };
    if (p.canas > 0) p.colorPelo = mezclar(p.colorPelo, '#c7c7c7', p.canas);
    return p;
  }

  /* ---------- Piezas: cara ---------- */
  const CARAS = {
    ovalada: 'M144 150 C144 102 170 84 200 84 C230 84 256 102 256 150 C256 196 236 232 200 237 C164 232 144 196 144 150 Z',
    redonda: 'M140 152 C140 104 168 86 200 86 C232 86 260 104 260 152 C260 200 236 230 200 233 C164 230 140 200 140 152 Z',
    cuadrada: 'M142 146 C142 100 168 84 200 84 C232 84 258 100 258 146 L257 182 C255 214 232 234 200 237 C168 234 145 214 143 182 Z',
    alargada: 'M146 150 C146 98 170 80 200 80 C230 80 254 98 254 150 C254 202 234 240 200 245 C166 240 146 202 146 150 Z'
  };

  function pelo(p, capa) {
    const c = p.colorPelo, osc = oscurecer(c, 0.25);
    const f = (d, extra) => '<path d="' + d + '" fill="' + c + '"' + (extra || '') + '/>';
    const linea = (d) => '<path d="' + d + '" fill="none" stroke="' + osc + '" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>';
    const est = p.pelo;
    if (capa === 'atras') {
      switch (est) {
        case 'largo': return f('M136 150 C128 92 162 60 200 60 C240 60 274 92 266 150 C270 210 278 262 284 304 C262 318 240 312 228 296 L172 296 C160 312 138 318 116 304 C122 262 130 210 136 150 Z');
        case 'melena': return f('M134 150 C128 92 162 62 200 62 C238 62 272 92 266 150 L269 232 C256 248 238 242 233 228 L167 228 C162 242 144 248 131 232 Z');
        case 'coleta': return f('M246 98 C298 108 304 186 282 258 C272 228 268 188 254 146 Z') + linea('M262 130 C276 170 278 206 276 236');
        case 'mono': return '<circle cx="200" cy="64" r="28" fill="' + c + '"/>' + linea('M180 56 C192 46 210 46 222 58');
        case 'rizado': return '<ellipse cx="200" cy="116" rx="80" ry="58" fill="' + c + '"/>';
        case 'afro': return '<ellipse cx="200" cy="114" rx="98" ry="86" fill="' + c + '"/><ellipse cx="200" cy="114" rx="98" ry="86" fill="#000" opacity=".08"/>';
        default: return '';
      }
    }
    // Capa delantera
    switch (est) {
      case 'corto': return f('M142 150 C134 96 164 66 204 66 C246 66 270 98 260 150 C256 126 248 110 236 102 C222 112 190 112 166 102 C154 112 146 128 142 150 Z') + linea('M206 72 C196 86 184 96 168 104');
      case 'ondulado': return f('M140 156 C130 96 164 64 204 64 C248 64 272 100 262 156 C258 136 252 122 244 114 C236 124 226 124 220 114 C210 126 196 126 188 114 C178 124 164 124 158 114 C150 124 144 138 140 156 Z');
      case 'calvo': return f('M140 170 C136 146 140 128 149 116 C153 132 155 150 154 164 Z') + f('M260 170 C264 146 260 128 251 116 C247 132 245 150 246 164 Z') +
        '<ellipse cx="184" cy="104" rx="20" ry="9" fill="#fff" opacity=".13"/>';
      case 'rapado': return f('M144 142 C142 98 168 76 200 76 C232 76 258 98 256 142 C250 116 230 100 200 99 C170 100 150 116 144 142 Z', ' opacity=".92"');
      case 'largo': return f('M200 68 C160 68 136 98 137 172 C144 130 168 104 200 92 C232 104 256 130 263 172 C264 98 240 68 200 68 Z') + linea('M200 72 C198 84 199 90 200 94');
      case 'melena': return f('M138 152 C134 94 166 68 200 68 C234 68 266 94 262 152 C254 120 236 106 216 108 C204 102 186 102 172 110 C156 116 144 130 138 152 Z') + linea('M216 108 C224 116 230 126 234 140');
      case 'mono':
      case 'coleta': return f('M140 152 C136 98 166 72 200 72 C234 72 264 98 260 152 C252 120 230 100 200 98 C170 100 148 120 140 152 Z') + linea('M200 74 C188 82 176 92 168 104') + linea('M200 74 C214 82 226 92 234 104');
      case 'rizado': {
        const cs = [[150, 122, 24], [164, 96, 25], [188, 80, 26], [214, 80, 26], [238, 96, 25], [252, 122, 24], [143, 150, 17], [257, 150, 17]];
        return cs.map(([x, y, r]) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>').join('') +
          cs.slice(0, 6).map(([x, y, r]) => '<path d="M' + (x - r * 0.5) + ' ' + (y + r * 0.2) + ' q' + r * 0.5 + ' ' + -r * 0.5 + ' ' + r + ' 0" fill="none" stroke="' + osc + '" stroke-width="2" opacity=".45"/>').join('');
      }
      case 'afro': return f('M146 142 C150 108 172 92 200 92 C228 92 250 108 254 142 C244 124 224 114 200 114 C176 114 156 124 146 142 Z');
      default: return '';
    }
  }

  function barba(p) {
    const c = oscurecer(p.colorPelo, 0.12);
    const bigote = '<path d="M180 197 C188 190 196 191 200 195 C204 191 212 190 220 197 C212 202 206 202 200 199 C194 202 188 202 180 197 Z" fill="' + c + '"/>';
    switch (p.barba) {
      case 'barba': return '<path d="M145 168 C147 222 172 250 200 252 C228 250 253 222 255 168 C249 196 236 213 221 217 C213 209 187 209 179 217 C164 213 151 196 145 168 Z" fill="' + c + '"/>' + bigote;
      case 'perilla': return '<path d="M183 214 C185 238 215 238 217 214 C210 223 190 223 183 214 Z" fill="' + c + '"/>' + bigote;
      case 'bigote': return bigote;
      case 'sombra': return '<path d="M145 168 C147 222 172 250 200 252 C228 250 253 222 255 168 C249 196 236 213 221 217 C213 209 187 209 179 217 C164 213 151 196 145 168 Z" fill="' + c + '" opacity=".28"/>';
      default: return '';
    }
  }

  function gafas(p) {
    if (!p.gafas) return '';
    const montura = p.gafas === 'finas' ? '#b49a63' : '#1b2130';
    const w = p.gafas === 'finas' ? 2 : 3.2;
    const cristal = 'fill="rgba(210,228,255,.13)" stroke="' + montura + '" stroke-width="' + w + '"';
    let s = '';
    if (p.gafas === 'redondas') s = '<circle cx="179" cy="160" r="15" ' + cristal + '/><circle cx="221" cy="160" r="15" ' + cristal + '/>';
    else s = '<rect x="162" y="149" width="34" height="23" rx="7" ' + cristal + '/><rect x="204" y="149" width="34" height="23" rx="7" ' + cristal + '/>';
    s += '<path d="M194 158 Q200 153 206 158" fill="none" stroke="' + montura + '" stroke-width="' + w + '"/>';
    s += '<path d="M163 156 L146 152 M237 156 L254 152" stroke="' + montura + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    s += '<path d="M168 153 L176 151" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>';
    return s;
  }

  function ojos(p) {
    const ojo = (cx, lado) =>
      '<g class="av-ojo av-ojo-' + lado + '"><g class="av-parpadeo">' +
      '<ellipse cx="' + cx + '" cy="160" rx="10.5" ry="7.2" fill="#fbfbfb"/>' +
      '<g class="av-pupila"><circle cx="' + cx + '" cy="160.5" r="5.4" fill="' + p.colorOjos + '"/><circle cx="' + cx + '" cy="160.5" r="2.6" fill="#141414"/>' +
      '<circle cx="' + (cx + 1.8) + '" cy="158.6" r="1.4" fill="#fff"/></g>' +
      '<path d="M' + (cx - 11) + ' 158 Q' + cx + ' 149 ' + (cx + 11) + ' 158" fill="none" stroke="#2a1c16" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g></g>';
    return '<g class="av-ojos">' + ojo(179, 'i') + ojo(221, 'd') + '</g>';
  }

  function cejas(p) {
    const c = oscurecer(p.colorPelo, 0.15);
    const w = p.cejas;
    return '<g class="av-cejas">' +
      '<path class="av-ceja av-ceja-i" d="M165 141 Q179 133 193 139" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>' +
      '<path class="av-ceja av-ceja-d" d="M207 139 Q221 133 235 141" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>' +
      '</g>';
  }

  function boca(p) {
    const labio = p.pintalabios || mezclar(oscurecer(p.piel, 0.35), '#8a3a3a', 0.35);
    const st = 'fill="none" stroke="' + labio + '" stroke-width="4" stroke-linecap="round"';
    return '<g class="av-boca">' +
      '<path class="boca-neutral" d="M186 206 Q200 210 214 206" ' + st + '/>' +
      '<path class="boca-sonrisa" d="M183 203 Q200 217 217 203" ' + st + '/>' +
      '<g class="boca-grande"><path d="M181 201 Q200 227 219 201 Q200 207 181 201 Z" fill="#5a2230"/><path d="M186 203 Q200 207 214 203 L212.5 207.5 Q200 210.5 187.5 207.5 Z" fill="#fff"/></g>' +
      '<path class="boca-tensa" d="M187 208 L213 208" ' + st + '/>' +
      '<path class="boca-enfado" d="M185 213 Q200 202 215 213" ' + st + '/>' +
      '<path class="boca-duda" d="M187 210 Q199 208 214 202" ' + st + '/>' +
      '<ellipse class="boca-pensativa" cx="207" cy="208" rx="5" ry="4" fill="' + oscurecer(labio, 0.3) + '"/>' +
      '</g>';
  }

  function arrugas(p) {
    if (p.edad < 45) return '';
    const c = oscurecer(p.piel, 0.22);
    const o = p.edad >= 58 ? 0.6 : 0.38;
    return '<g opacity="' + o + '" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round">' +
      '<path d="M178 116 Q200 111 222 116"/>' + (p.edad >= 55 ? '<path d="M182 124 Q200 120 218 124"/>' : '') +
      '<path d="M160 164 l-6 3 M240 164 l6 3"/>' +
      '<path d="M182 187 Q176 198 179 208 M218 187 Q224 198 221 208"/>' +
      '</g>';
  }

  function pendientes(p) {
    if (!p.pendientes) return '';
    if (p.pendientes === 'aro') return '<circle cx="143" cy="188" r="6" fill="none" stroke="#e1c16e" stroke-width="2.4"/><circle cx="257" cy="188" r="6" fill="none" stroke="#e1c16e" stroke-width="2.4"/>';
    const c = p.pendientes === 'perla' ? '#f4f1ea' : '#e1c16e';
    return '<circle cx="143" cy="184" r="3.8" fill="' + c + '"/><circle cx="257" cy="184" r="3.8" fill="' + c + '"/>';
  }

  /* ---------- Torso y ropa ---------- */
  function torso(p) {
    const r = p.colorRopa, rc = oscurecer(r, 0.22), cam = p.colorCamisa;
    const base = 'M60 350 C64 304 108 280 160 272 L240 272 C292 280 336 304 340 350 L348 540 L52 540 Z';
    const sombra = '<path d="M200 272 L240 272 C292 280 336 304 340 350 L348 540 L200 540 Z" fill="#000" opacity=".09"/>';
    let s = '';
    switch (p.ropa) {
      case 'traje':
      case 'blazer': {
        s += '<path d="' + base + '" fill="' + r + '"/>';
        s += '<path d="M171 270 L200 342 L229 270 Z" fill="' + cam + '"/>';
        if (p.corbata) s += '<path d="M193 272 L207 272 L205 285 L195 285 Z" fill="' + oscurecer(p.corbata, 0.15) + '"/><path d="M195 284 L205 284 L211 304 L205 386 L200 394 L195 386 L189 304 Z" fill="' + p.corbata + '"/>';
        s += '<path d="M171 270 L184 294 L199 278 Z" fill="' + oscurecer(cam, 0.08) + '"/><path d="M229 270 L216 294 L201 278 Z" fill="' + oscurecer(cam, 0.08) + '"/>';
        s += '<path d="M171 270 L150 308 L181 378 L200 342 Z" fill="' + rc + '"/><path d="M229 270 L250 308 L219 378 L200 342 Z" fill="' + rc + '"/>';
        if (p.ropa === 'traje') s += '<path d="M248 330 L270 326" stroke="' + aclarar(r, 0.5) + '" stroke-width="3"/>';
        s += '<circle cx="200" cy="430" r="4" fill="' + oscurecer(r, 0.4) + '"/><circle cx="200" cy="476" r="4" fill="' + oscurecer(r, 0.4) + '"/>';
        if (p.panuelo) s += '<path d="M178 270 Q200 296 222 270 L214 292 Q200 304 186 292 Z" fill="' + p.panuelo + '"/>';
        break;
      }
      case 'jersey':
        s += '<path d="' + base + '" fill="' + r + '"/>';
        s += '<path d="M174 270 L184 286 L198 276 Z M226 270 L216 286 L202 276 Z" fill="' + cam + '"/>';
        s += '<path d="M166 272 Q200 302 234 272" fill="none" stroke="' + rc + '" stroke-width="10" stroke-linecap="round"/>';
        s += '<path d="M120 520 L120 380 M280 520 L280 380" stroke="' + rc + '" stroke-width="2" opacity=".35"/>';
        break;
      case 'camisa':
        s += '<path d="' + base + '" fill="' + cam + '"/>';
        s += '<path d="M172 268 L186 298 L199 278 Z M228 268 L214 298 L201 278 Z" fill="' + oscurecer(cam, 0.1) + '"/>';
        s += '<path d="M200 282 L200 540" stroke="' + oscurecer(cam, 0.15) + '" stroke-width="2"/>';
        [312, 362, 412, 462].forEach((y) => { s += '<circle cx="200" cy="' + y + '" r="2.6" fill="' + oscurecer(cam, 0.3) + '"/>'; });
        if (p.corbata) s += '<path d="M195 282 L205 282 L211 304 L205 386 L200 394 L195 386 L189 304 Z" fill="' + p.corbata + '"/>';
        break;
      case 'blusa':
        s += '<path d="' + base + '" fill="' + r + '"/>';
        s += '<path d="M174 270 Q200 318 226 270 Z" fill="' + p.piel + '"/><path d="M174 270 Q200 318 226 270" fill="none" stroke="' + rc + '" stroke-width="3"/>';
        if (p.panuelo) s += '<path d="M178 272 Q200 292 222 272 L212 298 Q200 306 188 298 Z" fill="' + p.panuelo + '"/>';
        break;
      case 'cuelloAlto':
        s += '<path d="' + base + '" fill="' + r + '"/>';
        s += '<path d="M176 226 L224 226 L230 284 Q200 294 170 284 Z" fill="' + aclarar(r, 0.05) + '"/>';
        [234, 248, 262, 276].forEach((y) => { s += '<path d="M174 ' + y + ' Q200 ' + (y + 6) + ' 226 ' + y + '" fill="none" stroke="' + rc + '" stroke-width="2" opacity=".5"/>'; });
        break;
      default:
        s += '<path d="' + base + '" fill="' + r + '"/>';
    }
    return '<g class="av-torso">' + s + sombra + '</g>';
  }

  /* ---------- Brazos por postura (capa delantera) ---------- */
  function brazos(p) {
    const manga = p.ropa === 'camisa' ? p.colorCamisa : p.colorRopa;
    const mangaOsc = oscurecer(manga, 0.12);
    const piel = p.piel, pielOsc = oscurecer(p.piel, 0.18);
    const puno = p.ropa === 'camisa' || p.ropa === 'blusa' || p.ropa === 'jersey' || p.ropa === 'cuelloAlto' ? oscurecer(manga, 0.08) : p.colorCamisa;
    // Contorno oscuro + manga: separa el brazo del torso aunque sean del mismo color
    const brazo = (d, osc) => '<path d="' + d + '" fill="none" stroke="' + oscurecer(manga, 0.38) + '" stroke-width="51" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>' +
      '<path d="' + d + '" fill="none" stroke="' + (osc ? mangaOsc : manga) + '" stroke-width="45" stroke-linecap="round" stroke-linejoin="round"/>';
    const mano = (cx, cy, rx, ry, rot) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + piel + '" stroke="' + pielOsc + '" stroke-width="1.5"' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '/>';
    const punoC = (cx, cy, rot) => '<rect x="' + (cx - 14) + '" y="' + (cy - 8) + '" width="28" height="16" rx="5" fill="' + puno + '" transform="rotate(' + (rot || 0) + ' ' + cx + ' ' + cy + ')"/>';
    const pose = (nombre, contenido) => '<g class="av-pose pose-' + nombre + '">' + contenido + '</g>';
    return [
      pose('reposo', brazo('M98 302 C82 364 82 432 98 476 L160 498') + brazo('M302 302 C318 364 318 432 302 476 L240 498', true) +
        punoC(166, 499, 18) + punoC(234, 499, -18) + mano(184, 503, 25, 15, 8) + mano(216, 503, 25, 15, -8)),
      pose('inclinado', brazo('M98 302 C78 372 86 446 112 486 L150 512') + brazo('M302 302 C322 372 314 446 288 486 L250 512', true) +
        punoC(154, 512, 30) + punoC(246, 512, -30) + mano(164, 520, 24, 15, 20) + mano(236, 520, 24, 15, -20)),
      pose('cruzados', brazo('M302 302 C324 352 318 398 284 414 L152 396', true) + mano(144, 394, 16, 13) +
        brazo('M98 302 C76 352 82 404 118 420 L252 404') + mano(262, 402, 16, 13)),
      pose('barbilla', brazo('M302 302 C318 364 318 432 302 476 L240 498', true) + punoC(234, 499, -18) + mano(222, 503, 25, 15, -8) +
        brazo('M98 302 C80 392 92 452 126 470 L180 282') + mano(190, 262, 19, 24, 16)),
      pose('reloj', brazo('M302 302 C318 364 318 432 302 476 L240 498', true) + punoC(234, 499, -18) + mano(222, 503, 25, 15, -8) +
        brazo('M98 302 C80 362 98 412 138 424 L222 392') + '<rect x="206" y="380" width="16" height="22" rx="4" fill="' + p.reloj + '"/><circle cx="214" cy="391" r="5" fill="#f3f0e6"/>' + mano(238, 388, 17, 13, -20)),
      pose('movil', brazo('M98 302 C82 372 106 430 166 446') + brazo('M302 302 C318 372 294 430 234 446', true) +
        '<rect x="178" y="402" width="44" height="66" rx="7" fill="#151a24"/><rect x="182" y="407" width="36" height="54" rx="4" fill="#5b8cff" opacity=".55"/>' +
        mano(176, 444, 16, 14) + mano(224, 444, 16, 14)),
      pose('recostado', brazo('M98 302 C80 382 84 440 92 500') + brazo('M302 302 C320 382 316 440 308 500', true))
    ].join('');
  }

  /* ---------- Ensamblado ---------- */
  function partes(param) {
    const p = normalizar(param);
    const pielOsc = oscurecer(p.piel, 0.14);
    const cuello = '<g class="av-cuello"><path d="M178 212 L222 212 L224 282 Q200 292 176 282 Z" fill="' + p.piel + '"/>' +
      '<path d="M178 226 Q200 246 222 226 L222 244 Q200 258 178 244 Z" fill="#000" opacity=".12"/></g>';
    const orejas = '<ellipse cx="143" cy="166" rx="9" ry="15" fill="' + p.piel + '"/><ellipse cx="257" cy="166" rx="9" ry="15" fill="' + p.piel + '"/>' +
      '<path d="M145 158 q-5 8 0 16 M255 158 q5 8 0 16" fill="none" stroke="' + pielOsc + '" stroke-width="2"/>';
    const cara = '<path d="' + CARAS[p.cara] + '" fill="' + p.piel + '"/>' +
      '<ellipse cx="176" cy="122" rx="22" ry="12" fill="#fff" opacity=".08"/>';
    const nariz = '<path d="M201 172 Q197 183 193 188 Q200 192 207 188" fill="none" stroke="' + pielOsc + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
    const mejillas = '<g class="av-mejillas"><circle cx="165" cy="190" r="12" fill="#ff6b6b"/><circle cx="235" cy="190" r="12" fill="#ff6b6b"/></g>';
    const sudor = '<path class="av-sudor" d="M252 120 q6 10 0 15 q-6 -5 0 -15 Z" fill="#9fd3ff"/>';
    // El pelo de detrás va antes que el torso y el cuello (queda por detrás), con la misma animación que la cabeza
    const peloAtras = '<g class="av-cabeza-pos"><g class="av-cabeza">' + pelo(p, 'atras') + '</g></g>';
    const cabeza = '<g class="av-cabeza-pos"><g class="av-cabeza">' +
      orejas + pendientes(p) + cara + arrugas(p) + mejillas + nariz + ojos(p) + cejas(p) + barba(p) + boca(p) + gafas(p) + pelo(p, 'delante') + sudor +
      '</g></g>';
    const cuerpo = '<g class="av-postura"><g class="av-respira">' + peloAtras + torso(p) + cuello + cabeza + '</g></g>';
    const delante = '<g class="av-postura"><g class="av-respira"><g class="av-brazos">' + brazos(p) + '</g></g></g>';
    return { p, cuerpo, delante };
  }

  const ATRIBUTOS = (id, extra, expresion) => 'class="avatar ' + (extra || '') + '" data-avatar="' + id + '" data-expresion="' + (expresion || 'neutral') + '" data-postura="reposo" data-mirada="jugador"';

  /* Devuelve las dos capas como cadenas SVG (<g>) listas para insertar en una escena. */
  function svg(param, id) {
    const pt = partes(param);
    const retPar = (1 + ((param && param.semilla) || 1) % 7 * 0.61).toFixed(2);
    const retResp = (((param && param.semilla) || 1) % 5 * 0.53).toFixed(2);
    const estilo = 'style="--retardo-parpadeo:' + retPar + 's;--retardo-respira:' + retResp + 's"';
    return {
      cuerpo: '<g ' + ATRIBUTOS(id, 'avatar-cuerpo') + ' ' + estilo + '>' + pt.cuerpo + '</g>',
      delante: '<g ' + ATRIBUTOS(id, 'avatar-delante') + ' ' + estilo + '>' + pt.delante + '</g>',
      params: pt.p
    };
  }

  /* Retrato (cabeza y hombros) como <svg> completo, para fichas y menús. */
  function retrato(param, opciones) {
    opciones = opciones || {};
    const pt = partes(param);
    const fondo = opciones.fondo === false ? '' : '<rect x="70" y="30" width="260" height="290" fill="' + (opciones.fondo || '#24304d') + '"/>';
    return '<svg class="retrato ' + (opciones.clase || '') + '" viewBox="85 40 230 270" role="img" aria-label="' + (opciones.etiqueta || 'Retrato') + '" xmlns="http://www.w3.org/2000/svg">' +
      fondo + '<g ' + ATRIBUTOS(opciones.id || 'retrato', 'avatar-cuerpo avatar-retrato', opciones.expresion) + '>' + pt.cuerpo + '</g></svg>';
  }

  /* ---------- Aplicar estado visual a un avatar montado ---------- */
  function aplicarEstado(nodos, estado) {
    (Array.isArray(nodos) ? nodos : [nodos]).forEach((n) => {
      if (!n) return;
      if (estado.expresion) n.setAttribute('data-expresion', estado.expresion);
      if (estado.postura) n.setAttribute('data-postura', estado.postura);
      if (estado.mirada) n.setAttribute('data-mirada', estado.mirada);
      n.setAttribute('data-intensidad', estado.intensidad >= 0.7 ? 'alta' : estado.intensidad >= 0.4 ? 'media' : 'baja');
    });
  }
  const DURACION_GESTO = { asentir: 950, negar: 850, tensarse: 750, relajarse: 1200, suspirar: 1600, sobresalto: 600 };
  function gesto(nodos, nombre) {
    if (!nombre) return;
    (Array.isArray(nodos) ? nodos : [nodos]).forEach((n) => {
      if (!n) return;
      Object.keys(DURACION_GESTO).forEach((g) => n.classList.remove('gesto-' + g));
      void n.getBoundingClientRect();
      n.classList.add('gesto-' + nombre);
      setTimeout(() => n.classList.remove('gesto-' + nombre), DURACION_GESTO[nombre] || 900);
    });
  }

  NG.Avatar = { svg, retrato, normalizar, aplicarEstado, gesto, PIELES, PELOS, ESTILOS, ROPAS, color: { mezclar, oscurecer, aclarar } };
})(typeof window !== 'undefined' ? window : globalThis);
