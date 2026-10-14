/* =====================================================================
 * NEGOCIA · ui/debrief.js — Fase 3: debrief
 * Puntuación en cinco dimensiones, resultado y acciones siguientes.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  const DIMS = [
    { id: 'valor', corto: 'Valor', nombre: 'Valor obtenido', icono: 'diana', ayuda: 'Cuánto del valor alcanzable capturaste por encima de tu alternativa.' },
    { id: 'conjunto', corto: 'Conjunto', nombre: 'Valor conjunto creado', icono: 'apreton', ayuda: 'Lo cerca que quedó el acuerdo de la frontera de Pareto: ¿agrandasteis el pastel?' },
    { id: 'relacion', corto: 'Relación', nombre: 'Relación a largo plazo', icono: 'corazon', ayuda: 'Confianza final, tensión acumulada y honestidad.' },
    { id: 'proceso', corto: 'Proceso', nombre: 'Calidad del proceso', icono: 'carpeta', ayuda: 'Preparación, preguntas, reciprocidad y ritmo.' },
    { id: 'sesgos', corto: 'Sesgos', nombre: 'Gestión de sesgos', icono: 'cerebro', ayuda: 'Cuántos sesgos cognitivos evitaste y cómo decidiste bajo presión.' }
  ];

  NG.Pantallas.debrief = {
    titulo: 'Debrief',
    requiereParams: true,
    montar(cont, params, app) {
      const esc = NG.Escenarios.obtener(params.escenario);
      const p = params.partida;
      const punt = params.punt || NG.Puntuacion.calcular(p);
      app.titulo((params.modelo ? 'Partida modelo · ' : 'Debrief · ') + esc.titulo);
      const r = p.resultado;
      const titulo = r.tipo === 'acuerdo' ? 'Acuerdo cerrado' : r.tipo === 'ruptura' ? 'Sin acuerdo: la otra parte se marchó' : 'Sin acuerdo: te levantaste';

      cont.innerHTML =
        '<div class="contenedor debrief">' +
        '  <header class="debrief-cabecera">' +
        '    <div class="anillo-puntuacion" role="img" aria-label="Puntuación total ' + punt.total + ' de 100">' + anillo(punt.total) + '<div class="anillo-centro"><b class="total">0</b><span>/100</span></div></div>' +
        '    <div class="debrief-titular"><span class="etiqueta ' + (r.tipo === 'acuerdo' ? 'turquesa' : 'coral') + '">' + (params.modelo ? 'Partida modelo · ' : '') + titulo + '</span>' +
        '      <h1>' + (punt.superado ? (punt.estrellas === 3 ? '¡Negociación magistral!' : punt.estrellas === 2 ? '¡Muy bien negociado!' : 'Escenario superado') : 'Aún no lo has superado') + '</h1>' +
        '      <div class="estrellas-grandes">' + UI().estrellas(punt.estrellas) + '</div>' +
        '      <p class="texto-suave">' + (r.paquete ? UI().escapar(NG.Analisis.describir(esc, r.paquete)) + ' · ' : '') + 'Valor para ti: <strong>' + Math.round(r.uj) + ' pts</strong> (tu BATNA: ' + p.jugador.batnaValor + ')</p>' +
        '      <div class="avisos-progreso"></div></div>' +
        '  </header>' +
        '  <section class="panel dimensiones"><div class="panel-cuerpo"><h2 class="panel-titulo">' + UI().icono('grafico') + ' Tu puntuación en 5 dimensiones</h2><div class="dims-rejilla"><div class="radar"></div><div class="dims-barras"></div></div></div></section>' +
        '  <div class="debrief-extra"></div>' +
        '  <nav class="debrief-acciones fila" aria-label="Siguientes pasos"></nav>' +
        '</div>';

      NG.Efectos.contar(cont.querySelector('.total'), punt.total, 1200);
      cont.querySelector('.radar').innerHTML = radar(punt.dimensiones);
      cont.querySelector('.dims-barras').innerHTML = DIMS.map((d) => '<div class="dim"><div class="fila entre"><span>' + UI().icono(d.icono, 'icono-en-linea') + ' <strong>' + d.nombre + '</strong></span><b>' + punt.dimensiones[d.id] + '</b></div>' +
        '<div class="medidor-pista"><div class="medidor-relleno dim-' + d.id + '" style="width:0%"></div></div><small class="texto-tenue">' + d.ayuda + '</small></div>').join('');
      setTimeout(() => cont.querySelectorAll('.dims-barras .medidor-relleno').forEach((b, i) => { b.style.width = punt.dimensiones[DIMS[i].id] + '%'; }), 150);
      NG.Sonido.reproducir(punt.superado ? 'sello' : 'bajada');
      if (punt.estrellas === 3) setTimeout(() => NG.Efectos.particulas(cont.querySelector('.debrief-cabecera'), 12, 40, 'oro', 30), 700);

      // Avisos de progreso: récord, desbloqueos, logros, rango
      const ap = cont.querySelector('.avisos-progreso');
      const pr = params.progreso;
      if (pr) {
        if (pr.record) ap.innerHTML += '<span class="etiqueta ambar">' + UI().icono('estrella', 'icono-en-linea') + ' Nuevo récord</span>';
        if (pr.recienSuperado) {
          const sig = NG.Escenarios.todos().find((e) => e.orden === esc.orden + 1);
          if (sig) ap.innerHTML += '<span class="etiqueta turquesa">' + UI().icono('candado', 'icono-en-linea') + ' Desbloqueado: ' + UI().escapar(sig.titulo) + '</span>';
        }
        (pr.nuevasTecnicas || []).forEach((t) => {
          const n = { meso: 'Ofertas múltiples (MESO)', ofertaFinal: 'Oferta final', bilateral: 'Reunión bilateral' }[t];
          ap.innerHTML += '<span class="etiqueta azul">' + UI().icono('rayo', 'icono-en-linea') + ' Nueva técnica: ' + n + '</span>';
        });
        (pr.nuevosLogros || []).forEach((l, i) => setTimeout(() => { NG.Sonido.reproducir('logro'); UI().toast({ titulo: 'Logro: ' + l.nombre, texto: l.descripcion, icono: l.icono, duracion: 5200 }); }, 900 + i * 1400));
        if (pr.subeRango) setTimeout(() => UI().toast({ titulo: '¡Nuevo rango: ' + pr.subeRango.nombre + '!', texto: pr.subeRango.descripcion, icono: 'trofeo', duracion: 6000 }), 600);
      }

      if (NG.DebriefExtra) NG.DebriefExtra.montar(cont.querySelector('.debrief-extra'), { esc, p, punt, app, modelo: params.modelo });

      const acc = cont.querySelector('.debrief-acciones');
      acc.appendChild(UI().boton({ texto: 'Repetir con otra estrategia', icono: 'repetir', clase: 'btn-primario', onClick: () => app.ir('preparacion', { escenario: esc.id }) }));
      if (esc.partidaModelo && !params.modelo) acc.appendChild(UI().boton({ texto: 'Ver la partida modelo comentada', icono: 'play', onClick: () => app.ir('negociacion', { escenario: esc.id, modelo: true }) }));
      const sig = NG.Escenarios.todos().find((e) => e.orden === esc.orden + 1 && /^e\d/.test(e.id));
      if (sig && NG.Progreso.desbloqueado(app.progreso, sig)) acc.appendChild(UI().boton({ texto: 'Siguiente: ' + sig.titulo, iconoFinal: 'flecha', onClick: () => app.ir('briefing', { escenario: sig.id }) }));
      acc.appendChild(UI().boton({ texto: NG.Pantallas.mapa ? 'Mapa de campaña' : 'Menú', icono: NG.Pantallas.mapa ? 'mapa' : 'atras', clase: 'btn-fantasma', onClick: () => app.ir(NG.Pantallas.mapa ? 'mapa' : 'menu') }));
    }
  };

  function anillo(total) {
    const r = 54, c = 2 * Math.PI * r;
    const color = total >= 85 ? '#f2b84b' : total >= 70 ? '#3cc6b0' : total >= 50 ? '#5b8cff' : '#ff6b6b';
    return '<svg viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="' + r + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/>' +
      '<circle class="anillo-progreso" cx="64" cy="64" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" style="--final:' + (c * (1 - total / 100)).toFixed(1) + '" transform="rotate(-90 64 64)"/></svg>';
  }

  /* Radar de 5 ejes (pentágono). */
  function radar(d) {
    const cx = 150, cy = 140, R = 100;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const pt = (i, v) => [cx + Math.cos(ang(i)) * R * v, cy + Math.sin(ang(i)) * R * v];
    let s = '<svg viewBox="0 0 300 290" role="img" aria-label="Radar de las cinco dimensiones: ' + DIMS.map((x) => x.nombre + ' ' + d[x.id]).join(', ') + '">';
    [0.25, 0.5, 0.75, 1].forEach((k) => { s += '<polygon points="' + [0, 1, 2, 3, 4].map((i) => pt(i, k).join(',')).join(' ') + '" fill="none" stroke="rgba(255,255,255,.1)"/>'; });
    [0, 1, 2, 3, 4].forEach((i) => { const [x, y] = pt(i, 1); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" stroke="rgba(255,255,255,.08)"/>'; });
    const poly = DIMS.map((x, i) => pt(i, d[x.id] / 100).join(',')).join(' ');
    s += '<polygon class="radar-area" points="' + poly + '" fill="rgba(242,184,75,.28)" stroke="#f2b84b" stroke-width="2.5" stroke-linejoin="round"/>';
    DIMS.forEach((x, i) => {
      const [px, py] = pt(i, d[x.id] / 100);
      s += '<circle cx="' + px + '" cy="' + py + '" r="4" fill="#ffd27a"/>';
      const [lx, ly] = pt(i, 1.2);
      s += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="middle" fill="#c0c9dc" font-size="11" font-weight="700">' + x.corto + ' ' + d[x.id] + '</text>';
    });
    return s + '</svg>';
  }

  NG.Debrief = { DIMS, radar };
})(typeof window !== 'undefined' ? window : globalThis);
