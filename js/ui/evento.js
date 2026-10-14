/* =====================================================================
 * NEGOCIA · ui/evento.js — imprevistos con temporizador
 * El teléfono vibra, entra un mensaje, el asesor susurra… El jugador
 * decide con información parcial y, a veces, con cuenta atrás.
 * El temporizador se puede ampliar o desactivar en Ajustes (WCAG 2.2.1).
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;

  const ICONO = { movil: 'movil', mensaje: 'mensaje', llamada: 'telefono', telefono: 'telefono', puerta: 'puerta', asesor: 'persona', mediadora: 'personas', pregunta: 'pregunta', aviso: 'rayo', noticia: 'info' };
  const SONIDO = { movil: 'vibracion', mensaje: 'notificacion', llamada: 'telefono', telefono: 'telefono', puerta: 'puerta', asesor: 'notificacion', mediadora: 'notificacion', pregunta: 'notificacion', aviso: 'alarma', noticia: 'notificacion' };

  /*
   * mostrar(marco, escena, vista, o) → Promise<idOpción>
   *   o: { factor (temporizador: 1, 2 o 0 = sin límite), retrato (svg opcional), automatica (id para la partida modelo), comentario }
   */
  function mostrar(marco, escena, vista, o) {
    o = o || {};
    return new Promise((resolver) => {
      const tipo = vista.tipo || 'aviso';
      NG.Sonido.reproducir(SONIDO[tipo] || 'notificacion');
      if (tipo === 'movil' && escena) escena.vibrarMovil();
      if (escena) NG.Efectos.sacudir(escena.el);
      const total = (vista.temporizador || 0) * (o.factor === undefined ? 1 : o.factor);
      const capa = UI().el('div', { class: 'evento-capa', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'evento-titulo', 'aria-describedby': 'evento-texto' });
      const anillo = total ? '<div class="evento-reloj" aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="fondo"/><circle cx="22" cy="22" r="19" class="progreso" style="stroke-dasharray:119.4;stroke-dashoffset:0"/></svg><b>' + Math.ceil(total) + '</b></div>' : '';
      capa.innerHTML = '<div class="evento-tarjeta tipo-' + tipo + '">' +
        '<div class="evento-cabecera"><div class="evento-icono">' + (o.retrato || UI().icono(ICONO[tipo] || 'rayo')) + '</div>' +
        '<div><span class="etiqueta ambar">Imprevisto</span><h2 id="evento-titulo">' + UI().escapar(vista.titulo) + '</h2></div>' + anillo + '</div>' +
        '<p id="evento-texto" class="evento-texto">' + UI().escapar(vista.texto) + '</p>' +
        (total ? '<p class="texto-tenue evento-nota">' + UI().icono('reloj', 'icono-en-linea') + ' Si se agota el tiempo, la situación decidirá por ti.</p>' : '') +
        '<div class="evento-opciones"></div>' + (o.comentario ? '<div class="comentario-modelo">' + UI().icono('libro', 'icono-en-linea') + ' ' + UI().escapar(o.comentario) + '</div>' : '') + '</div>';
      const opc = capa.querySelector('.evento-opciones');
      let terminado = false, intervalo = null;
      const elegir = (id, porTiempo) => {
        if (terminado) return;
        terminado = true;
        if (intervalo) clearInterval(intervalo);
        capa.classList.add('saliendo');
        if (porTiempo) UI().toast({ titulo: 'Se acabó el tiempo', texto: 'La indecisión también es una decisión.', icono: 'reloj' });
        setTimeout(() => { capa.remove(); resolver(id); }, 260);
      };
      vista.opciones.forEach((op, i) => {
        // En la partida modelo solo se puede elegir la opción de la experta
        const b = UI().el('button', { type: 'button', class: 'btn evento-opcion' + (o.automatica === op.id ? ' sugerida' : ''), 'data-sonido': 'clic', disabled: o.automatica && o.automatica !== op.id ? true : null }, '<span class="letra">' + String.fromCharCode(65 + i) + '</span><span>' + UI().escapar(op.texto) + '</span>');
        b.addEventListener('click', () => elegir(op.id));
        opc.appendChild(b);
      });
      marco.appendChild(capa);
      UI().anunciar('Imprevisto: ' + vista.titulo + '. ' + vista.texto);
      setTimeout(() => { const f = opc.querySelector('.sugerida') || opc.querySelector('button'); if (f) f.focus(); }, 120);

      if (total && !o.automatica) {
        const t0 = performance.now();
        let ultimoSeg = Math.ceil(total);
        const circ = capa.querySelector('.progreso');
        const num = capa.querySelector('.evento-reloj b');
        intervalo = setInterval(() => {
          const rest = Math.max(0, total - (performance.now() - t0) / 1000);
          circ.style.strokeDashoffset = (119.4 * (1 - rest / total)).toFixed(1);
          const seg = Math.ceil(rest);
          if (seg !== ultimoSeg) { ultimoSeg = seg; num.textContent = seg; if (seg <= 5 && seg > 0) { NG.Sonido.reproducir('tic'); capa.classList.add('urgente'); } }
          if (rest <= 0) elegir(vista.porDefecto, true);
        }, 100);
      }
    });
  }

  NG.Evento = { mostrar };
})(typeof window !== 'undefined' ? window : globalThis);
