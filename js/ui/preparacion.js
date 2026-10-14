/* =====================================================================
 * NEGOCIA · ui/preparacion.js — Fase 1: preparación
 * Despacho ilustrado con un tablón de corcho donde se clavan los datos
 * descubiertos. Tres pasos: 1) investigar con tiempo limitado,
 * 2) BATNA, punto de reserva y objetivo, 3) oferta de apertura.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;
  const P = () => NG.Preparacion;

  const COLOR_NOTA = { interes: 'nota-amarilla', batna: 'nota-verde', criterio: 'nota-azul', perfil: 'nota-rosa', pista: 'nota-blanca', dato: 'nota-gris' };

  NG.Pantallas.preparacion = {
    titulo: 'Preparación',
    requiereParams: true,
    montar(cont, params, app) {
      const esc = NG.Escenarios.obtener(params.escenario);
      app.titulo('Escenario ' + esc.orden + ' · ' + esc.titulo + ' — Preparación');
      const prep = P().crear(esc);
      const tutorial = NG.Tutorial.activo(esc);
      const pasos = ['Investiga', 'Estrategia'].concat(esc.quienAbre === 'contraparte' || esc.multiparte ? [] : ['Apertura']);
      let paso = 0;

      cont.innerHTML =
        '<div class="contenedor prep">' +
        '  <header class="prep-cabecera"><div><h1>Preparación</h1><p class="texto-suave">Antes de la reunión con ' + UI().escapar(esc.contrapartes.map((c) => c.nombre).join(' y ')) + '.</p></div>' +
        '    <ol class="pasos" aria-label="Pasos de la preparación"></ol>' +
        '    <div class="fichas-tiempo" aria-live="polite"></div></header>' +
        '  <div class="prep-rejilla">' +
        '    <div class="prep-escena"><div class="tablon" aria-hidden="true"></div></div>' +
        '    <aside class="prep-panel panel"><div class="panel-cuerpo"></div></aside>' +
        '  </div>' +
        '  <section class="prep-pizarra panel"><div class="panel-cuerpo"><h2 class="panel-titulo">' + UI().icono('chincheta') + ' Lo que sabes (tu pizarra)</h2><ul class="lista-notas"></ul></div></section>' +
        '</div>';
      const escena = NG.Escenas.montar(cont.querySelector('.prep-escena'), 'despacho', { personajes: [] });
      cont.querySelector('.prep-escena').appendChild(cont.querySelector('.tablon'));
      const panel = cont.querySelector('.prep-panel .panel-cuerpo');

      /* ---------- Cabecera: pasos y tiempo ---------- */
      function pintarPasos() {
        cont.querySelector('.pasos').innerHTML = pasos.map((n, i) => '<li class="' + (i === paso ? 'actual' : i < paso ? 'hecho' : '') + '"' + (i === paso ? ' aria-current="step"' : '') + '><span>' + (i < paso ? UI().icono('check') : i + 1) + '</span>' + n + '</li>').join('');
        const r = P().restantes(prep);
        cont.querySelector('.fichas-tiempo').innerHTML = '<span class="texto-tenue">Tiempo de preparación</span><div class="fichas" role="img" aria-label="' + r + ' de ' + prep.puntos + ' puntos disponibles">' +
          Array.from({ length: prep.puntos }, (_, i) => '<i class="' + (i < r ? 'libre' : '') + '"></i>').join('') + '</div><strong>' + r + '/' + prep.puntos + '</strong>';
      }

      /* ---------- Tablón y lista de notas ---------- */
      function pintarNotas(nueva) {
        const tablon = cont.querySelector('.tablon');
        tablon.innerHTML = prep.notas.map((n, i) => '<div class="nota ' + (COLOR_NOTA[n.tipo] || 'nota-blanca') + (nueva && n.id === nueva ? ' clavandose' : '') + '" style="--giro:' + (((i * 37) % 9) - 4) + 'deg"><i class="chincheta"></i><strong>' + UI().escapar(n.titulo) + '</strong><span>' + UI().escapar(n.texto) + '</span></div>').join('');
        cont.querySelector('.lista-notas').innerHTML = prep.notas.map((n) => '<li class="' + (COLOR_NOTA[n.tipo] || '') + (nueva && n.id === nueva ? ' nueva' : '') + '"><strong>' + UI().escapar(n.titulo) + '</strong> ' + UI().escapar(n.texto) + '</li>').join('');
      }

      /* ---------- Paso 1: investigar ---------- */
      function pasoInvestigar() {
        panel.innerHTML = '<h2 class="panel-titulo">' + UI().icono('carpeta') + ' Carpetas de investigación</h2><p class="texto-tenue">Cada carpeta cuesta tiempo. No puedes abrirlas todas.</p><div class="carpetas"></div>';
        const lista = panel.querySelector('.carpetas');
        P().fichas(prep, esc).forEach((f) => {
          const b = UI().el('button', { type: 'button', class: 'carpeta-ficha' + (f.hecha ? ' hecha' : ''), disabled: !f.asequible && !f.hecha, 'aria-pressed': f.hecha ? 'true' : 'false' });
          b.innerHTML = '<span class="carpeta-icono">' + UI().icono(f.hecha ? 'check' : f.icono) + '</span><span class="carpeta-texto"><strong>' + UI().escapar(f.titulo) + '</strong><small>' + UI().escapar(f.descripcion || '') + '</small></span>' +
            '<span class="coste" aria-label="Cuesta ' + f.coste + ' puntos">' + Array.from({ length: f.coste }, () => '<i></i>').join('') + '</span>';
          if (!f.hecha) b.addEventListener('click', () => {
            const r = P().investigar(prep, esc, f.id);
            if (!r.ok) { UI().toast({ titulo: r.motivo, icono: 'reloj' }); return; }
            NG.Sonido.reproducir('subida');
            pintarNotas(r.notas.length ? r.notas[r.notas.length - 1].id : null);
            r.notas.forEach((n) => UI().anunciar('Anotado en el tablón: ' + n.titulo + '. ' + n.texto));
            pintarPasos(); pasoInvestigar();
          });
          lista.appendChild(b);
        });
        const pie = UI().el('div', { class: 'prep-pie' });
        pie.appendChild(UI().boton({ texto: 'Siguiente: tu estrategia', iconoFinal: 'flecha', clase: 'btn-primario btn-bloque', onClick: () => { paso = 1; mostrarPaso(); } }));
        panel.appendChild(pie);
        if (tutorial) setTimeout(() => NG.Tutorial.mostrar('prep-investiga', lista), 500);
      }

      /* ---------- Paso 2: BATNA, reserva y objetivo ---------- */
      function pasoEstrategia() {
        const vis = P().batnasVisibles(prep, esc);
        if (!prep.batnaId || !vis.some((b) => b.id === prep.batnaId)) {
          const s = P().sugerencias(prep, esc);
          P().definir(prep, esc, { batnaId: s.batnaId, reserva: s.reserva, objetivo: s.objetivo });
        }
        panel.innerHTML = '<h2 class="panel-titulo">' + UI().icono('escudo') + ' Tu BATNA</h2><p class="texto-tenue">¿Qué harás si no hay acuerdo? Elige tu mejor alternativa.</p>' +
          '<div class="batnas" role="radiogroup" aria-label="Tu BATNA"></div>' +
          '<h2 class="panel-titulo">' + UI().icono('diana') + ' Reserva y objetivo</h2>' +
          '<div class="deslizadores"></div><div class="escala-zopa" aria-hidden="true"></div><div class="prep-errores" role="alert"></div>';
        const cajaB = panel.querySelector('.batnas');
        vis.forEach((b) => {
          const lab = UI().el('label', { class: 'batna-opcion' + (prep.batnaId === b.id ? ' elegida' : '') });
          lab.innerHTML = '<input type="radio" name="batna" value="' + b.id + '"' + (prep.batnaId === b.id ? ' checked' : '') + '>' +
            '<span class="batna-texto">' + UI().escapar(b.texto) + '</span><span class="batna-valor"><b>' + b.valorMostrado + '</b> pts' +
            (b.verificada ? '' : '<em class="etiqueta coral">sin verificar</em>') + '</span>';
          lab.querySelector('input').addEventListener('change', () => {
            P().definir(prep, esc, { batnaId: b.id, reserva: b.valorMostrado, objetivo: Math.max(prep.objetivo, b.valorMostrado + 15) });
            NG.Sonido.reproducir('seleccion');
            pasoEstrategia();
          });
          cajaB.appendChild(lab);
        });
        const des = panel.querySelector('.deslizadores');
        const fila = (nombre, etiqueta, ayuda, valor) => '<label class="deslizador"><span class="fila entre"><strong>' + etiqueta + '</strong><output>' + valor + ' pts</output></span>' +
          '<input type="range" min="0" max="100" step="1" name="' + nombre + '" value="' + valor + '" aria-describedby="ayuda-' + nombre + '"><small id="ayuda-' + nombre + '" class="texto-tenue">' + ayuda + '</small></label>';
        des.innerHTML = fila('reserva', 'Punto de reserva', 'Lo mínimo que aceptarás. Por debajo, te levantas.', prep.reserva) +
          fila('objetivo', 'Objetivo', 'A lo que aspiras. Ambicioso, pero realista.', prep.objetivo);
        const b = vis.find((x) => x.id === prep.batnaId);
        const escala = () => {
          panel.querySelector('.escala-zopa').innerHTML = '<div class="escala"><i class="tramo" style="left:' + prep.reserva + '%;width:' + Math.max(0, prep.objetivo - prep.reserva) + '%"></i>' +
            '<i class="hito batna" style="left:' + (b ? b.valorMostrado : 0) + '%"><b>BATNA</b></i><i class="hito reserva" style="left:' + prep.reserva + '%"><b>Reserva</b></i><i class="hito objetivo" style="left:' + prep.objetivo + '%"><b>Objetivo</b></i></div>' +
            '<p class="texto-tenue">Por debajo de tu BATNA, mejor no firmar. Entre tu reserva y tu objetivo está tu margen de negociación.</p>';
          const v = P().validar(prep, esc);
          panel.querySelector('.prep-errores').innerHTML = v.errores.filter((e) => !/apertura/.test(e)).map((e) => '<p class="error">' + UI().icono('info', 'icono-en-linea') + ' ' + e + '</p>').join('');
          if (b && prep.reserva < b.valorMostrado - 8) panel.querySelector('.prep-errores').innerHTML += '<p class="aviso">' + UI().icono('info', 'icono-en-linea') + ' Tu reserva está muy por debajo de tu BATNA: podrías aceptar acuerdos peores que no tener acuerdo.</p>';
        };
        des.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
          if (tutorial) NG.Tutorial.mostrar('prep-reserva', des);
          P().definir(prep, esc, { [inp.name]: +inp.value });
          inp.closest('.deslizador').querySelector('output').textContent = inp.value + ' pts';
          escala();
        }));
        escala();
        const pie = UI().el('div', { class: 'prep-pie fila' });
        pie.appendChild(UI().boton({ texto: 'Investigar', icono: 'atras', clase: 'btn-fantasma', onClick: () => { paso = 0; mostrarPaso(); } }));
        const ultimo = pasos.length === 2;
        pie.appendChild(UI().boton({ texto: ultimo ? 'Ir a la reunión' : 'Siguiente: apertura', iconoFinal: 'flecha', clase: 'btn-primario', onClick: () => {
          const v = P().validar(prep, esc);
          const errores = v.errores.filter((e) => ultimo || !/apertura/.test(e));
          if (errores.length) { UI().toast({ titulo: 'Falta algo', texto: errores[0], icono: 'info' }); return; }
          if (ultimo) irAReunion(); else { paso = 2; mostrarPaso(); }
        } }));
        panel.appendChild(pie);
        if (tutorial) { NG.Tutorial.mostrar('prep-batna', cajaB); }
      }

      /* ---------- Paso 3: apertura ---------- */
      let editor = null;
      function pasoApertura() {
        const b = P().batnasVisibles(prep, esc).find((x) => x.id === prep.batnaId);
        panel.innerHTML = '<h2 class="panel-titulo">' + UI().icono('bandera') + ' Tu oferta de apertura</h2><p class="texto-tenue">Abrirás tú: esta será tu primera oferta (podrás ajustarla en la reunión).</p>';
        if (!prep.apertura) {
          // Sugerencia inicial: la mejor opción para ti en tu variable principal, el resto en el statu quo
          const ap = esc.statusQuo.slice();
          P().definir(prep, esc, { apertura: ap });
        }
        editor = NG.Editor.crear({ esc, hoja: NG.Editor.hojaDe(esc), inicial: prep.apertura, marcas: { batna: b ? b.valorMostrado : null, reserva: prep.reserva, objetivo: prep.objetivo }, alCambiar: (pk) => P().definir(prep, esc, { apertura: pk }) });
        panel.appendChild(editor.el);
        const crit = prep.revelado.criterios.map((id) => (esc.criterios || []).find((c) => c.id === id)).filter(Boolean);
        if (crit.length) panel.appendChild(UI().el('p', { class: 'tarjeta criterio-disponible', html: UI().icono('indice', 'icono-en-linea') + ' Tienes un criterio objetivo para justificar tu oferta: <strong>' + UI().escapar(crit[0].nombre) + '</strong>. Podrás citarlo al enviarla.' }));
        const pie = UI().el('div', { class: 'prep-pie fila' });
        pie.appendChild(UI().boton({ texto: 'Estrategia', icono: 'atras', clase: 'btn-fantasma', onClick: () => { paso = 1; mostrarPaso(); } }));
        pie.appendChild(UI().boton({ texto: 'Ir a la reunión', iconoFinal: 'flecha', clase: 'btn-primario', onClick: irAReunion }));
        panel.appendChild(pie);
        if (tutorial) NG.Tutorial.mostrar('prep-apertura', editor.el);
      }

      function irAReunion() {
        const v = P().validar(prep, esc);
        if (!v.ok) { UI().toast({ titulo: 'Falta algo', texto: v.errores[0], icono: 'info' }); return; }
        NG.Tutorial.cerrar();
        app.ir('negociacion', { escenario: esc.id, prep });
      }

      function mostrarPaso() {
        NG.Tutorial.cerrar();
        pintarPasos();
        [pasoInvestigar, pasoEstrategia, pasoApertura][paso]();
        const h = panel.querySelector('h2');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }

      pintarNotas();
      mostrarPaso();
      return { desmontar() { NG.Tutorial.cerrar(); escena.destruir(); } };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
