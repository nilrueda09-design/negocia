/* =====================================================================
 * NEGOCIA · ui/negociacion.js — Fase 2: negociación por turnos
 * Escena con personajes, HUD de confianza y paciencia, globo de diálogo
 * con efecto de escritura, "mesa" (su propuesta frente a la tuya),
 * pizarra de pistas, acta y panel de acciones.
 * La UI solo REPRODUCE la cola de salidas del motor: nunca decide.
 * También sirve para la partida modelo comentada (params.modelo).
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;
  const M = () => NG.Motor;
  const A = () => NG.Analisis;
  const COLOR_NOTA = { interes: 'nota-amarilla', batna: 'nota-verde', criterio: 'nota-azul', perfil: 'nota-rosa', pista: 'nota-blanca', dato: 'nota-gris' };

  NG.Pantallas.negociacion = {
    titulo: 'Negociación',
    requiereParams: true,
    montar(cont, params, app) {
      const esc = NG.Escenarios.obtener(params.escenario);
      const modelo = !!params.modelo;
      let prep = params.prep;
      if (modelo || !prep) {
        prep = NG.Preparacion.crear(esc);
        (esc.partidaModelo.preparacion.investigar || []).forEach((id) => NG.Preparacion.investigar(prep, esc, id));
        NG.Preparacion.definir(prep, esc, esc.partidaModelo.preparacion.definir);
      }
      const tecnicas = modelo ? { meso: esc.orden > 1, ofertaFinal: esc.orden > 2, bilateral: !!esc.multiparte } : NG.Progreso.tecnicas(app.progreso);
      const p = M().crearPartida(esc, prep, { semilla: modelo ? esc.partidaModelo.semilla : NG.Util.semillaAleatoria(), tecnicas });
      const tutorial = !modelo && NG.Tutorial.activo(esc);
      app.titulo((modelo ? 'Partida modelo · ' : 'Escenario ' + esc.orden + ' · ') + esc.titulo);
      if (!modelo) app.salidaProtegida = true;

      /* ---------- Personajes ---------- */
      const personajes = (esc.mediadora ? [Object.assign({ id: 'mediadora' }, esc.mediadora)] : [])
        .concat(esc.contrapartes.map((c) => ({ id: c.id, nombre: c.nombre, avatar: c.avatar })));
      const nombres = { jugador: 'Tú', mediadora: esc.mediadora ? esc.mediadora.nombre : 'Mediadora', asesor: esc.asesor ? esc.asesor.nombre : 'Tu asesor', cfo: 'Director financiero', narrador: '' };
      esc.contrapartes.forEach((c) => { nombres[c.id] = c.nombre; });
      const indice = (id) => p.contrapartes.findIndex((c) => c.id === id);

      /* ---------- Maquetación ---------- */
      cont.innerHTML =
        // Orden del DOM = orden en móvil (las acciones justo bajo la escena); en escritorio,
        // la rejilla coloca las acciones en una columna lateral fija.
        '<div class="neg' + (esc.multiparte ? ' multiparte' : '') + '">' +
        '  <div class="neg-hud" aria-label="Estado de la negociación"><div class="neg-turno"><span>Turno</span><b>0</b></div><div class="neg-partes"></div></div>' +
        '  <div class="escena-marco"><div class="escena-dialogo" aria-hidden="true"></div></div>' +
        '  <div class="neg-aviso" role="status" hidden></div>' +
        '  <aside class="neg-acciones panel" aria-label="Tus acciones"><div class="panel-cuerpo"></div></aside>' +
        '  <div class="neg-inferior">' +
        '    <section class="panel neg-mesa" aria-labelledby="t-mesa"><div class="panel-cuerpo"><h2 id="t-mesa" class="panel-titulo">' + UI().icono('oferta') + ' La mesa</h2><div class="mesa-tabla"></div></div></section>' +
        '    <section class="panel neg-pizarra" aria-labelledby="t-piz"><div class="panel-cuerpo"><h2 id="t-piz" class="panel-titulo">' + UI().icono('chincheta') + ' Pizarra</h2><ul class="lista-notas"></ul></div></section>' +
        '  </div>' +
        '  <details class="panel neg-acta"><summary>' + UI().icono('libro', 'icono-en-linea') + ' Acta de la reunión</summary><ol class="acta"></ol></details>' +
        '</div>';
      const marco = cont.querySelector('.escena-marco');
      const escena = NG.Escenas.montar(marco, esc.escena.negociacion, { personajes });
      marco.insertBefore(escena.el, marco.firstChild);
      const cajaDialogo = cont.querySelector('.escena-dialogo');
      const panelA = cont.querySelector('.neg-acciones .panel-cuerpo');
      const actaEl = cont.querySelector('.acta');

      /* ---------- HUD de las contrapartes ---------- */
      const medidores = {};
      const mostrado = {};
      p.contrapartes.forEach((c, ci) => {
        const d = esc.contrapartes[ci];
        const caja = UI().el('div', { class: 'parte', 'data-id': c.id });
        caja.innerHTML = '<div class="parte-cabecera">' + NG.Avatar.retrato(d.avatar, { id: 'hud-' + c.id, etiqueta: d.nombre, fondo: '#22305a', clase: 'mini' }) +
          '<div><strong>' + UI().escapar(d.nombre) + '</strong><span class="parte-perfil"></span></div><span class="parte-estado"></span></div>';
        const mc = UI().medidor({ etiqueta: 'Confianza', icono: 'corazon', clase: 'confianza', alFijar: (n, v) => n.classList.toggle('baja', v < 35) });
        const mp = UI().medidor({ etiqueta: 'Paciencia', icono: 'reloj', clase: 'paciencia', alFijar: (n, v, max) => n.classList.toggle('critica', v / max <= 0.25) });
        caja.appendChild(mc.el); caja.appendChild(mp.el);
        cont.querySelector('.neg-partes').appendChild(caja);
        medidores[c.id] = { mc, mp, caja };
        mostrado[c.id] = { C: c.C, P: c.P };
        mc.fijar(c.C, 100); mp.fijar(c.P, c.P0, c.P + '/' + c.P0);
      });
      function pintarPerfiles() {
        p.contrapartes.forEach((c, ci) => {
          const conocido = p.revelado.personalidad.includes(c.id);
          const pers = NG.Personalidades[esc.contrapartes[ci].personalidad];
          medidores[c.id].caja.querySelector('.parte-perfil').innerHTML = conocido ? '<span class="etiqueta azul">' + pers.nombre + '</span>' : '<span class="etiqueta" title="Investiga su perfil o deduce su estilo por sus reacciones">Perfil: ?</span>';
          const est = medidores[c.id].caja.querySelector('.parte-estado');
          est.innerHTML = c.retirado ? '<span class="etiqueta coral">Se ha ido</span>' : c.aliado ? '<span class="etiqueta turquesa">Aliado</span>' : (p.bloque && p.bloque.includes(c.id)) ? '<span class="etiqueta coral">En bloque</span>' : c.haAceptado && esc.multiparte ? '<span class="etiqueta turquesa">Acepta</span>' : '';
        });
      }

      /* ---------- Estado visual de los personajes ---------- */
      const tokens = {};
      function visual(id, reaccion) {
        const ci = indice(id);
        if (ci < 0) return;
        const base = M().estadoParaVisual(p, ci);
        const est = NG.EstadoVisual.derivar(reaccion !== undefined ? Object.assign({}, base, { reaccion }) : base);
        escena.estado(id, est);
        const tk = (tokens[id] = (tokens[id] || 0) + 1);
        // Tras la reacción puntual, vuelve a su estado sostenido
        setTimeout(() => { if (tokens[id] === tk) escena.estado(id, Object.assign(NG.EstadoVisual.derivar(Object.assign({}, M().estadoParaVisual(p, ci), { reaccion: 'neutral' })), { gesto: null })); }, 3400);
      }
      function relojMesa() {
        const act = p.contrapartes.filter((c) => !c.retirado);
        if (!act.length) return;
        const c = act.reduce((a, b) => (b.P / b.P0 < a.P / a.P0 ? b : a));
        escena.reloj(Math.max(0, c.P), c.P0);
      }
      function sincronizar() {
        p.contrapartes.forEach((c) => {
          mostrado[c.id] = { C: c.C, P: Math.max(0, c.P) };
          medidores[c.id].mc.fijar(c.C, 100);
          medidores[c.id].mp.fijar(Math.max(0, c.P), c.P0, Math.max(0, c.P) + '/' + c.P0);
        });
        cont.querySelector('.neg-turno b').textContent = p.turno;
        relojMesa(); pintarPerfiles(); pintarMesa(); pintarPizarra(); pintarAviso();
        escena.coalicion(!!p.bloque);
      }

      /* ---------- Mesa: su propuesta frente a la tuya ---------- */
      let ultimaMesa = '';
      function pintarMesa() {
        const obs = M().observacion(p);
        const suya = obs.ofertaEnMesa, mia = obs.misOfertas.length ? obs.misOfertas[obs.misOfertas.length - 1] : null;
        const celda = (pk, i) => (pk ? '<td>' + UI().escapar(esc.variables[i].opciones[pk[i]]) + '<small>' + Math.round(obs.hoja[i][pk[i]]) + ' pts</small></td>' : '<td class="vacia">—</td>');
        let html = '<table class="tabla-mesa"><thead><tr><th scope="col">Variable</th>';
        if (esc.multiparte) {
          html += '<th scope="col">Tu última oferta</th>' + p.contrapartes.map((c) => '<th scope="col">Exige ' + UI().escapar(nombres[c.id].split(' ')[0]) + '</th>').join('') + '</tr></thead><tbody>';
          esc.variables.forEach((v, i) => {
            html += '<tr><th scope="row">' + UI().icono(v.icono || 'oferta', 'icono-en-linea') + ' ' + UI().escapar(v.nombre) + '</th>' + celda(mia && mia.paquete, i);
            p.contrapartes.forEach((c) => { html += c.exigencia && c.exigencia.variable === v.id ? '<td class="exige">' + UI().escapar(v.opciones[c.exigencia.opcion]) + '</td>' : '<td class="vacia">·</td>'; });
            html += '</tr>';
          });
          html += '</tbody><tfoot><tr><th scope="row">Valor para ti</th><td><b>' + (mia ? Math.round(mia.uj) : '—') + '</b></td>' + p.contrapartes.map((c) => '<td>' + (c.haAceptado ? '<span class="etiqueta turquesa">Sí</span>' : c.exigencia ? '<span class="etiqueta">No</span>' : '') + '</td>').join('') + '</tr></tfoot></table>';
        } else {
          html += '<th scope="col">Su propuesta</th><th scope="col">Tu última oferta</th></tr></thead><tbody>';
          esc.variables.forEach((v, i) => {
            const distinto = suya && mia && suya.paquete[i] !== mia.paquete[i];
            html += '<tr class="' + (distinto ? 'distinto' : '') + '"><th scope="row">' + UI().icono(v.icono || 'oferta', 'icono-en-linea') + ' ' + UI().escapar(v.nombre) + '</th>' + celda(suya && suya.paquete, i) + celda(mia && mia.paquete, i) + '</tr>';
          });
          html += '</tbody><tfoot><tr><th scope="row">Valor para ti</th><td><b>' + (suya ? Math.round(suya.uj) : '—') + '</b></td><td><b>' + (mia ? Math.round(mia.uj) : '—') + '</b></td></tr></tfoot></table>';
        }
        html += '<p class="texto-tenue mesa-ref">Tu BATNA: <b>' + p.jugador.batnaMostrada + '</b> · Reserva: <b>' + p.jugador.reserva + '</b> · Objetivo: <b>' + p.jugador.objetivo + '</b></p>';
        if (html !== ultimaMesa) {
          cont.querySelector('.mesa-tabla').innerHTML = html;
          ultimaMesa = html;
        }
      }

      /* ---------- Pizarra ---------- */
      let notasPintadas = 0;
      function pintarPizarra() {
        const ul = cont.querySelector('.neg-pizarra .lista-notas');
        if (p.pizarra.length === notasPintadas) return;
        ul.innerHTML = p.pizarra.map((n, i) => '<li class="' + (COLOR_NOTA[n.tipo] || '') + (i >= notasPintadas && notasPintadas > 0 ? ' nueva' : '') + '"><strong>' + UI().escapar(n.titulo) + '</strong> ' + UI().escapar(n.texto) + '</li>').join('') || '<li class="texto-tenue">Aún no hay anotaciones.</li>';
        notasPintadas = p.pizarra.length;
      }
      function anotarActa(quien, texto, clase) {
        const li = UI().el('li', { class: clase || '' }, (quien ? '<strong>' + UI().escapar(quien) + ':</strong> ' : '') + UI().escapar(texto));
        actaEl.appendChild(li);
      }
      function pintarAviso() {
        const av = cont.querySelector('.neg-aviso');
        const ult = p.contrapartes.some((c) => !c.retirado && c.ultimatum);
        const fin = p.jugador.ofertaFinalPendiente;
        if (p.fase !== 'negociacion' || (!ult && !fin)) { av.hidden = true; return; }
        av.hidden = false;
        av.innerHTML = UI().icono('reloj', 'icono-en-linea') + ' ' + (ult ? '<strong>Última oportunidad:</strong> acepta, haz una última oferta o levántate.' : '<strong>Tu oferta final fue rechazada.</strong> Si sigues negociando perderás credibilidad.');
      }

      /* ---------- Globo de diálogo con efecto de escritura ---------- */
      let saltar = false;
      const espera = (ms) => new Promise((r) => setTimeout(r, saltar ? Math.min(ms, 40) : ms));
      function bocadillo(quien, texto, gesto, esIA) {
        return new Promise((resolver) => {
          cajaDialogo.innerHTML = '';
          const esJugador = quien === 'jugador';
          const b = UI().el('div', { class: 'bocadillo' + (esJugador ? ' jugador' : '') });
          b.innerHTML = '<span class="quien">' + UI().escapar(nombres[quien] || quien) + (esIA && !esJugador ? ' <span class="marca-ia" title="Frase redactada por IA a partir de la decisión del motor">IA</span>' : '') + '</span><span class="texto"></span>' + (gesto ? '<span class="gesto">' + UI().escapar(gesto) + '</span>' : '');
          if (!esJugador && escena.avatares[quien]) {
            const a = escena.ancla(quien);
            if (esc.multiparte) {
              // Mesa concurrida: el globo va encima de la cabeza para no tapar a los demás
              b.classList.add('arriba');
              b.style.left = Math.min(67, Math.max(1, a.x - 16)) + '%';
              b.style.bottom = (100 - a.y + 2) + '%';
            } else {
              if (a.lado === 'derecha') { b.style.left = (a.x + 6) + '%'; } else { b.style.right = (100 - a.x + 6) + '%'; b.classList.add('cola-derecha'); }
              b.style.top = Math.max(2, a.y - 4) + '%';
            }
          } else if (esJugador) { b.style.right = '3%'; b.style.bottom = '6%'; }
          else { b.style.left = '4%'; b.style.top = '6%'; b.classList.add('sistema'); }
          cajaDialogo.appendChild(b);
          const t = b.querySelector('.texto');
          const vel = saltar ? 0 : app.velocidadTexto() * (esJugador ? 0.5 : 1);
          UI().anunciar((nombres[quien] || '') + ': ' + texto + (gesto ? ' (' + gesto + ')' : ''));
          anotarActa(nombres[quien] || quien, texto + (gesto ? ' — ' + gesto : ''), esJugador ? 'acta-jugador' : '');
          const lectura = () => espera(Math.min(2600, 700 + texto.length * (esJugador ? 6 : 14))).then(resolver);
          if (!vel) { t.textContent = texto; lectura(); return; }
          let i = 0;
          const paso = () => {
            if (saltar) { t.textContent = texto; lectura(); return; }
            i += 1;
            t.textContent = texto.slice(0, i);
            if (i % 2 === 0 && !esJugador) NG.Sonido.reproducir('tecla');
            if (i < texto.length) setTimeout(paso, vel); else lectura();
          };
          paso();
        });
      }

      /* ---------- Reproducción de la cola de salidas del motor ---------- */
      let ocupado = false;
      let primeraContraoferta = true;
      async function procesar(s) {
        switch (s.tipo) {
          case 'dialogo': await bocadillo(s.quien, s.texto, s.gesto, s.ia); break;
          case 'reaccion': visual(s.quien, s.reaccion); if (['acepta', 'reciproca', 'se_abre'].includes(s.reaccion)) NG.Sonido.reproducir('subida'); if (['ofendido', 'llama_farol', 'se_retira'].includes(s.reaccion)) NG.Sonido.reproducir('error'); break;
          case 'delta': {
            const m = mostrado[s.quien];
            if (!m) break;
            if (s.variable === 'confianza') {
              m.C = Math.max(0, Math.min(100, m.C + s.valor));
              medidores[s.quien].mc.fijar(m.C, 100);
              const a = escena.ancla(s.quien);
              NG.Efectos.flotante(escena.hud, a.x, Math.max(4, a.y - 2), NG.Util.conSigno(s.valor) + ' confianza', s.valor > 0 ? 'positivo' : 'negativo');
            } else if (s.variable === 'paciencia') {
              const c = p.contrapartes[indice(s.quien)];
              m.P = Math.max(0, Math.min(c.P0 + 2, m.P + s.valor));
              medidores[s.quien].mp.fijar(m.P, c.P0, m.P + '/' + c.P0);
              if (s.valor < -1 || m.P <= 2) NG.Efectos.flotante(escena.hud, esc.multiparte ? 50 : 21, 70, NG.Util.conSigno(s.valor) + ' paciencia', 'neutro');
            }
            await espera(260);
            break;
          }
          case 'oferta':
            pintarMesa(); NG.Efectos.resaltar(cont.querySelector('.neg-mesa'), 'resaltado');
            if (s.quien !== 'jugador') {
              NG.Sonido.reproducir('notificacion');
              if (tutorial && primeraContraoferta) { primeraContraoferta = false; setTimeout(() => NG.Tutorial.mostrar('neg-contraoferta', cont.querySelector('.neg-mesa')), 300); }
            }
            break;
          case 'pizarra':
            pintarPizarra(); NG.Sonido.reproducir('subida');
            UI().toast({ titulo: 'Nueva anotación en tu pizarra', texto: s.nota.titulo, icono: 'chincheta', duracion: 3200 });
            if (tutorial && (s.nota.tipo === 'interes' || s.nota.tipo === 'pista')) setTimeout(() => NG.Tutorial.mostrar('neg-pista', cont.querySelector('.neg-pizarra')), 400);
            break;
          case 'juicio': {
            const x = 50 + (Math.random() * 20 - 10);
            NG.Efectos.particulas(escena.hud, x, 86, s.juicio === 'acierto' ? 'acierto' : s.juicio === 'error' ? 'error' : 'oro', s.juicio === 'neutral' ? 0 : 10);
            break;
          }
          case 'aviso': anotarActa('', s.texto, 'acta-sistema'); UI().toast({ titulo: s.texto, icono: 'info', duracion: 4200 }); break;
          case 'coalicion':
            escena.coalicion(s.estado === 'bloque');
            if (s.estado === 'bloque') { NG.Sonido.reproducir('error'); UI().toast({ titulo: 'Se ha formado un bloque', texto: 'Las otras partes se coordinan contra tu propuesta.', icono: 'personas' }); }
            if (s.estado === 'roto') { NG.Sonido.reproducir('acierto'); UI().toast({ titulo: 'El bloque se ha roto', icono: 'personas' }); }
            if (s.estado === 'alianza') UI().toast({ titulo: 'Tienes un aliado en la mesa', icono: 'apreton' });
            pintarPerfiles();
            break;
          case 'exigencia': pintarMesa(); break;
          case 'hoja': pintarMesa(); break;
          default: break;
        }
      }
      async function reproducir(S) {
        ocupado = true;
        pintarAcciones('espera');
        for (const s of S) { try { await procesar(s); } catch (e) { console.error(e); } }
        sincronizar();
        ocupado = false;
        saltar = false;
        if (p.fase === 'evento') return manejarEvento();
        if (p.fase === 'fin') return finalizar();
        pintarAcciones(modelo ? 'modelo' : 'menu');
        if (tutorial && p.ofertaEnMesa && p.ofertaEnMesa.uj >= p.jugador.objetivo) NG.Tutorial.mostrar('neg-cierre', panelA.querySelector('[data-accion="aceptar"]'));
      }
      function actuar(accion, opciones) {
        if (ocupado || p.fase !== 'negociacion') return;
        NG.Tutorial.cerrar();
        let S;
        try { S = M().ejecutar(p, accion); } catch (e) { UI().toast({ titulo: 'No es posible', texto: e.message, icono: 'info' }); return; }
        if (iaActiva()) return narrarYReproducir(S, accion, opciones && opciones.texto);
        reproducir(S);
      }

      /* ---------- Modo IA (opcional): el motor decide, Claude pone la voz ---------- */
      const iaActiva = () => !modelo && !!NG.IA && NG.IA.activo && app.progreso.ajustes.modoIA !== false;
      let ultimoErrorIA = 0;
      function errorIA(e, cola) {
        if (Date.now() - ultimoErrorIA < 20000) return;
        ultimoErrorIA = Date.now();
        UI().toast({ titulo: 'La IA no ha respondido', texto: (e && e.message ? e.message + '. ' : '') + (cola || 'Se usan las respuestas clásicas.'), icono: 'info', duracion: 4200 });
      }
      // Muestra ya lo que dice el jugador mientras la IA redacta la respuesta
      async function narrarYReproducir(S, accion, textoJugador) {
        ocupado = true;
        pintarAcciones('espera', null, 'La otra parte responde…');
        const iJ = S.findIndex((s) => s.tipo === 'dialogo' && s.quien === 'jugador');
        const lineaJugador = textoJugador || (iJ >= 0 ? S[iJ].texto : M().describirAccion(p, accion));
        const decs = NG.IA.decisiones(p, S);
        const peticion = decs.length ? NG.IA.narrar(NG.IA.contextoNarracion(p, lineaJugador, decs)).catch((e) => { errorIA(e); return []; }) : Promise.resolve([]);
        await bocadillo('jugador', lineaJugador, iJ >= 0 && !textoJugador ? S[iJ].gesto : null);
        const respuestas = await peticion;
        const resto = NG.IA.aplicarNarracion(S, respuestas, null).filter((s, k, arr) => !(s.tipo === 'dialogo' && s.quien === 'jugador' && k === arr.findIndex((x) => x.tipo === 'dialogo' && x.quien === 'jugador')));
        ocupado = false;
        reproducir(resto);
      }
      async function decirIA(texto) {
        if (ocupado || p.fase !== 'negociacion') return;
        NG.Tutorial.cerrar();
        ocupado = true;
        pintarAcciones('espera', null, 'Interpretando lo que dices…');
        let a;
        try { a = await NG.IA.interpretar(p, texto); } catch (e) {
          ocupado = false;
          errorIA(e, 'No se ha jugado nada: inténtalo de nuevo o usa los botones.');
          borradorIA = texto;
          pintarAcciones('menu');
          return;
        }
        borradorIA = '';
        const accion = a && a.tipo !== 'charla' ? NG.IA.accionMotor(p, a) : null;
        ocupado = false;
        if (!accion) return charlaIA(texto);
        if (accion.tipo === 'aceptar' || accion.tipo === 'abandonar') {
          // Las decisiones que cierran la partida se confirman siempre
          pintarAcciones('menu');
          return abrir(accion.tipo, { texto });
        }
        anotarActa('', 'Interpretado como: ' + M().describirAccion(p, accion), 'acta-sistema');
        actuar(accion, { texto });
      }
      // Frases que no son una jugada (saludos, cortesías): responde sin cambiar el estado
      async function charlaIA(texto) {
        const ci = p.contrapartes.findIndex((c) => !c.retirado);
        const c = p.contrapartes[ci];
        ocupado = true;
        pintarAcciones('espera', null, 'La otra parte responde…');
        const peticion = NG.IA.narrar(NG.IA.contextoNarracion(p, texto, [{ quien: c.id, reaccion: 'pensativo', textoMotor: '(Esto no es una jugada de la negociación: responde con cortesía y brevedad a lo que ha dicho, sin conceder ni revelar nada nuevo, y reconduce hacia la negociación.)', oferta: null, revelacion: null }]))
          .catch((e) => { errorIA(e); return []; });
        await bocadillo('jugador', texto);
        const r = await peticion;
        const texto2 = r[0] && r[0].texto;
        visual(c.id, 'pensativo');
        await bocadillo(c.id, texto2 || NG.Dialogos.linea(NG.Util.crearRng(Date.now() >>> 0), 'invita', esc.contrapartes[ci].personalidad, [], { nombre: '' }), null, !!texto2);
        anotarActa('', 'Sin efecto en la negociación: para avanzar, propón, pregunta o comparte algo concreto.', 'acta-sistema');
        ocupado = false;
        pintarAcciones('menu');
      }
      let borradorIA = '';
      function cajaIA() {
        const activo = app.progreso.ajustes.modoIA !== false;
        const f = UI().el('form', { class: 'chat-ia' + (activo ? '' : ' apagado'), 'aria-label': 'Modo IA: habla con tus palabras' });
        f.innerHTML = '<div class="chat-ia-cabecera"><span class="etiqueta azul">IA</span><label for="chat-ia-texto">' + (activo ? 'Dilo con tus palabras' : 'Modo IA desactivado') + '</label>' +
          '<label class="casilla chat-ia-interruptor"><input type="checkbox" name="activo"' + (activo ? ' checked' : '') + '> Activado</label></div>' +
          (activo ? '<div class="chat-ia-fila"><textarea id="chat-ia-texto" rows="2" maxlength="600" placeholder="Ej.: «¿Qué es lo que más le preocupa de este contrato?»"></textarea>' +
            '<button type="submit" class="btn btn-primario chat-ia-enviar" aria-label="Decir">' + UI().icono('flecha') + '</button></div>' +
            '<p class="chat-ia-nota texto-tenue">Claude interpreta lo que dices y pone voz a la otra parte. Las reglas del juego deciden su respuesta.</p>' : '');
        f.querySelector('[name="activo"]').addEventListener('change', (ev) => {
          app.progreso.ajustes.modoIA = ev.target.checked;
          app.guardar();
          pintarAcciones('menu');
        });
        const ta = f.querySelector('textarea');
        if (ta) {
          ta.value = borradorIA;
          ta.addEventListener('input', () => { borradorIA = ta.value; });
          ta.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true })); } });
        }
        f.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const t = ta && ta.value.trim();
          if (t) decirIA(t);
        });
        return f;
      }

      /* ---------- Imprevistos ---------- */
      async function manejarEvento() {
        const vista = M().observacion(p).evento;
        if (tutorial) NG.Tutorial.mostrar('neg-evento');
        const def = esc.eventos.find((e) => e.id === vista.id);
        let retrato = null;
        if (vista.quien && esc.contrapartes.some((c) => c.id === vista.quien)) retrato = NG.Avatar.retrato(esc.contrapartes.find((c) => c.id === vista.quien).avatar, { id: 'ev-' + vista.id, fondo: '#2a3a5f', expresion: 'pensativo' });
        if (vista.quien === 'asesor' && esc.asesor) retrato = NG.Avatar.retrato(esc.asesor.avatar, { id: 'ev-asesor', fondo: '#2a3a5f', expresion: 'receptivo' });
        if (vista.quien === 'mediadora' && esc.mediadora) retrato = NG.Avatar.retrato(esc.mediadora.avatar, { id: 'ev-med', fondo: '#2a3a5f' });
        let auto = null, comentario = null;
        if (modelo) {
          auto = (esc.partidaModelo.eventos || {})[vista.id] || (def.opciones.find((o) => o.juicio === 'acierto') || def.opciones[0]).id;
          const op = def.opciones.find((o) => o.id === auto);
          comentario = op && op.explicacion;
        }
        const elegido = await NG.Evento.mostrar(marco, escena, vista, { factor: app.factorTemporizador(), retrato, automatica: auto, comentario });
        const op = def.opciones.find((o) => o.id === elegido) || def.opciones.find((o) => o.id === vista.porDefecto);
        anotarActa('Imprevisto', vista.titulo + ' → ' + (typeof op.texto === 'function' ? op.texto(p) : op.texto), 'acta-evento');
        const S = M().resolverEvento(p, elegido);
        await reproducir(S);
      }

      /* ---------- Final: cinemática y debrief ---------- */
      async function finalizar() {
        app.salidaProtegida = null;
        pintarAcciones('fin');
        const punt = NG.Puntuacion.calcular(p);
        const r = p.resultado;
        await espera(600);
        if (r.tipo === 'acuerdo') {
          await NG.Cinematicas.acuerdo(escena, { titulo: '¡Trato hecho con ' + esc.contrapartes.map((c) => c.nombre.split(' ')[0]).join(' y ') + '!', resumen: A().describir(esc, r.paquete) + ' · Valor para ti: ' + Math.round(r.uj) + ' pts', avatarParams: escena.avatares[esc.contrapartes[0].id] ? escena.avatares[esc.contrapartes[0].id].params : {} });
        } else if (r.tipo === 'ruptura') {
          await NG.Cinematicas.ruptura(escena, { titulo: r.motivo, resumen: 'Sin acuerdo, te quedas con tu BATNA: ' + p.jugador.batnaValor + ' pts.' });
        } else {
          await NG.Cinematicas.abandono(escena, { titulo: 'Te quedas con tu alternativa', resumen: 'Tu BATNA vale ' + p.jugador.batnaValor + ' pts.' });
        }
        let resProg = null;
        if (!modelo) {
          resProg = NG.Progreso.registrarResultado(app.progreso, esc, p, punt);
          if (esc.tutorial) app.progreso.tutorialVisto = true;
          app.guardar();
        }
        app.ir('debrief', { escenario: esc.id, partida: p, punt, progreso: resProg, modelo });
      }

      /* ---------- Panel de acciones ---------- */
      const ACCIONES = [
        { id: 'oferta', texto: 'Hacer una oferta', icono: 'oferta', ayuda: 'Propón un paquete completo' },
        { id: 'pregunta', texto: 'Preguntar', icono: 'pregunta', ayuda: 'Descubre sus intereses' },
        { id: 'compartir', texto: 'Compartir información', icono: 'compartir', ayuda: 'Genera confianza… con cuidado' },
        { id: 'concesion', texto: 'Hacer una concesión', icono: 'concesion', ayuda: 'Cede algo, con o sin contrapartida' },
        { id: 'meso', texto: 'Ofertas múltiples', icono: 'meso', ayuda: 'Varias ofertas de igual valor (MESO)' },
        { id: 'bilateral', texto: 'Reunión bilateral', icono: 'personas', ayuda: 'Habla a solas con una parte' },
        { id: 'presionar', texto: 'Presionar con tu BATNA', icono: 'presion', ayuda: 'Recuerda que tienes alternativa' },
        { id: 'pausa', texto: 'Pedir una pausa', icono: 'pausa', ayuda: 'Baja la tensión' },
        { id: 'aceptar', texto: 'Aceptar su propuesta', icono: 'apreton', ayuda: 'Cierra el acuerdo' },
        { id: 'abandonar', texto: 'Levantarse de la mesa', icono: 'salir', ayuda: 'Te quedas con tu BATNA' }
      ];
      const MOTIVO = { aceptar: 'No hay ninguna propuesta suya sobre la mesa', concesion: 'Primero tienes que hacer una oferta', pregunta: 'No te quedan preguntas por hacer', compartir: 'No te queda información que compartir', pausa: 'Ya has usado tus dos pausas', bilateral: 'Ya has usado tus dos pausas' };

      let pasoModelo = 0;
      let modoPanel = null;
      function pintarAcciones(modo, sub, textoEspera) {
        panelA.innerHTML = '';
        modoPanel = sub ? 'sub' : modo;
        if (modo === 'espera') {
          panelA.innerHTML = '<div class="espera" aria-live="polite"><span class="puntos"><i></i><i></i><i></i></span><span>' + UI().escapar(textoEspera || 'La otra parte responde…') + '</span></div>';
          panelA.appendChild(UI().boton({ texto: 'Saltar animaciones', icono: 'flecha', clase: 'btn-fantasma btn-pequeno', onClick: () => { saltar = true; } }));
          return;
        }
        if (modo === 'fin') { panelA.innerHTML = '<div class="espera"><span>Negociación terminada</span></div>'; return; }
        if (modo === 'modelo') return pintarModelo();
        if (sub) return sub();
        const obs = M().observacion(p);
        const d = obs.acciones;
        panelA.innerHTML = '<h2 class="panel-titulo">' + UI().icono('rayo') + ' ¿Qué haces?</h2>';
        if (!modelo && NG.IA && NG.IA.activo) panelA.appendChild(cajaIA());
        const rej = UI().el('div', { class: 'acciones-rejilla' });
        ACCIONES.forEach((ac) => {
          if (ac.id === 'meso' && !p.tecnicas.meso) return;
          if (ac.id === 'bilateral' && !esc.multiparte) return;
          if (ac.id === 'aceptar' && esc.multiparte) return;
          const disp = !!d[ac.id];
          const extra = ac.id === 'pausa' || ac.id === 'bilateral' ? ' (' + obs.pausasRestantes + ')' : '';
          const b = UI().el('button', { type: 'button', class: 'accion accion-' + ac.id, 'data-accion': ac.id, disabled: !disp, 'data-sonido': 'clic', title: disp ? ac.ayuda : (MOTIVO[ac.id] || 'No disponible ahora') },
            '<span class="accion-icono">' + UI().icono(ac.icono) + '</span><span class="accion-texto"><strong>' + ac.texto + extra + '</strong><small>' + (disp ? ac.ayuda : (MOTIVO[ac.id] || 'No disponible ahora')) + '</small></span>');
          b.addEventListener('click', () => abrir(ac.id));
          rej.appendChild(b);
        });
        panelA.appendChild(rej);
      }
      function cabeceraSub(titulo, icono) {
        const h = UI().el('div', { class: 'sub-cabecera' });
        h.appendChild(UI().el('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Volver a las acciones', onclick: () => pintarAcciones('menu') }, UI().icono('atras')));
        h.appendChild(UI().el('h2', { class: 'panel-titulo', html: UI().icono(icono) + ' ' + titulo }));
        panelA.appendChild(h);
      }
      function abrir(id, opciones) {
        const obs = M().observacion(p);
        if (id === 'pausa') return actuar({ tipo: 'pausa' });
        if (id === 'oferta') return pintarAcciones('menu', () => subOferta(obs));
        if (id === 'pregunta') return pintarAcciones('menu', () => subLista(obs, 'pregunta'));
        if (id === 'compartir') return pintarAcciones('menu', () => subLista(obs, 'compartir'));
        if (id === 'concesion') return pintarAcciones('menu', () => subConcesion(obs));
        if (id === 'meso') return pintarAcciones('menu', () => subMeso(obs));
        if (id === 'bilateral') return pintarAcciones('menu', () => subBilateral(obs));
        if (id === 'presionar') {
          const b = esc.jugador.batnas.find((x) => x.id === p.jugador.batnaId);
          return UI().modal({ titulo: 'Presionar con tu BATNA', icono: 'presion',
            contenido: '<p>Le recordarás a la otra parte que tienes una alternativa: <strong>' + UI().escapar(b.texto) + '</strong> (crees que vale ' + p.jugador.batnaMostrada + ' pts).</p><p class="texto-suave">Si tu alternativa es sólida, rebajará sus expectativas. Si no lo es, pueden descubrir el farol. Y presionar siempre tensa la relación.</p>',
            acciones: [{ texto: 'Mejor no', clase: 'btn-fantasma' }, { texto: 'Presionar', clase: 'btn-primario', onClick: () => actuar({ tipo: 'presionar' }) }] });
        }
        if (id === 'aceptar') {
          const m = obs.ofertaEnMesa;
          const v = Math.round(m.uj);
          const aviso = v < p.jugador.batnaMostrada ? '<p class="error">' + UI().icono('info', 'icono-en-linea') + ' Vale menos que tu BATNA (' + p.jugador.batnaMostrada + ' pts): estarías mejor sin acuerdo.</p>'
            : v < p.jugador.reserva ? '<p class="aviso">' + UI().icono('info', 'icono-en-linea') + ' Está por debajo del punto de reserva que fijaste (' + p.jugador.reserva + ' pts).</p>'
            : v >= p.jugador.objetivo ? '<p class="exito">' + UI().icono('check', 'icono-en-linea') + ' Alcanza tu objetivo (' + p.jugador.objetivo + ' pts).</p>' : '';
          return UI().modal({ titulo: '¿Aceptar su propuesta?', icono: 'apreton',
            contenido: '<p class="propuesta-grande">' + UI().escapar(A().describir(esc, m.paquete)) + '</p><p>Valor para ti: <strong>' + v + ' pts</strong></p>' + aviso,
            acciones: [{ texto: 'Seguir negociando', clase: 'btn-fantasma' }, { texto: 'Aceptar y cerrar', clase: 'btn-primario', onClick: () => actuar({ tipo: 'aceptar' }, opciones) }] });
        }
        if (id === 'abandonar') {
          const b = esc.jugador.batnas.find((x) => x.id === p.jugador.batnaId);
          return UI().modal({ titulo: '¿Levantarte de la mesa?', icono: 'salir',
            contenido: '<p>Terminarás sin acuerdo y te quedarás con tu BATNA: <strong>' + UI().escapar(b.texto) + '</strong>.</p><p class="texto-suave">A veces irse es lo correcto. Otras, es dejar valor sobre la mesa.</p>',
            acciones: [{ texto: 'Seguir negociando', clase: 'btn-fantasma' }, { texto: 'Levantarme', clase: 'btn-peligro', onClick: () => actuar({ tipo: 'abandonar' }, opciones) }] });
        }
      }

      function marcasJugador() { return { batna: p.jugador.batnaMostrada, reserva: p.jugador.reserva, objetivo: p.jugador.objetivo }; }
      function paqueteInicial(obs) {
        return obs.misOfertas.length ? obs.misOfertas[obs.misOfertas.length - 1].paquete : (p.jugador.apertura || esc.statusQuo);
      }

      function subOferta(obs) {
        cabeceraSub('Tu oferta', 'oferta');
        const ed = NG.Editor.crear({ esc, hoja: obs.hoja, inicial: paqueteInicial(obs), referencia: obs.ofertaEnMesa ? obs.ofertaEnMesa.paquete : null, marcas: marcasJugador(), compacto: true });
        panelA.appendChild(ed.el);
        if (obs.ofertaEnMesa) panelA.appendChild(UI().el('p', { class: 'texto-tenue leyenda-suya', html: '<i class="marca-suya-leyenda"></i> Lo que propone la otra parte' }));
        const opts = UI().el('div', { class: 'opciones-oferta' });
        if (obs.criterios.length) opts.innerHTML += '<label class="casilla"><input type="checkbox" name="criterio" value="' + obs.criterios[0].id + '" checked> Justificar con un criterio objetivo: <strong>' + UI().escapar(obs.criterios[0].nombre) + '</strong></label>';
        if (p.tecnicas.ofertaFinal) opts.innerHTML += '<label class="casilla"><input type="checkbox" name="final"> Presentarla como <strong>oferta final</strong> (más presión… y más riesgo)</label>';
        panelA.appendChild(opts);
        panelA.appendChild(UI().boton({ texto: 'Enviar oferta', icono: 'flecha', clase: 'btn-primario btn-bloque', onClick: () => {
          const crit = opts.querySelector('[name="criterio"]');
          const fin = opts.querySelector('[name="final"]');
          actuar({ tipo: 'oferta', paquete: ed.paquete(), criterio: crit && crit.checked ? crit.value : undefined, final: !!(fin && fin.checked) });
        } }));
      }

      function subLista(obs, tipo) {
        const lista = tipo === 'pregunta' ? obs.preguntas : obs.informacion;
        cabeceraSub(tipo === 'pregunta' ? 'Preguntar' : 'Compartir información', tipo === 'pregunta' ? 'pregunta' : 'compartir');
        panelA.appendChild(UI().el('p', { class: 'texto-tenue', texto: tipo === 'pregunta' ? 'Las buenas preguntas descubren intereses. Las respuestas dependen de la confianza.' : 'Compartir prioridades genera confianza y permite intercambios. Compartir tus límites te debilita.' }));
        const ul = UI().el('div', { class: 'lista-opciones' });
        lista.forEach((x) => {
          const dest = x.a ? '<span class="etiqueta">' + UI().escapar(nombres[x.a].split(' ')[0]) + '</span> ' : '';
          ul.appendChild(UI().el('button', { type: 'button', class: 'opcion-lista', 'data-sonido': 'clic', onclick: () => actuar({ tipo, id: x.id }) }, '<span>' + dest + UI().escapar(x.texto) + '</span>' + UI().icono('flecha')));
        });
        panelA.appendChild(ul);
      }

      function subConcesion(obs) {
        cabeceraSub('Hacer una concesión', 'concesion');
        const base = paqueteInicial(obs);
        let ceder = null, pedir = null;
        const caja = UI().el('div', { class: 'concesion' });
        const pintar = () => {
          const hoja = obs.hoja;
          let html = '<fieldset class="segmentado vertical"><legend>¿En qué cedes? (un paso)</legend>';
          esc.variables.forEach((v, i) => {
            const pk = M().paqueteConcesion(p, { variable: i });
            const ok = !!pk;
            html += '<label class="opcion-seg ancha"><input type="radio" name="ceder" value="' + i + '"' + (ceder === i ? ' checked' : '') + (ok ? '' : ' disabled') + '><span>' + UI().escapar(v.nombre) +
              '<small>' + (ok ? UI().escapar(v.opciones[base[i]]) + ' → ' + UI().escapar(v.opciones[pk[i]]) + ' (' + NG.Util.conSigno(Math.round(hoja[i][pk[i]] - hoja[i][base[i]])) + ' pts para ti)' : 'No puedes ceder más aquí') + '</small></span></label>';
          });
          html += '</fieldset><fieldset class="segmentado vertical"><legend>¿A cambio de qué? (opcional: «si… entonces…»)</legend>' +
            '<label class="opcion-seg ancha"><input type="radio" name="pedir" value=""' + (pedir === null ? ' checked' : '') + '><span>Nada: concesión sin condiciones<small>Genera buena voluntad, pero no garantiza reciprocidad</small></span></label>';
          esc.variables.forEach((v, i) => {
            if (i === ceder) return;
            const cur = base[i];
            const mejor = [cur - 1, cur + 1].filter((x) => x >= 0 && x < v.opciones.length && hoja[i][x] > hoja[i][cur]).sort((a, b) => hoja[i][b] - hoja[i][a])[0];
            if (mejor === undefined) return;
            html += '<label class="opcion-seg ancha"><input type="radio" name="pedir" value="' + i + '"' + (pedir === i ? ' checked' : '') + '><span>' + UI().escapar(v.nombre) + '<small>' + UI().escapar(v.opciones[cur]) + ' → ' + UI().escapar(v.opciones[mejor]) + ' (' + NG.Util.conSigno(Math.round(hoja[i][mejor] - hoja[i][cur])) + ' pts para ti)</small></span></label>';
          });
          html += '</fieldset>';
          let prev = '';
          if (ceder !== null) {
            const pk = M().paqueteConcesion(p, { variable: ceder, pedir: pedir === null ? undefined : pedir });
            if (pk) prev = '<p class="tarjeta previa">Propuesta resultante: <strong>' + UI().escapar(A().describir(esc, pk)) + '</strong> · Valor para ti: <strong>' + Math.round(obs.utilidad(pk.slice())) + ' pts</strong></p>';
          }
          caja.innerHTML = html + prev;
          caja.querySelectorAll('input[name="ceder"]').forEach((r) => r.addEventListener('change', () => { ceder = +r.value; if (pedir === ceder) pedir = null; pintar(); }));
          caja.querySelectorAll('input[name="pedir"]').forEach((r) => r.addEventListener('change', () => { pedir = r.value === '' ? null : +r.value; pintar(); }));
          enviar.disabled = ceder === null;
        };
        const enviar = UI().boton({ texto: 'Proponer la concesión', icono: 'flecha', clase: 'btn-primario btn-bloque', onClick: () => actuar({ tipo: 'concesion', variable: ceder, pedir: pedir === null ? undefined : pedir }) });
        panelA.appendChild(caja);
        panelA.appendChild(enviar);
        pintar();
      }

      function subMeso(obs) {
        cabeceraSub('Ofertas múltiples equivalentes', 'meso');
        panelA.appendChild(UI().el('p', { class: 'texto-tenue', html: 'Presenta 2 o 3 paquetes que <strong>valgan lo mismo para ti</strong>. Su elección revelará sus prioridades.' }));
        const base = paqueteInicial(obs);
        const eds = [0, 1, 2].map((k) => {
          const ed = NG.Editor.crear({ esc, hoja: obs.hoja, inicial: base, marcas: marcasJugador(), compacto: true, titulo: '<strong>Opción ' + String.fromCharCode(65 + k) + '</strong>', alCambiar: equilibrio });
          const det = UI().el('details', { class: 'meso-opcion', open: k === 0 ? true : null }, '<summary>Opción ' + String.fromCharCode(65 + k) + (k === 2 ? ' (opcional)' : '') + ' · <span class="meso-valor"></span></summary>');
          det.appendChild(ed.el);
          panelA.appendChild(det);
          return { ed, det };
        });
        const usarC = UI().el('label', { class: 'casilla' }, '<input type="checkbox" name="usarC"> Incluir la opción C');
        panelA.appendChild(usarC);
        const est = UI().el('p', { class: 'meso-estado' });
        panelA.appendChild(est);
        function equilibrio() {
          const vals = eds.map((x) => x.ed.valor());
          eds.forEach((x, k) => { x.det.querySelector('.meso-valor').textContent = vals[k] + ' pts'; });
          const usadas = usarC.querySelector('input').checked ? vals : vals.slice(0, 2);
          const dif = Math.max.apply(null, usadas) - Math.min.apply(null, usadas);
          est.innerHTML = dif <= 6 ? '<span class="etiqueta turquesa">Equivalentes para ti (±' + dif + ')</span>' : '<span class="etiqueta coral">No son equivalentes: diferencia de ' + dif + ' pts</span>';
        }
        usarC.querySelector('input').addEventListener('change', equilibrio);
        equilibrio();
        panelA.appendChild(UI().boton({ texto: 'Presentar las opciones', icono: 'flecha', clase: 'btn-primario btn-bloque', onClick: () => {
          const pk = eds.map((x) => x.ed.paquete());
          actuar({ tipo: 'meso', paquetes: usarC.querySelector('input').checked ? pk : pk.slice(0, 2) });
        } }));
      }

      function subBilateral(obs) {
        cabeceraSub('Reunión bilateral', 'personas');
        panelA.appendChild(UI().el('p', { class: 'texto-tenue', texto: 'Habla a solas con una parte (consume una pausa). En privado se responde con más franqueza… y los compromisos laterales crean alianzas, aunque la otra parte puede enterarse.' }));
        p.contrapartes.forEach((c) => {
          if (c.retirado) return;
          const g = UI().el('div', { class: 'bilateral-grupo' }, '<h3>' + UI().escapar(nombres[c.id]) + '</h3>');
          obs.preguntas.filter((q) => !q.a || q.a === c.id).forEach((q) => g.appendChild(UI().el('button', { type: 'button', class: 'opcion-lista', onclick: () => actuar({ tipo: 'bilateral', con: c.id, sub: 'pregunta', id: q.id }) }, '<span>' + UI().icono('pregunta', 'icono-en-linea') + ' ' + UI().escapar(q.texto) + '</span>')));
          obs.compromisos.filter((x) => x.con === c.id).forEach((x) => g.appendChild(UI().el('button', { type: 'button', class: 'opcion-lista compromiso', onclick: () => actuar({ tipo: 'bilateral', con: c.id, sub: 'compromiso', id: x.id }) }, '<span>' + UI().icono('apreton', 'icono-en-linea') + ' ' + UI().escapar(x.texto) + ' <small>(te cuesta ' + x.coste + ' pts)</small></span>')));
          panelA.appendChild(g);
        });
      }

      /* ---------- Partida modelo comentada ---------- */
      function pintarModelo() {
        const pasos = esc.partidaModelo.pasos;
        while (pasoModelo < pasos.length && !M().accionesDisponibles(p)[pasos[pasoModelo].accion.tipo]) pasoModelo++;
        panelA.innerHTML = '<h2 class="panel-titulo">' + UI().icono('libro') + ' Partida modelo comentada</h2>';
        let accion;
        let comentario;
        if (pasoModelo < pasos.length) { accion = pasos[pasoModelo].accion; comentario = pasos[pasoModelo].comentario; }
        else {
          const obs = M().observacion(p);
          accion = obs.acciones.aceptar ? { tipo: 'aceptar' } : { tipo: 'oferta', paquete: obs.misOfertas.length ? obs.misOfertas[obs.misOfertas.length - 1].paquete : esc.statusQuo };
          comentario = 'El guion ha terminado: la experta cierra con lo que hay sobre la mesa.';
        }
        panelA.innerHTML += '<div class="comentario-modelo grande"><span class="etiqueta ambar">Paso ' + Math.min(pasoModelo + 1, pasos.length) + ' de ' + pasos.length + '</span><p><strong>' + UI().escapar(M().describirAccion(p, accion)) + '</strong></p><p>' + UI().escapar(comentario) + '</p></div>';
        panelA.appendChild(UI().boton({ texto: 'Siguiente paso', icono: 'play', clase: 'btn-primario btn-bloque', onClick: () => { pasoModelo++; actuar(accion); } }));
      }

      /* ---------- Arranque ---------- */
      pintarPerfiles(); pintarMesa(); pintarPizarra(); relojMesa();
      p.contrapartes.forEach((c) => visual(c.id));
      if (esc.mediadora && escena.avatares.mediadora) escena.estado('mediadora', { expresion: 'neutral', postura: 'reposo', mirada: 'jugador' });
      if (!modelo && NG.IA) {
        NG.IA.comprobar().then(() => { if (NG.IA.activo && !ocupado && p.fase === 'negociacion' && modoPanel === 'menu') pintarAcciones('menu'); });
      }
      const iniciar = () => {
        reproducir(M().iniciar(p)).then(() => { if (tutorial) NG.Tutorial.mostrar('neg-inicio', panelA); });
      };
      if (modelo) {
        const pm = esc.partidaModelo;
        const b = esc.jugador.batnas.find((x) => x.id === prep.batnaId);
        UI().modal({
          titulo: 'Partida modelo comentada', icono: 'libro', clase: 'ancho',
          contenido: '<p>' + UI().escapar(pm.introduccion) + '</p><h3>Su preparación</h3><ul class="lista-check">' + (pm.comentariosPreparacion || []).map((x) => '<li>' + UI().icono('check') + UI().escapar(x) + '</li>').join('') + '</ul>' +
            '<p class="tarjeta">BATNA: <strong>' + UI().escapar(b.texto) + '</strong> · Reserva: <strong>' + prep.reserva + '</strong> · Objetivo: <strong>' + prep.objetivo + '</strong>' + (prep.apertura ? ' · Apertura: <strong>' + UI().escapar(A().describir(esc, prep.apertura)) + '</strong>' : '') + '</p>',
          acciones: [{ texto: 'Empezar', clase: 'btn-primario', onClick: iniciar }], cerrable: false
        });
      } else iniciar();

      return { desmontar() { NG.Tutorial.cerrar(); escena.destruir(); document.querySelectorAll('.cinematica, .evento-capa').forEach((n) => n.remove()); } };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
