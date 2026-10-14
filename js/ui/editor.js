/* =====================================================================
 * NEGOCIA · ui/editor.js — editor de paquetes (ofertas)
 * Un grupo de opciones por variable con tus puntos en cada opción
 * (hoja de puntos, como en los ejercicios de Harvard PON) y un medidor
 * "Valor para ti" que sitúa la oferta frente a tu BATNA, tu reserva y
 * tu objetivo: la ZOPA se ve, no se recita.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;
  let contador = 0;

  /*
   * o: { esc, hoja (puntos por opción), inicial (paquete), referencia (su propuesta),
   *      marcas: {batna, reserva, objetivo}, compacto, alCambiar(paquete, valor), titulo }
   */
  function crear(o) {
    const id = 'ed' + (++contador);
    const esc = o.esc;
    let hoja = o.hoja;
    let paquete = (o.inicial || esc.statusQuo).slice();
    let referencia = o.referencia ? o.referencia.slice() : null;
    const raizEd = UI().el('div', { class: 'editor' + (o.compacto ? ' compacto' : '') });

    const valor = (pk) => Math.round(pk.reduce((s, k, i) => s + hoja[i][k], 0));
    const pintar = () => {
      raizEd.innerHTML = '';
      if (o.titulo) raizEd.appendChild(UI().el('div', { class: 'editor-titulo', html: o.titulo }));
      esc.variables.forEach((v, i) => {
        const fs = UI().el('fieldset', { class: 'segmentado editor-variable' });
        const max = Math.max.apply(null, hoja[i]);
        fs.innerHTML = '<legend>' + UI().icono(v.icono || 'oferta', 'icono-en-linea') + ' ' + UI().escapar(v.nombre) +
          '<span class="peso-propio" title="Cuánto pesa esta variable para ti">' + '<i style="width:' + Math.round(max) + '%"></i></span><small class="texto-tenue">hasta ' + Math.round(max) + ' pts</small></legend>';
        v.opciones.forEach((op, k) => {
          const suya = referencia && referencia[i] === k;
          const lab = UI().el('label', { class: 'opcion-seg', title: suya ? 'Lo que proponen ellos' : null });
          lab.innerHTML = '<input type="radio" name="' + id + '-' + v.id + '" value="' + k + '"' + (paquete[i] === k ? ' checked' : '') + ' aria-label="' + UI().escapar(v.nombre + ': ' + op + ', ' + Math.round(hoja[i][k]) + ' puntos para ti' + (suya ? ', su propuesta' : '')) + '">' +
            '<span>' + UI().escapar(op) + '<small>' + (Math.round(hoja[i][k] * 10) / 10) + ' pts</small></span>' + (suya ? '<i class="marca-suya" aria-hidden="true"></i>' : '');
          lab.querySelector('input').addEventListener('change', () => {
            paquete[i] = k;
            actualizarValor();
            NG.Sonido.reproducir('seleccion');
            if (o.alCambiar) o.alCambiar(paquete.slice(), valor(paquete));
          });
          fs.appendChild(lab);
        });
        raizEd.appendChild(fs);
      });
      raizEd.appendChild(UI().el('div', { class: 'valor-para-ti' }));
      actualizarValor();
    };

    function actualizarValor() {
      const v = valor(paquete);
      const caja = raizEd.querySelector('.valor-para-ti');
      if (!caja) return;
      const m = o.marcas || {};
      const marca = (x, clase, txt) => (typeof x === 'number' ? '<i class="marca ' + clase + '" style="left:' + x + '%" title="' + txt + ': ' + x + '"><b>' + txt + '</b></i>' : '');
      let estado = '';
      if (typeof m.batna === 'number' && v < m.batna) estado = '<span class="etiqueta coral">Por debajo de tu BATNA</span>';
      else if (typeof m.reserva === 'number' && v < m.reserva) estado = '<span class="etiqueta coral">Por debajo de tu reserva</span>';
      else if (typeof m.objetivo === 'number' && v >= m.objetivo) estado = '<span class="etiqueta turquesa">Alcanza tu objetivo</span>';
      caja.innerHTML = '<div class="fila entre"><span class="vpt-etiqueta">Valor para ti</span><span class="vpt-numero"><b>' + v + '</b> / 100 pts</span></div>' +
        '<div class="vpt-pista" role="meter" aria-label="Valor para ti" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + v + '"><div class="vpt-relleno" style="width:' + v + '%"></div>' +
        marca(m.batna, 'batna', 'BATNA') + marca(m.reserva, 'reserva', 'Reserva') + marca(m.objetivo, 'objetivo', 'Objetivo') + '</div>' +
        (estado ? '<div class="vpt-estado">' + estado + '</div>' : '');
    }

    pintar();
    return {
      el: raizEd,
      paquete: () => paquete.slice(),
      valor: () => valor(paquete),
      fijar(pk) { paquete = pk.slice(); pintar(); },
      referencia(pk) { referencia = pk ? pk.slice() : null; pintar(); },
      hoja(h) { hoja = h; pintar(); },
      marcas(m) { o.marcas = m; actualizarValor(); }
    };
  }

  /* Hoja de puntos del jugador a partir del perfil compilado (antes de que exista partida). */
  function hojaDe(esc) {
    return esc.variables.map((v, i) => v.opciones.map((_, k) => Math.round(1000 * esc.perfilJ.pesos[i] * esc.perfilJ.u[i][k]) / 10));
  }

  NG.Editor = { crear, hojaDe };
})(typeof window !== 'undefined' ? window : globalThis);
