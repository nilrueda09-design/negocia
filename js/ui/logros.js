/* =====================================================================
 * NEGOCIA · ui/logros.js — logros y rangos
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  NG.Pantallas.logros = {
    titulo: 'Logros',
    montar(cont, params, app) {
      const prog = app.progreso;
      const r = NG.Progreso.rango(prog);
      const conseguidos = Object.keys(prog.logros).length;
      cont.innerHTML =
        '<div class="contenedor logros">' +
        '  <header><h1>Logros</h1><p class="texto-suave"><strong>' + conseguidos + ' de ' + NG.Logros.length + '</strong> desbloqueados · Rango actual: <strong>' + r.nombre + '</strong> (' + r.total + ' puntos)</p>' +
        '  <div class="medidor"><div class="medidor-pista" role="meter" aria-label="Logros conseguidos" aria-valuemin="0" aria-valuemax="' + NG.Logros.length + '" aria-valuenow="' + conseguidos + '"><div class="medidor-relleno" style="width:' + Math.round(100 * conseguidos / NG.Logros.length) + '%"></div></div></div></header>' +
        '  <ul class="logros-rejilla">' + NG.Logros.map((l) => {
          const fecha = prog.logros[l.id];
          return '<li class="logro' + (fecha ? ' conseguido' : '') + '"><span class="logro-medalla">' + UI().icono(fecha ? l.icono : 'candado') + '</span>' +
            '<div><strong>' + UI().escapar(l.nombre) + '</strong><p>' + UI().escapar(l.descripcion) + '</p>' + (fecha ? '<small>Conseguido el ' + fecha.split('-').reverse().join('/') + '</small>' : '<small>Pendiente</small>') + '</div></li>';
        }).join('') + '</ul>' +
        '  <nav class="fila centrado"></nav>' +
        '</div>';
      const nav = cont.querySelector('nav');
      nav.appendChild(UI().boton({ texto: 'Mapa de campaña', icono: 'mapa', clase: 'btn-primario', onClick: () => app.ir('mapa') }));
      nav.appendChild(UI().boton({ texto: 'Menú principal', icono: 'atras', clase: 'btn-fantasma', onClick: () => app.ir('menu') }));
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
