/* =====================================================================
 * NEGOCIA · ui/menu.js — menú principal con aspecto de videojuego
 * Ciudad nocturna con parallax, logo, reparto de personajes de la
 * campaña (bloqueados en silueta), rango y accesos.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  NG.Pantallas.menu = {
    titulo: '',
    barra: false,
    montar(cont, params, app) {
      const prog = app.progreso;
      const r = NG.Progreso.rango(prog);
      const escenarios = NG.Escenarios.todos().filter((e) => /^e\d/.test(e.id));
      const superados = escenarios.filter((e) => NG.Progreso.registro(prog, e.id).superado).length;
      const sig = NG.Progreso.siguienteEscenario(prog);
      const nLogros = Object.keys(prog.logros).length;
      const empezado = prog.partidas > 0;
      const pctRango = r.siguiente ? Math.round(((r.total - r.desde) / (r.siguiente.desde - r.desde)) * 100) : 100;

      cont.innerHTML =
        '<div class="menu-fondo">' + NG.Escenas.fondoMenu() + '</div>' +
        '<div class="menu-luz" aria-hidden="true"></div>' +
        '<div class="menu-contenido">' +
        '  <header class="menu-logo">' + UI().emblema('emblema-grande') +
        '    <h1 class="logotipo">NEGOCIA</h1>' +
        '    <p class="lema">El arte de negociar · La ciencia de decidir</p>' +
        '  </header>' +
        '  <nav class="menu-botones" aria-label="Menú principal"></nav>' +
        '  <section class="menu-estado panel" aria-label="Tu progreso">' +
        '    <div class="menu-rango">' + UI().icono('trofeo') + '<div><span class="texto-tenue">Rango</span><strong>' + r.nombre + '</strong></div></div>' +
        '    <div class="menu-progreso-rango"><div class="medidor"><div class="medidor-cabecera"><span>' + (r.siguiente ? 'Hacia ' + r.siguiente.nombre : 'Rango máximo') + '</span><span class="valor">' + r.total + ' pts</span></div>' +
        '      <div class="medidor-pista" role="meter" aria-label="Progreso de rango" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pctRango + '"><div class="medidor-relleno" style="width:' + pctRango + '%"></div></div></div></div>' +
        '    <div class="menu-cifras"><div><strong>' + superados + '/' + escenarios.length + '</strong><span>escenarios</span></div><div><strong>' + nLogros + '/' + NG.Logros.length + '</strong><span>logros</span></div></div>' +
        '  </section>' +
        '  <section class="menu-reparto" aria-label="Personajes de la campaña"></section>' +
        '</div>' +
        '<footer class="menu-pie">Serious game de negociación y toma de decisiones para directivos · HTML, CSS y JavaScript, sin dependencias</footer>';

      const nav = cont.querySelector('.menu-botones');
      const etiquetaPrincipal = !empezado ? 'Empezar campaña' : 'Continuar · ' + sig.titulo;
      nav.appendChild(UI().boton({ texto: etiquetaPrincipal, icono: 'play', clase: 'btn-primario btn-grande btn-bloque', onClick: () => app.ir(NG.Pantallas.mapa ? 'mapa' : 'briefing', NG.Pantallas.mapa ? { foco: sig.id } : { escenario: sig.id }) }));
      const sec = UI().el('div', { class: 'menu-secundarios' });
      if (NG.Pantallas.mapa) sec.appendChild(UI().boton({ texto: 'Mapa de campaña', icono: 'mapa', onClick: () => app.ir('mapa') }));
      if (NG.Pantallas.biblioteca) sec.appendChild(UI().boton({ texto: 'Biblioteca', icono: 'libro', onClick: () => app.ir('biblioteca') }));
      if (NG.Pantallas.logros) sec.appendChild(UI().boton({ texto: 'Logros', icono: 'trofeo', onClick: () => app.ir('logros') }));
      sec.appendChild(UI().boton({ texto: 'Cómo se juega', icono: 'ayuda', onClick: () => NG.Guia.abrir() }));
      sec.appendChild(UI().boton({ texto: 'Ajustes', icono: 'ajustes', onClick: () => NG.Ajustes.abrir() }));
      nav.appendChild(sec);

      // Reparto: la contraparte de cada escenario (silueta si está bloqueado)
      const reparto = cont.querySelector('.menu-reparto');
      escenarios.forEach((e) => {
        const c = e.contrapartes[e.contrapartes.length > 1 ? 1 : 0];
        const abierto = NG.Progreso.desbloqueado(prog, e);
        const reg = NG.Progreso.registro(prog, e.id);
        const fig = UI().el('figure', { class: 'reparto-ficha' + (abierto ? '' : ' bloqueada') + (reg.superado ? ' superada' : '') });
        fig.innerHTML = NG.Avatar.retrato(c.avatar, { id: 'rep-' + e.id, etiqueta: abierto ? c.nombre : 'Personaje bloqueado', expresion: reg.superado ? 'receptivo' : 'neutral', fondo: '#1b2442' }) +
          (abierto ? '' : '<span class="candado">' + UI().icono('candado') + '</span>') +
          '<figcaption><span class="num">' + e.orden + '</span>' + (abierto ? UI().escapar(e.titulo) : 'Bloqueado') + (reg.estrellas ? UI().estrellas(reg.estrellas) : '') + '</figcaption>';
        reparto.appendChild(fig);
      });

      // Parallax suave de la ciudad
      const capas = Array.from(cont.querySelectorAll('.capa-menu'));
      let raf = 0, pos = [0, 0];
      const mover = (ev) => {
        if (app.movimientoReducido()) return;
        pos = [(ev.clientX / window.innerWidth - 0.5) * 2, (ev.clientY / window.innerHeight - 0.5) * 2];
        if (!raf) raf = requestAnimationFrame(() => {
          raf = 0;
          capas.forEach((c) => { const f = parseFloat(c.getAttribute('data-p')); c.style.transform = 'translate(' + (-pos[0] * 30 * f).toFixed(1) + 'px,' + (-pos[1] * 10 * f).toFixed(1) + 'px)'; });
        });
      };
      window.addEventListener('pointermove', mover);

      // La primera vez, guía rápida de 2 minutos
      if (!prog.guiaVista) setTimeout(() => { NG.Guia.abrir(); prog.guiaVista = true; app.guardar(); }, 900);

      return { desmontar() { window.removeEventListener('pointermove', mover); if (raf) cancelAnimationFrame(raf); } };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
