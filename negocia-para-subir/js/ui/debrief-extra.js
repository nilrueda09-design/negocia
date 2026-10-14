/* =====================================================================
 * NEGOCIA · ui/debrief-extra.js — la parte más pedagógica del debrief
 *  1. Lo que quedó sobre la mesa: cartas ocultas de la contraparte que se
 *     voltean + mapa del espacio de acuerdos (Pareto, ZOPA, la «danza»
 *     de ofertas, tu acuerdo, Nash y el mejor acuerdo sin perjudicarle).
 *  2. Línea de tiempo con aciertos y errores explicados.
 *  3. Sesgos cognitivos detectados con un ejemplo de tu partida.
 *  4. Calidad del proceso y conceptos aplicados.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;
  const R = Math.round;

  function montar(cont, ctx) {
    const { esc, p, punt } = ctx;
    const mesa = NG.Puntuacion.mesa(p);
    const nom = esc.contrapartes.map((c) => c.nombre.split(' ')[0]).join(' y ');
    cont.innerHTML =
      '<section class="panel sobre-mesa"><div class="panel-cuerpo"><h2 class="panel-titulo">' + UI().icono('ojo') + ' Lo que quedó sobre la mesa</h2>' +
      '<p class="frase-dejado">' + fraseDejado(esc, p, mesa, nom) + '</p>' +
      '<div class="sobre-mesa-rejilla"><div class="cartas-ocultas"></div><figure class="mapa-acuerdos">' + mapa(esc, p, mesa) +
      '<figcaption>' + leyenda() + '</figcaption></figure></div></div></section>' +
      '<section class="panel linea-tiempo"><div class="panel-cuerpo"><h2 class="panel-titulo">' + UI().icono('reloj') + ' Tu negociación, turno a turno</h2><div class="pista-tiempo" role="tablist" aria-label="Turnos"></div><div class="detalle-turno" role="tabpanel" aria-live="polite"></div></div></section>' +
      '<section class="panel sesgos-panel"><div class="panel-cuerpo"><h2 class="panel-titulo">' + UI().icono('cerebro') + ' Sesgos cognitivos detectados</h2><div class="sesgos-lista"></div></div></section>' +
      '<div class="debrief-dos"><section class="panel proceso-panel"><div class="panel-cuerpo"><h2 class="panel-titulo">' + UI().icono('carpeta') + ' Calidad del proceso</h2><ul class="lista-proceso"></ul></div></section>' +
      '<section class="panel conceptos-panel"><div class="panel-cuerpo"><h2 class="panel-titulo">' + UI().icono('libro') + ' Conceptos en tu partida</h2><div class="conceptos-lista"></div></div></section></div>';

    pintarCartas(cont.querySelector('.cartas-ocultas'), esc, p, mesa);
    pintarTiempo(cont, p);
    pintarSesgos(cont.querySelector('.sesgos-lista'), punt.sesgos);
    cont.querySelector('.lista-proceso').innerHTML = punt.proceso.map((it) => '<li class="' + (it.puntos >= it.max ? 'ok' : it.puntos > 0 ? 'parcial' : 'no') + '">' + UI().icono(it.puntos > 0 ? 'check' : 'x') + '<span>' + UI().escapar(it.texto) + '</span><b>' + it.puntos + '/' + it.max + '</b></li>').join('');
    const conc = NG.Puntuacion.conceptosAplicados(p, punt);
    cont.querySelector('.conceptos-lista').innerHTML = conc.map((c) => {
      const f = NG.Conceptos.obtener(c.id);
      return '<article class="concepto"><h3>' + UI().escapar(f ? f.nombre : c.id) + '</h3>' + (f ? '<p class="texto-tenue">' + UI().escapar(f.definicion) + '</p>' : '') + '<p class="en-tu-partida">' + UI().icono('diana', 'icono-en-linea') + ' ' + UI().escapar(c.texto) + '</p></article>';
    }).join('');

    // Las cartas se voltean al entrar en pantalla
    const cartas = Array.from(cont.querySelectorAll('.carta'));
    const voltear = () => cartas.forEach((c, i) => setTimeout(() => { c.classList.add('revelada'); if (i % 2 === 0) NG.Sonido.reproducir('seleccion'); }, (NG.App.movimientoReducido() ? 0 : 250) * i));
    if ('IntersectionObserver' in raiz && !NG.App.movimientoReducido()) {
      const io = new IntersectionObserver((ent) => { if (ent.some((e) => e.isIntersecting)) { voltear(); io.disconnect(); } }, { threshold: 0.25 });
      io.observe(cont.querySelector('.cartas-ocultas'));
    } else voltear();
    cartas.forEach((c) => c.addEventListener('click', () => c.classList.toggle('revelada')));
  }

  /* ---------- Frase principal ---------- */
  function fraseDejado(esc, p, m, nom) {
    if (m.acuerdo) {
      if (m.dejado > 0) {
        const cambios = m.cambios.map((c) => c.nombre.toLowerCase() + ' en «' + c.a + '» (no «' + c.de + '»)').join(', ');
        return 'Dejaste <strong>' + m.dejado + ' puntos</strong> sobre la mesa: con ' + UI().escapar(cambios) + ' habrías obtenido <strong>' + R(m.mejor.x) + ' pts</strong> sin que ' + UI().escapar(nom) + ' perdiera nada. Ese valor solo se descubre preguntando y negociando paquetes.';
      }
      return 'Tu acuerdo está en la <strong>frontera de Pareto</strong>: no había forma de mejorarlo para ti sin perjudicar a ' + UI().escapar(nom) + '. Ya solo quedaba repartir.';
    }
    if (!m.hayZopa) return 'Con tu BATNA real (' + p.jugador.batnaValor + ' pts) <strong>no había zona de acuerdo posible</strong>: retirarse era una decisión racional.';
    return 'Había acuerdos mejores que tu alternativa. Uno equilibrado (solución de Nash) habría sido <strong>' + UI().escapar(m.nash ? m.nash.texto : '') + '</strong>: ' + (m.nash ? R(m.nash.x) : '?') + ' pts para ti frente a los ' + p.jugador.batnaValor + ' de tu BATNA.';
  }

  /* ---------- Cartas ocultas ---------- */
  function pintarCartas(caja, esc, p, m) {
    m.ocultos.forEach((o, i) => {
      const grupo = UI().el('div', { class: 'cartas-grupo' });
      grupo.innerHTML = '<div class="cartas-quien">' + NG.Avatar.retrato(esc.contrapartes[i].avatar, { id: 'deb-' + o.id, fondo: '#22305a', clase: 'mini', expresion: p.resultado.tipo === 'acuerdo' ? 'receptivo' : 'desconfiado' }) + '<div><strong>' + UI().escapar(o.nombre) + '</strong><small>' + UI().escapar(o.cargo) + '</small></div></div>';
      const fila = UI().el('div', { class: 'cartas-fila' });
      const carta = (titulo, icono, cuerpo) => '<button type="button" class="carta" aria-label="' + UI().escapar(titulo) + ' (pulsa para voltear)"><span class="carta-interior"><span class="carta-dorso">' + UI().icono('pregunta') + '<small>' + UI().escapar(titulo) + '</small></span>' +
        '<span class="carta-cara"><strong>' + UI().icono(icono, 'icono-en-linea') + ' ' + UI().escapar(titulo) + '</strong>' + cuerpo + '</span></span></button>';
      const prioridades = '<span class="barras-pesos">' + o.pesos.map((w) => '<span class="peso-fila"><em>' + UI().escapar(w.variable) + '</em><span class="pesos-pareja"><i class="suyo" style="width:' + w.peso + '%" title="Para ' + UI().escapar(o.nombre.split(' ')[0]) + ': ' + w.peso + ' %"></i><i class="tuyo" style="width:' + w.tuyo + '%" title="Para ti: ' + w.tuyo + ' %"></i></span></span>').join('') +
        '</span><small class="leyenda-pesos"><i class="suyo"></i> suyo <i class="tuyo"></i> tuyo</small>';
      const limite = '<span class="cifra-grande">' + o.reserva + '<small> pts</small></span><span>Su punto de reserva. Empezó aspirando a ' + o.aspiracion + '.</span>';
      const alternativa = '<span>' + UI().escapar(o.batna.texto) + '</span>';
      const perfil = '<span class="etiqueta azul">' + UI().escapar(o.personalidad) + '</span><span class="perfil-desc">' + UI().escapar(o.descPersonalidad) + '</span>' +
        '<span class="lista-intereses">' + o.intereses.map((it) => '<span class="' + (it.descubierto ? 'si' : 'no') + '">' + UI().icono(it.descubierto ? 'check' : 'x', 'icono-en-linea') + ' ' + UI().escapar(it.texto) + '</span>').join('') + '</span>';
      fila.innerHTML = carta('Sus prioridades', 'grafico', prioridades) + carta('Su límite', 'bandera', limite) + carta('Su alternativa', 'escudo', alternativa) + carta('Su perfil e intereses', 'persona', perfil);
      grupo.appendChild(fila);
      caja.appendChild(grupo);
    });
  }

  /* ---------- Mapa del espacio de acuerdos ---------- */
  function mapa(esc, p, m) {
    const W = 520, H = 430, x0 = 52, x1 = 504, y0 = 384, y1 = 22;
    const sx = (v) => x0 + (x1 - x0) * Math.max(0, Math.min(100, v)) / 100;
    const sy = (v) => y0 - (y0 - y1) * Math.max(0, Math.min(100, v)) / 100;
    const ellos = esc.contrapartes.length > 1 ? 'ellos (media)' : esc.contrapartes[0].nombre.split(' ')[0];
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mapa del espacio de acuerdos: cada punto es un acuerdo posible. Eje horizontal: valor para ti; eje vertical: valor para ' + ellos + '. ' +
      (m.acuerdo ? 'Tu acuerdo: ' + R(m.acuerdo.x) + ' para ti y ' + R(m.acuerdo.y) + ' para la otra parte.' : 'Sin acuerdo.') + '">';
    // Rejilla y ejes
    for (let v = 0; v <= 100; v += 25) {
      s += '<line x1="' + sx(v) + '" y1="' + y0 + '" x2="' + sx(v) + '" y2="' + y1 + '" class="rejilla"/><line x1="' + x0 + '" y1="' + sy(v) + '" x2="' + x1 + '" y2="' + sy(v) + '" class="rejilla"/>';
      s += '<text x="' + sx(v) + '" y="' + (y0 + 16) + '" class="eje-txt" text-anchor="middle">' + v + '</text><text x="' + (x0 - 8) + '" y="' + (sy(v) + 4) + '" class="eje-txt" text-anchor="end">' + v + '</text>';
    }
    s += '<text x="' + ((x0 + x1) / 2) + '" y="' + (H - 6) + '" class="eje-titulo" text-anchor="middle">Valor para ti →</text>';
    s += '<text x="14" y="' + ((y0 + y1) / 2) + '" class="eje-titulo" text-anchor="middle" transform="rotate(-90 14 ' + ((y0 + y1) / 2) + ')">Valor para ' + UI().escapar(ellos) + ' →</text>';
    // ZOPA
    if (m.hayZopa) s += '<rect x="' + sx(m.batnaJ) + '" y="' + sy(100) + '" width="' + (sx(100) - sx(m.batnaJ)) + '" height="' + (sy(m.reservaC) - sy(100)) + '" class="zona-zopa"/><text x="' + (sx(100) - 6) + '" y="' + (sy(m.reservaC) - 6) + '" class="txt-zopa" text-anchor="end">ZOPA</text>';
    s += '<line x1="' + sx(m.batnaJ) + '" y1="' + y0 + '" x2="' + sx(m.batnaJ) + '" y2="' + y1 + '" class="linea-batna"/><text x="' + (sx(m.batnaJ) + 4) + '" y="' + (y1 + 12) + '" class="txt-batna">Tu BATNA</text>';
    s += '<line x1="' + x0 + '" y1="' + sy(m.reservaC) + '" x2="' + x1 + '" y2="' + sy(m.reservaC) + '" class="linea-reserva"/><text x="' + (x0 + 4) + '" y="' + (sy(m.reservaC) - 5) + '" class="txt-reserva">Su reserva</text>';
    // Nube de acuerdos posibles
    const paso = m.puntos.length > 1200 ? 2 : 1;
    s += '<g class="nube">' + m.puntos.filter((_, i) => i % paso === 0).map((pt) => '<circle cx="' + sx(pt.x).toFixed(1) + '" cy="' + sy(pt.y).toFixed(1) + '" r="2"/>').join('') + '</g>';
    // Frontera de Pareto
    s += '<polyline class="frontera" points="' + m.frontera.map((pt) => sx(pt.x).toFixed(1) + ',' + sy(pt.y).toFixed(1)).join(' ') + '"/>';
    // Danza de ofertas
    const danza = (lista, clase) => (lista.length ? '<polyline class="danza ' + clase + '" points="' + lista.map((d) => sx(d.x).toFixed(1) + ',' + sy(d.y).toFixed(1)).join(' ') + '"/>' +
      lista.map((d, i) => '<g class="paso-danza ' + clase + '"><circle cx="' + sx(d.x).toFixed(1) + '" cy="' + sy(d.y).toFixed(1) + '" r="7"/><text x="' + sx(d.x).toFixed(1) + '" y="' + (sy(d.y) + 3.5).toFixed(1) + '" text-anchor="middle">' + (i + 1) + '</text></g>').join('') : '');
    s += danza(m.danza.contraparte, 'suya') + danza(m.danza.jugador, 'tuya');
    if (m.nash) s += '<rect x="' + (sx(m.nash.x) - 7) + '" y="' + (sy(m.nash.y) - 7) + '" width="14" height="14" transform="rotate(45 ' + sx(m.nash.x) + ' ' + sy(m.nash.y) + ')" class="marca-nash"/>';
    if (m.acuerdo && m.mejor && m.mejor.k !== m.acuerdo.k) {
      s += '<defs><marker id="flecha-mejor" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#3cc6b0"/></marker></defs>';
      s += '<line x1="' + sx(m.acuerdo.x) + '" y1="' + sy(m.acuerdo.y) + '" x2="' + sx(m.mejor.x) + '" y2="' + sy(m.mejor.y) + '" class="flecha-mejor" marker-end="url(#flecha-mejor)"/>';
      s += '<circle cx="' + sx(m.mejor.x) + '" cy="' + sy(m.mejor.y) + '" r="9" class="marca-mejor"/>';
    }
    if (m.acuerdo) s += '<path transform="translate(' + sx(m.acuerdo.x) + ' ' + sy(m.acuerdo.y) + ')" d="M0 -12 L3.5 -4 L12 -3.5 L5.5 2.5 L7.5 11 L0 6.5 L-7.5 11 L-5.5 2.5 L-12 -3.5 L-3.5 -4 Z" class="marca-acuerdo"/>';
    return s + '</svg>';
  }
  function leyenda() {
    return '<span><i class="ley ley-nube"></i>Acuerdos posibles</span><span><i class="ley ley-frontera"></i>Frontera de Pareto</span><span><i class="ley ley-zopa"></i>ZOPA</span>' +
      '<span><i class="ley ley-tuya"></i>Tus ofertas</span><span><i class="ley ley-suya"></i>Sus ofertas</span><span><i class="ley ley-acuerdo"></i>Tu acuerdo</span>' +
      '<span><i class="ley ley-mejor"></i>Mejor para ti sin perjudicarle</span><span><i class="ley ley-nash"></i>Solución de Nash</span>';
  }

  /* ---------- Línea de tiempo ---------- */
  function pintarTiempo(cont, p) {
    const turnos = {};
    p.registro.forEach((r) => { (turnos[r.turno] = turnos[r.turno] || []).push(r); });
    const claves = Object.keys(turnos).map(Number).filter((t) => t > 0).sort((a, b) => a - b);
    const pista = cont.querySelector('.pista-tiempo');
    const detalle = cont.querySelector('.detalle-turno');
    if (!claves.length) { pista.innerHTML = '<p class="texto-tenue">La negociación terminó antes de empezar.</p>'; return; }
    const tipoTurno = (lista) => {
      const j = lista.filter((r) => r.tipo === 'juicio');
      if (j.some((r) => r.juicio === 'error')) return j.some((r) => r.juicio === 'acierto') ? 'mixto' : 'error';
      if (j.some((r) => r.juicio === 'acierto')) return 'acierto';
      return 'neutral';
    };
    const mostrar = (t) => {
      pista.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', b.dataset.turno === String(t) ? 'true' : 'false'));
      detalle.innerHTML = '<h3>Turno ' + t + '</h3><ul class="eventos-turno">' + turnos[t].map((r) => {
        if (r.tipo === 'accion') return '<li class="t-accion">' + UI().icono('flecha', 'icono-en-linea') + ' <strong>Tú:</strong> ' + UI().escapar(r.texto) + '</li>';
        if (r.tipo === 'respuesta') return '<li class="t-respuesta">' + UI().icono('mensaje', 'icono-en-linea') + ' ' + UI().escapar(r.texto) + '</li>';
        if (r.tipo === 'evento') return '<li class="t-evento">' + UI().icono('rayo', 'icono-en-linea') + ' <strong>Imprevisto:</strong> ' + UI().escapar(r.texto) + '</li>';
        if (r.tipo === 'juicio') return '<li class="t-juicio j-' + r.juicio + '"><span class="etiqueta ' + (r.juicio === 'acierto' ? 'turquesa' : r.juicio === 'error' ? 'coral' : '') + '">' + (r.juicio === 'acierto' ? 'Acierto' : r.juicio === 'error' ? 'Error' : 'Matiz') + '</span> ' + UI().escapar(r.explicacion) + '</li>';
        if (r.tipo === 'fin') return '<li class="t-fin">' + UI().icono('bandera', 'icono-en-linea') + ' ' + UI().escapar(r.texto) + '</li>';
        return '<li>' + UI().escapar(r.texto || '') + '</li>';
      }).join('') + '</ul>';
    };
    pista.innerHTML = claves.map((t) => {
      const tipo = tipoTurno(turnos[t]);
      const nA = turnos[t].filter((r) => r.juicio === 'acierto').length, nE = turnos[t].filter((r) => r.juicio === 'error').length;
      return '<button type="button" role="tab" class="hito-turno h-' + tipo + '" data-turno="' + t + '" aria-label="Turno ' + t + ': ' + nA + ' aciertos, ' + nE + ' errores"><i></i><span>T' + t + '</span></button>';
    }).join('');
    pista.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => mostrar(+b.dataset.turno)));
    const primeroError = claves.find((t) => turnos[t].some((r) => r.juicio === 'error'));
    mostrar(primeroError || claves[0]);
  }

  /* ---------- Sesgos ---------- */
  function pintarSesgos(caja, sesgos) {
    if (!sesgos.length) {
      caja.innerHTML = '<div class="sin-sesgos">' + UI().icono('escudo') + '<div><strong>No se han detectado sesgos en esta partida.</strong><p class="texto-tenue">Tomaste decisiones con información, sin dejarte arrastrar por anclas, prisas ni costes hundidos.</p></div></div>';
      return;
    }
    caja.innerHTML = sesgos.map((s) => '<article class="sesgo g' + s.gravedad + '"><header><h3>' + UI().escapar(s.nombre) + '</h3><span class="gravedad" aria-label="Gravedad ' + s.gravedad + ' de 3">' + [1, 2, 3].map((k) => '<i class="' + (k <= s.gravedad ? 'on' : '') + '"></i>').join('') + '</span></header>' +
      '<p class="sesgo-ejemplo">' + UI().icono('lupa', 'icono-en-linea') + ' ' + UI().escapar(s.ejemplo) + '</p>' + (s.extra ? '<p class="sesgo-ejemplo">' + UI().icono('lupa', 'icono-en-linea') + ' ' + UI().escapar(s.extra) + '</p>' : '') +
      '<p class="texto-tenue">' + UI().escapar(s.definicion) + '</p><p class="sesgo-consejo"><strong>Para la próxima:</strong> ' + UI().escapar(s.consejo) + '</p></article>').join('');
  }

  NG.DebriefExtra = { montar, mapa };
})(typeof window !== 'undefined' ? window : globalThis);
