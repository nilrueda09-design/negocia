/* =====================================================================
 * NEGOCIA · ui/briefing.js — presentación del escenario
 * Retrato de la contraparte, rol, contexto, misión, qué aprenderás y
 * variables en juego.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  NG.Pantallas.briefing = {
    titulo: 'Briefing',
    requiereParams: true,
    montar(cont, params, app) {
      const esc = NG.Escenarios.obtener(params.escenario) || NG.Progreso.siguienteEscenario(app.progreso);
      if (!NG.Progreso.desbloqueado(app.progreso, esc)) {
        // Escenario bloqueado: vuelta al mapa con explicación
        setTimeout(() => { app.ir('mapa'); UI().toast({ titulo: 'Escenario bloqueado', texto: 'Supera el escenario anterior para desbloquearlo.', icono: 'candado' }); }, 0);
        return;
      }
      const reg = NG.Progreso.registro(app.progreso, esc.id);
      app.titulo('Escenario ' + esc.orden + ' · ' + esc.titulo);
      const b = esc.briefing;
      const dif = '<span class="dificultad" aria-label="Dificultad ' + esc.dificultad + ' de 5">' + [1, 2, 3, 4, 5].map((i) => '<i class="' + (i <= esc.dificultad ? 'on' : '') + '"></i>').join('') + '</span>';
      const retratos = esc.contrapartes.map((c, i) =>
        '<figure class="briefing-retrato' + (esc.contrapartes.length > 1 ? ' pequeno' : '') + '">' + NG.Avatar.retrato(c.avatar, { id: 'brf' + i, etiqueta: c.nombre, fondo: '#22305a' }) +
        '<figcaption><strong>' + UI().escapar(c.nombre) + '</strong><span>' + UI().escapar(c.cargo) + '</span></figcaption></figure>').join('');
      const vars = esc.variables.map((v) => '<li>' + UI().icono(v.icono || 'oferta') + '<span><strong>' + UI().escapar(v.nombre) + '</strong><small>' + v.opciones[0] + ' — ' + v.opciones[v.opciones.length - 1] + '</small></span></li>').join('');
      cont.innerHTML =
        '<div class="contenedor briefing">' +
        '  <div class="briefing-retratos">' + retratos + '</div>' +
        '  <article class="briefing-texto panel"><div class="panel-cuerpo">' +
        '    <div class="fila"><span class="etiqueta ambar">Escenario ' + esc.orden + '</span>' + dif + '<span class="etiqueta">' + UI().icono('reloj', 'icono-en-linea') + ' ~' + esc.duracionMin + ' min</span>' +
        (reg.mejor ? '<span class="etiqueta turquesa">Mejor: ' + reg.mejor + ' ' + UI().estrellas(reg.estrellas) + '</span>' : '') + '</div>' +
        '    <h1>' + UI().escapar(esc.titulo) + '</h1><p class="subtitulo">' + UI().escapar(esc.subtitulo) + '</p>' +
        '    <h3>' + UI().icono('persona', 'icono-en-linea') + ' Tu papel</h3><p>' + UI().escapar(b.rol) + '</p>' +
        '    <h3>' + UI().icono('info', 'icono-en-linea') + ' La situación</h3><p>' + UI().escapar(b.contexto) + '</p>' +
        '    <h3>' + UI().icono('diana', 'icono-en-linea') + ' Tu misión</h3><p>' + UI().escapar(b.meta) + '</p>' +
        '    <div class="briefing-columnas"><div><h3>' + UI().icono('libro', 'icono-en-linea') + ' Aprenderás</h3><ul class="lista-check">' + b.aprenderas.map((x) => '<li>' + UI().icono('check') + UI().escapar(x) + '</li>').join('') + '</ul></div>' +
        '    <div><h3>' + UI().icono('oferta', 'icono-en-linea') + ' Sobre la mesa</h3><ul class="lista-variables">' + vars + '</ul></div></div>' +
        '    <div class="fila briefing-acciones"></div>' +
        '  </div></article>' +
        '</div>';
      const acc = cont.querySelector('.briefing-acciones');
      acc.appendChild(UI().boton({ texto: 'Empezar la preparación', icono: 'carpeta', clase: 'btn-primario btn-grande', onClick: () => app.ir('preparacion', { escenario: esc.id }) }));
      acc.appendChild(UI().boton({ texto: 'Volver', icono: 'atras', clase: 'btn-fantasma', onClick: () => app.ir(NG.Pantallas.mapa ? 'mapa' : 'menu') }));
      if (esc.partidaModelo && reg.intentos) acc.appendChild(UI().boton({ texto: 'Ver la partida modelo', icono: 'play', clase: 'btn-fantasma', onClick: () => app.ir('negociacion', { escenario: esc.id, modelo: true }) }));
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
