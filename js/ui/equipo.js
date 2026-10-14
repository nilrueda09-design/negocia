/* =====================================================================
 * NEGOCIA · ui/equipo.js — Modo equipo «Mesa de crisis» (3 jugadores)
 * Un dispositivo, tres roles con información privada. Las pantallas
 * privadas se tapan con «pasa el dispositivo» para que nadie vea la hoja
 * de los demás. La mediadora (IA) abre cada ronda, analiza los rechazos,
 * propone planes y evalúa al final. La UI solo pinta: decide NG.Equipo.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const UI = () => NG.UI;
  const Q = () => NG.Equipo;
  const MED = () => NG.Mediadora;
  const esc = (s) => NG.UI.escapar(String(s === undefined || s === null ? '' : s));

  NG.Pantallas.equipo = {
    titulo: 'Mesa de crisis · modo equipo',
    montar(cont, params, app) {
      const E = Q().escenario();
      const R = Q().ROLES;
      const vars = E.variables;
      let e = null;
      let solo = false;
      const registroIA = [];
      let ultimaRes = null;
      let controlIA = null;
      app.titulo('Mesa de crisis · modo equipo');

      cont.innerHTML =
        '<div class="eq">' +
        '  <div class="eq-recursos" aria-label="Recursos compartidos"></div>' +
        '  <div class="escena-marco eq-escena"></div>' +
        '  <section class="panel eq-mediadora" aria-live="polite"></section>' +
        '  <section class="panel eq-principal"></section>' +
        '</div>';
      const marco = cont.querySelector('.eq-escena');
      const personajes = [Object.assign({ id: 'mediadora' }, E.mediadora)].concat(E.contrapartes.map((c) => ({ id: c.id, nombre: c.nombre, avatar: c.avatar })));
      const escena = NG.Escenas.montar(marco, E.escena.negociacion, { personajes });
      marco.insertBefore(escena.el, marco.firstChild);
      const panel = cont.querySelector('.eq-principal');
      const medPanel = cont.querySelector('.eq-mediadora');
      const recursosEl = cont.querySelector('.eq-recursos');
      const raizEq = cont.querySelector('.eq');
      MED().proveedor().then((f) => { fuenteIA = f; pintarRecursos(); });
      let fuenteIA = null;
      let rondaAbierta = false;
      let faseForzada = 0;

      /* ---------- Utilidades de pintado ---------- */
      const nombreDe = (r) => (e && e.roles[r].jugador) ? e.roles[r].jugador : R[r].personaje;
      const desc = (p) => p.map((k, i) => vars[i].opciones[k]).join(' · ');
      const ficha = (r, extra) => '<span class="eq-rol" style="--c:' + R[r].color + '">' + esc(R[r].titulo) + (extra ? ' · ' + esc(extra) : '') + '</span>';
      const barra = (etq, v, max, clase, txt) => '<div class="eq-recurso ' + clase + '"><span>' + etq + '</span><div class="eq-pista" role="meter" aria-label="' + etq + '" aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + v + '"><i style="width:' + Math.round(100 * Math.max(0, Math.min(v, max)) / max) + '%"></i></div><b>' + txt + '</b></div>';
      function pintarRecursos() {
        recursosEl.hidden = !e;
        if (!e) { recursosEl.innerHTML = ''; return; }
        const rondaVista = e.fase === 'apertura' && e.historial.length && e.historial[e.historial.length - 1].ronda === e.ronda - 1 && !rondaAbierta ? e.ronda - 1 : e.ronda;
        const faseN = faseForzada || (e.fase === 'posturas' ? 1 : e.fase === 'fin' ? 4 : 2);
        const fases = ['Posturas', 'Rondas', 'Ratificación', 'Evaluación'].map((f, i) => '<li class="' + (i + 1 === faseN ? 'activa' : i + 1 < faseN ? 'hecha' : '') + '">' + (i + 1) + ' · ' + f + '</li>').join('');
        recursosEl.innerHTML = '<ol class="eq-fases" aria-label="Fases de la partida">' + fases + '</ol>' +
          '<div class="eq-ronda"><span>Ronda</span><b>' + Math.min(rondaVista, Q().MAX_RONDAS) + '<small>/' + Q().MAX_RONDAS + '</small></b></div>' +
          barra('Caja de la empresa', e.caja, 8, e.caja <= 2 ? 'critico' : 'caja', e.caja + ' meses') +
          barra('Clima social', e.clima, 100, e.clima >= 65 ? 'critico' : 'clima', e.clima + (e.clima >= 65 ? ' · riesgo de huelga' : '')) +
          barra('Confianza en la mesa', e.confianza, 100, e.confianza < Q().CONFIANZA_COMPROMISOS ? 'critico' : 'confianza', e.confianza + '') +
          '<div class="eq-fuente" title="Quién da voz a la mediadora">' + UI().icono('mensaje', 'icono-en-linea') + ' Mediadora: ' + esc(fuenteIA ? MED().ETIQUETA[fuenteIA] : 'comprobando…') + '</div>';
      }
      function mediadora(html, cargando) {
        medPanel.innerHTML = '<div class="eq-med-cab">' + NG.Avatar.retrato(E.mediadora.avatar, { id: 'eq-med-' + Date.now(), fondo: '#2a3a5f', clase: 'mini', expresion: cargando ? 'pensativo' : 'receptivo' }) +
          '<div><strong>' + esc(MED().NOMBRE) + '</strong><span class="texto-tenue">Mediadora · IA</span></div></div><div class="eq-med-texto">' + html + '</div>';
      }
      function privado(activo) { raizEq.classList.toggle('modo-privado', !!activo); }
      function reaccionar(id, reaccion, pers) {
        if (!escena.avatares[id]) return;
        escena.estado(id, NG.EstadoVisual.derivar({ confianza: e.confianza, tension: e.clima, paciencia: e.caja, pacienciaMax: 6, reaccion, personalidad: pers, turno: e.ronda }));
      }
      const cuerpo = (html) => { panel.innerHTML = html; panel.scrollTop = 0; return panel; };
      const boton = (o) => UI().boton(o);

      /* ===================== 1. Introducción y reparto de roles ===================== */
      function intro() {
        privado(false);
        mediadora('<p>Bienvenidos. Textiles Miralles pierde 4 M€ al año y le quedan <strong>6 meses de caja</strong>. Hoy necesitamos un plan de viabilidad que firmen <strong>las tres partes</strong>. Yo conduciré la reunión, os propondré salidas cuando os atasquéis y os diré qué ha funcionado al final.</p>');
        const c = cuerpo(
          '<h2 class="panel-titulo">' + UI().icono('personas') + ' Mesa de crisis · 3 roles, una misión</h2>' +
          '<ol class="eq-reglas">' +
          '<li><strong>Misión compartida:</strong> firmar un plan de viabilidad antes de que se acabe la caja. Sin acuerdo, concurso de acreedores: pierden todos.</li>' +
          '<li><strong>Cada ronda</strong> propone un rol (por turnos). Los otros dos votan <strong>en secreto</strong>. Hace falta el sí de los tres.</li>' +
          '<li>Cada rol tiene <strong>información privada</strong>: su hoja de puntos, su mínimo, un objetivo secreto y datos confidenciales. Solo lo ve en su turno.</li>' +
          '<li>Cada rechazo cuesta <strong>un mes de caja</strong>, sube el <strong>clima social</strong> (a 80, huelga) y mueve la <strong>confianza</strong> (por debajo de 40 nadie se cree los compromisos laterales).</li>' +
          '<li>La <strong>mediadora IA</strong> lanza imprevistos, analiza cada rechazo y propone un plan que podéis adoptar o ignorar.</li>' +
          '</ol>' +
          '<div class="eq-roles"></div>' +
          '<label class="casilla"><input type="checkbox" name="solo"> Juega una sola persona (alterna los tres roles, sin pantallas de «pasa el dispositivo»)</label>' +
          '<div class="eq-pie"></div>');
        const cont2 = c.querySelector('.eq-roles');
        Q().ORDEN.forEach((r) => {
          const avatar = R[r].contraparte ? E.contrapartes.find((x) => x.id === R[r].contraparte).avatar : R[r].avatar;
          cont2.appendChild(UI().el('div', { class: 'eq-rol-tarjeta', style: '--c:' + R[r].color }, NG.Avatar.retrato(avatar, { id: 'eq-intro-' + r, fondo: '#22305a', clase: 'mini' }) +
            '<div><h3>' + esc(R[r].titulo) + '</h3><p class="texto-tenue">' + esc(R[r].personaje) + '</p><p><strong>Responsabilidad:</strong> ' + esc(R[r].responsabilidad) + '</p><p><strong>Busca:</strong> ' + esc(R[r].objetivoPublico) + '</p>' +
            '<label class="eq-nombre">Jugador/a <input type="text" name="' + r + '" maxlength="24" placeholder="Nombre (opcional)" autocomplete="off"></label></div>'));
        });
        const pie = c.querySelector('.eq-pie');
        pie.appendChild(boton({ texto: 'Sortear roles', icono: 'personas', clase: 'btn-fantasma', onClick: () => {
          const inputs = Q().ORDEN.map((r) => c.querySelector('input[name="' + r + '"]'));
          const vals = inputs.map((i) => i.value);
          for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
          inputs.forEach((i, k) => { i.value = vals[k]; });
          UI().toast({ titulo: 'Roles sorteados', icono: 'personas', duracion: 1800 });
        } }));
        pie.appendChild(boton({ texto: 'Empezar la reunión', icono: 'play', clase: 'btn-primario btn-grande', onClick: () => {
          const nombres = {};
          Q().ORDEN.forEach((r) => { nombres[r] = c.querySelector('input[name="' + r + '"]').value.trim(); });
          solo = c.querySelector('[name="solo"]').checked;
          e = Q().crear({ nombres });
          app.salidaProtegida = true;
          siguientePostura();
        } }));
      }

      /* ===================== Fase 1: posturas (privadas, se revelan a la vez) ===================== */
      function siguientePostura() {
        pintarRecursos();
        const pend = Q().ORDEN.filter((r) => !e.posturas[r]);
        if (!pend.length) return revelarPosturas();
        if (pend.length === 3) mediadora('<p><strong>Fase 1 · Posturas.</strong> Antes de negociar, cada parte decide en privado cómo se presenta a la mesa. Las tres posturas se revelan a la vez.</p>');
        pasar(pend[0], () => postura(pend[0]));
      }
      function postura(rol) {
        privado(!solo);
        const c = cuerpo('<h2 class="panel-titulo">' + UI().icono('persona') + ' Tu postura de apertura · ' + esc(R[rol].titulo) + '</h2>' + infoPrivada(rol) +
          '<p>Lee tu información privada y decide cómo te presentas. Las tres partes lo revelan a la vez.</p><div class="eq-posturas"></div>');
        const caja = c.querySelector('.eq-posturas');
        Object.values(Q().POSTURAS).forEach((p) => {
          caja.appendChild(UI().el('button', { type: 'button', class: 'eq-postura', 'data-postura': p.id, onclick: () => {
            Q().elegirPostura(e, rol, p.id);
            NG.Sonido.reproducir('clic');
            siguientePostura();
          } }, '<strong>' + esc(p.titulo) + '</strong><span>' + esc(p.texto) + '</span><small>' + esc(p.efecto) + '</small>'));
        });
      }
      function revelarPosturas() {
        privado(false);
        pintarRecursos();
        mediadora('<p>Gracias. Así llega cada uno a la mesa:</p><ul class="eq-declaraciones">' + e.declaraciones.map((d) => '<li>' + ficha(d.rol, Q().POSTURAS[d.postura].titulo) + ' «' + esc(d.texto) + '»</li>').join('') + '</ul>');
        const c = cuerpo('<h2 class="panel-titulo">' + UI().icono('personas') + ' Posturas reveladas</h2><p>La confianza queda en <strong>' + e.confianza + '</strong> y el clima social en <strong>' + e.clima + '</strong>.</p>' +
          (Object.keys(e.exigencias).length ? '<p>Exigencias sobre la mesa: ' + Object.keys(e.exigencias).map((r) => ficha(r) + ' ' + esc(vars[e.exigencias[r].variable].nombre) + ' → ' + esc(vars[e.exigencias[r].variable].opciones[e.exigencias[r].opcion])).join(' · ') + '</p>' : '') +
          '<div class="eq-pie"></div>');
        c.querySelector('.eq-pie').appendChild(boton({ texto: 'Empezar la fase 2: rondas', icono: 'play', clase: 'btn-primario btn-grande', onClick: () => apertura(null) }));
      }

      /* ===================== 2. Apertura de ronda (pública) ===================== */
      function apertura(cierre) {
        privado(false);
        let ev = null;
        const pedido = cierre && cierre.evento;
        try { ev = Q().abrirRonda(e, pedido); } catch (err) { ev = Q().abrirRonda(e, null); }
        rondaAbierta = true;
        pintarRecursos();
        Object.keys(escena.avatares).forEach((id) => { if (id !== 'mediadora') reaccionar(id, 'neutral', id === 'rosa' ? 'competitiva' : 'analitica'); });
        const por = Q().proponenteDe(e.ronda);
        let html = '';
        if (e.ronda === 1) html = '<p>Empecemos. Propone primero <strong>' + esc(R[por].titulo) + '</strong>. Recordad: cada ronda sin acuerdo nos cuesta un mes.</p>';
        else {
          if (ev) {
            html += '<p>' + esc((cierre && cierre.anuncio) || ('Una noticia: ' + ev.titulo + '.')) + '</p>';
            html += '<div class="eq-evento">' + UI().icono('rayo', 'icono-en-linea') + ' <strong>' + esc(ev.titulo) + '</strong><span>' + esc(ev.resumen) + '</span>' + cambiosHtml(ev.cambios) + '</div>';
            NG.Sonido.reproducir('telefono');
          } else html += '<p>Sin novedades fuera de esta sala. Sigamos.</p>';
          html += '<p>Ronda ' + e.ronda + ': propone <strong>' + esc(R[por].titulo) + '</strong>.</p>';
        }
        mediadora(html);
        const c = cuerpo('<h2 class="panel-titulo">' + UI().icono('rayo') + ' Ronda ' + e.ronda + '</h2>' + historialHtml() + '<div class="eq-pie"></div>');
        c.querySelector('.eq-pie').appendChild(boton({ texto: 'Turno de ' + R[por].titulo, icono: 'flecha', clase: 'btn-primario btn-grande', onClick: () => pasar(por, () => proponer(por)) }));
      }
      function cambiosHtml(c) {
        if (!c) return '';
        const partes = [];
        if (c.caja) partes.push((c.caja > 0 ? '+' : '') + c.caja + ' caja');
        if (c.clima) partes.push((c.clima > 0 ? '+' : '') + c.clima + ' clima');
        if (c.confianza) partes.push((c.confianza > 0 ? '+' : '') + c.confianza + ' confianza');
        return partes.length ? '<span class="eq-cambios">' + partes.map(esc).join(' · ') + '</span>' : '';
      }
      function historialHtml() {
        if (!e.historial.length) return '<p class="texto-tenue">Aún no hay propuestas.</p>';
        return '<details class="eq-historial"><summary>Propuestas anteriores (' + e.historial.length + ')</summary><ol>' + e.historial.map((h) =>
          '<li><strong>R' + h.ronda + ' · ' + esc(R[h.por].titulo) + ':</strong> ' + esc(desc(h.paquete)) + (h.compromisos.length ? ' + ' + esc(h.compromisos.map((id) => Q().COMPROMISOS[id].texto).join(', ')) : '') +
          ' → ' + Object.keys(h.votos).map((r) => esc(R[r].titulo) + (h.votos[r].acepta ? ' ✔' : ' ✘')).join(', ') + '</li>').join('') + '</ol></details>';
      }

      /* ===================== 3. Pasa el dispositivo ===================== */
      function pasar(rol, siguiente) {
        if (solo) { siguiente(); return; }
        privado(true);
        const c = cuerpo('<div class="eq-pasar" style="--c:' + R[rol].color + '">' + UI().icono('movil') +
          '<h2>Pasa el dispositivo a ' + esc(nombreDe(rol)) + '</h2><p>' + ficha(rol) + '</p><p class="texto-tenue">Lo que viene es privado: que nadie más mire la pantalla.</p><div class="eq-pie"></div></div>');
        c.querySelector('.eq-pie').appendChild(boton({ texto: 'Soy ' + nombreDe(rol) + ': ver mi pantalla', icono: 'candado', clase: 'btn-primario btn-grande', onClick: siguiente }));
        c.querySelector('.eq-pie .btn').focus();
      }
      function infoPrivada(rol) {
        const pv = Q().privado(e, rol);
        return '<aside class="eq-privado" style="--c:' + R[rol].color + '"><h3>' + UI().icono('candado', 'icono-en-linea') + ' Solo para ' + esc(R[rol].titulo) + '</h3>' +
          '<p><strong>Tu mínimo:</strong> ' + pv.reserva + ' pts. Por debajo, mejor sin acuerdo… aunque sin acuerdo te quedarías con ' + pv.batna + ' pts (' + esc(R[rol].batnaTexto) + ')</p>' +
          '<p><strong>Objetivo secreto (+10):</strong> ' + esc(pv.secreto) + '</p>' +
          '<ul>' + pv.confidencial.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></aside>';
      }

      /* ===================== 4. Proponer (privado) ===================== */
      function proponer(rol) {
        privado(!solo);
        const pv = Q().privado(e, rol);
        const ult = e.historial.length ? e.historial[e.historial.length - 1].paquete : E.statusQuo;
        const sug = e.sugerencia;
        const c = cuerpo('<h2 class="panel-titulo">' + UI().icono('oferta') + ' Tu propuesta · ' + esc(R[rol].titulo) + '</h2>' + infoPrivada(rol) +
          (sug ? '<div class="eq-sugerencia"><strong>' + UI().icono('mensaje', 'icono-en-linea') + ' Propuesta de la mediadora:</strong> ' + esc(desc(sug.paquete)) + '<p class="texto-tenue">' + esc(sug.razon) + '</p></div>' : '') +
          (Object.keys(e.exigencias).length ? '<div class="eq-exigencias"><strong>Lo que han pedido en la mesa:</strong><ul>' + Object.keys(e.exigencias).map((r) => '<li>' + esc(R[r].titulo) + ': ' + esc(vars[e.exigencias[r].variable].nombre) + ' → ' + esc(vars[e.exigencias[r].variable].opciones[e.exigencias[r].opcion]) + '</li>').join('') + '</ul></div>' : '') +
          '<div class="eq-editor"></div><div class="eq-compromisos"></div><div class="eq-pie"></div>');
        const ed = NG.Editor.crear({ esc: E, hoja: pv.hoja, inicial: ult, referencia: sug ? sug.paquete : null, marcas: { batna: pv.batna, reserva: pv.reserva, objetivo: Math.min(95, pv.reserva + 15) }, compacto: true });
        c.querySelector('.eq-editor').appendChild(ed.el);
        const comp = c.querySelector('.eq-compromisos');
        if (pv.compromisos.length) {
          comp.innerHTML = '<fieldset class="eq-comp"><legend>Compromisos laterales (opcional)</legend>' + pv.compromisos.map((x) =>
            '<label class="casilla"><input type="checkbox" name="comp" value="' + x.id + '"> ' + esc(x.texto) + ' <small>(te cuesta ' + x.coste + ' pts)</small></label>').join('') + '</fieldset>';
        } else comp.innerHTML = '<p class="texto-tenue">' + UI().icono('info', 'icono-en-linea') + ' Con la confianza por debajo de ' + Q().CONFIANZA_COMPROMISOS + ' nadie se cree los compromisos laterales.</p>';
        const pie = c.querySelector('.eq-pie');
        if (sug) pie.appendChild(boton({ texto: 'Usar la de la mediadora', icono: 'mensaje', clase: 'btn-fantasma', onClick: () => proponerDesde(sug.paquete) }));
        pie.appendChild(boton({ texto: 'Presentar a la mesa', icono: 'flecha', clase: 'btn-primario btn-grande', onClick: () => proponerDesde(ed.paquete()) }));
        function proponerDesde(paq) {
          const compromisos = Array.from(c.querySelectorAll('input[name="comp"]:checked')).map((i) => i.value);
          Q().proponer(e, { paquete: paq, compromisos });
          NG.Sonido.reproducir('notificacion');
          siguienteVoto();
        }
      }

      /* ===================== 5. Votar (privado) ===================== */
      function siguienteVoto() {
        const pend = Q().otros(e.propuesta.por).filter((r) => !e.votos[r]);
        if (!pend.length) return resolver();
        pasar(pend[0], () => votar(pend[0]));
      }
      function votar(rol) {
        privado(!solo);
        const pv = Q().privado(e, rol);
        const p = e.propuesta;
        const v = Q().valor(rol, p.paquete, p.compromisos);
        const secreto = R[rol].secreto.cumple({ paquete: p.paquete, compromisos: p.compromisos });
        let filas = vars.map((vr, i) => '<tr><th scope="row">' + esc(vr.nombre) + '</th><td>' + esc(vr.opciones[p.paquete[i]]) + '</td><td>' + (Math.round(pv.hoja[i][p.paquete[i]] * 10) / 10) + ' pts</td></tr>').join('');
        p.compromisos.forEach((id) => {
          const x = Q().COMPROMISOS[id];
          const d = (x.bonus[rol] || 0) - (x.de === rol ? x.coste : 0);
          if (d) filas += '<tr><th scope="row">Compromiso</th><td>' + esc(x.texto) + '</td><td>' + (d > 0 ? '+' : '') + d + ' pts</td></tr>';
        });
        const c = cuerpo('<h2 class="panel-titulo">' + UI().icono('pregunta') + ' Tu voto secreto · ' + esc(R[rol].titulo) + '</h2>' +
          '<p>Propone <strong>' + esc(R[p.por].titulo) + '</strong>' + (p.deLaMediadora ? ' (es la propuesta de la mediadora)' : '') + ':</p>' +
          '<table class="tabla-mesa eq-tabla"><thead><tr><th scope="col">Variable</th><th scope="col">Propuesta</th><th scope="col">Para ti</th></tr></thead><tbody>' + filas + '</tbody>' +
          '<tfoot><tr><th scope="row">Valor para ti</th><td colspan="2"><b class="' + (v >= pv.reserva ? 'ok' : 'mal') + '">' + v + ' pts</b> · tu mínimo es ' + pv.reserva + (secreto ? ' · <span class="etiqueta turquesa">cumple tu objetivo secreto</span>' : ' · <span class="etiqueta">no cumple tu objetivo secreto</span>') + '</td></tr></tfoot></table>' +
          infoPrivada(rol) +
          '<fieldset class="eq-pide"><legend>Si rechazas: ¿qué necesitas que cambie? (será público)</legend><select name="var"><option value="">Nada concreto</option>' + vars.map((vr, i) => '<option value="' + i + '">' + esc(vr.nombre) + '</option>').join('') + '</select> <select name="op" disabled></select></fieldset>' +
          '<div class="eq-pie"></div>');
        const sv = c.querySelector('[name="var"]'), so = c.querySelector('[name="op"]');
        sv.addEventListener('change', () => {
          if (sv.value === '') { so.innerHTML = ''; so.disabled = true; return; }
          const i = +sv.value;
          so.disabled = false;
          so.innerHTML = vars[i].opciones.map((o, k) => '<option value="' + k + '"' + (k === p.paquete[i] ? ' disabled' : '') + '>' + esc(o) + ' (' + (Math.round(pv.hoja[i][k] * 10) / 10) + ' pts para ti)</option>').join('');
          const mejor = pv.hoja[i].indexOf(Math.max.apply(null, pv.hoja[i]));
          so.value = String(mejor !== p.paquete[i] ? mejor : [...so.options].find((o) => !o.disabled).value);
        });
        const pie = c.querySelector('.eq-pie');
        const enviar = (acepta) => {
          const pide = !acepta && sv.value !== '' ? { variable: +sv.value, opcion: +so.value } : null;
          Q().votar(e, rol, { acepta, pide });
          NG.Sonido.reproducir('clic');
          siguienteVoto();
        };
        pie.appendChild(boton({ texto: 'Rechazar', icono: 'x', clase: 'btn-peligro', onClick: () => enviar(false) }));
        pie.appendChild(boton({ texto: 'Aceptar', icono: 'check', clase: 'btn-primario btn-grande', onClick: () => enviar(true) }));
      }

      /* ===================== 6. Resolución (pública) ===================== */
      async function resolver() {
        privado(false);
        const p = e.propuesta;
        const votos = Object.assign({}, e.votos);
        const res = Q().resolver(e);
        ultimaRes = res;
        rondaAbierta = false;
        pintarRecursos();
        Object.keys(votos).forEach((r) => {
          if (R[r].contraparte) reaccionar(R[r].contraparte, votos[r].acepta ? 'acepta' : (r === 'sindicato' && e.clima >= 60 ? 'molesto' : 'contraoferta'), r === 'sindicato' ? 'competitiva' : 'analitica');
        });
        const resumenVotos = '<ul class="eq-votos">' + Object.keys(votos).map((r) => '<li>' + ficha(r) + (votos[r].acepta ? ' <span class="etiqueta turquesa">Acepta</span>' : ' <span class="etiqueta coral">Rechaza</span>' + (votos[r].pide ? ' · pide ' + esc(vars[votos[r].pide.variable].nombre.toLowerCase()) + ': ' + esc(vars[votos[r].pide.variable].opciones[votos[r].pide.opcion]) : '')) + '</li>').join('') + '</ul>';
        const ratHtml = res.ratificacion ? '<div class="eq-ratificacion"><h3>' + UI().icono('check', 'icono-en-linea') + ' Fase 3 · Ratificación</h3><p class="texto-tenue">Las tres partes han dicho sí en la mesa. Ahora cada una lo defiende ante los suyos.</p><ul>' +
          res.ratificacion.map((x) => '<li>' + ficha(x.rol) + ' <span class="etiqueta ' + (x.ok ? 'turquesa' : 'coral') + '">' + (x.ok ? 'Ratificado' : 'Rechazado') + '</span> ' + esc(x.texto) + '</li>').join('') + '</ul></div>' : '';
        if (res.acuerdo) {
          NG.Sonido.reproducir('acierto');
          faseForzada = 3; pintarRecursos(); faseForzada = 0;
          mediadora('<p><strong>¡Tenemos plan!</strong> Las tres partes firman y lo ratifican ante los suyos.</p>');
          const c0 = cuerpo('<h2 class="panel-titulo">' + UI().icono('apreton') + ' Acuerdo</h2><p>' + esc(desc(p.paquete)) + '</p>' + resumenVotos + ratHtml + '<div class="eq-pie"></div>');
          await new Promise((ok) => c0.querySelector('.eq-pie').appendChild(boton({ texto: 'Firmar el plan', icono: 'apreton', clase: 'btn-primario btn-grande', onClick: ok })));
          await NG.Cinematicas.acuerdo(escena, { titulo: '¡Plan Horizonte firmado!', resumen: desc(p.paquete), avatarParams: escena.avatares.rosa ? escena.avatares.rosa.params : {} });
          return final();
        }
        NG.Sonido.reproducir('error');
        const c = cuerpo('<h2 class="panel-titulo">' + UI().icono('x') + (res.ratificacion ? ' Plan firmado en la mesa… pero no ratificado' : ' Sin acuerdo en la ronda ' + p.ronda) + '</h2><p>' + ficha(p.por) + ' proponía: ' + esc(desc(p.paquete)) + '</p>' + resumenVotos + ratHtml +
          '<p class="eq-consecuencias">' + cambiosHtml(res.cambios) + '</p>' + res.notas.map((n) => '<p class="aviso">' + UI().icono('info', 'icono-en-linea') + ' ' + esc(n) + '</p>').join('') + '<div class="eq-pie"></div>');
        if (res.fin) {
          mediadora('<p>Se nos ha acabado el tiempo. Sin plan, la empresa entra en concurso.</p>');
          c.querySelector('.eq-pie').appendChild(boton({ texto: 'Ver el desenlace', icono: 'flecha', clase: 'btn-primario btn-grande', onClick: async () => {
            await NG.Cinematicas.ruptura(escena, { titulo: 'Concurso de acreedores', resumen: 'Sin plan firmado, Textiles Miralles entra en concurso. Todos pierden.' });
            final();
          } }));
          return;
        }
        // La mediadora analiza (IA) mientras se muestran las consecuencias
        controlIA = typeof AbortController === 'function' ? new AbortController() : null;
        mediadora('<p class="eq-pensando"><span class="puntos"><i></i><i></i><i></i></span> Analizando la ronda y preparando una propuesta…</p>', true);
        const pie = c.querySelector('.eq-pie');
        const saltar = boton({ texto: 'Continuar sin esperar a la IA', icono: 'flecha', clase: 'btn-fantasma btn-pequeno', onClick: () => controlIA && controlIA.abort() });
        pie.appendChild(saltar);
        const cierre = await MED().cerrarRonda(e, { signal: controlIA ? controlIA.signal : undefined });
        registroIA.push(cierre.registro);
        fuenteIA = cierre.fuente === 'local' && fuenteIA !== 'local' ? fuenteIA : cierre.fuente;
        e.sugerencia = { paquete: cierre.propuesta, razon: cierre.razon, fuente: cierre.fuente };
        mediadora('<p>' + esc(cierre.analisis) + '</p><div class="eq-sugerencia"><strong>Mi propuesta:</strong> ' + esc(desc(cierre.propuesta)) + '<p class="texto-tenue">' + esc(cierre.razon) + '</p></div>' +
          '<p class="eq-ia-estado">' + estadoIA(cierre.registro) + ' <button type="button" class="enlace" data-ver-ia>Ver cómo ha trabajado la IA</button></p>');
        medPanel.querySelector('[data-ver-ia]').addEventListener('click', () => verIA(cierre.registro));
        pintarRecursos();
        pie.innerHTML = '';
        pie.appendChild(boton({ texto: 'Siguiente ronda', icono: 'flecha', clase: 'btn-primario btn-grande', onClick: () => apertura(cierre) }));
      }
      function estadoIA(reg) {
        const t = { validada: 'Respuesta de la IA validada', corregida: 'Respuesta de la IA corregida al validarla', descartada: 'Respuesta de la IA descartada: se usa la mediadora local', error: 'La IA no respondió: se usa la mediadora local', local: 'Mediadora local (sin conexión a la IA)' }[reg.estado] || '';
        if (reg.estado === 'local') return '<span class="etiqueta">' + esc(reg.fuente) + '</span>';
        return '<span class="etiqueta ' + (reg.estado === 'validada' ? 'turquesa' : 'ambar') + '">' + esc(reg.fuente) + '</span> ' + esc(t) + (reg.detalle ? ' (' + esc(reg.detalle) + ')' : '');
      }
      function verIA(reg) {
        UI().modal({ titulo: 'Cómo ha trabajado la IA', icono: 'mensaje', clase: 'ancho',
          contenido: '<p>' + estadoIA(reg) + '</p><h3>Prompt estructurado</h3><pre class="eq-prompt">' + esc(MED().promptVisible(reg.prompt)) + '</pre>' +
            (reg.respuesta ? '<h3>Respuesta recibida (antes de validar)</h3><pre class="eq-prompt">' + esc(JSON.stringify(reg.respuesta, null, 2)) + '</pre>' : ''),
          acciones: [{ texto: 'Cerrar', clase: 'btn-primario' }] });
      }

      /* ===================== 7. Final y evaluación ===================== */
      async function final() {
        app.salidaProtegida = null;
        privado(false);
        document.querySelectorAll('.cinematica').forEach((n) => n.remove());
        const punt = Q().puntuacion(e);
        pintarRecursos();
        mediadora('<p class="eq-pensando"><span class="puntos"><i></i><i></i><i></i></span> Preparando la evaluación de cada rol…</p>', true);
        const tarjetas = Q().ORDEN.map((r) => {
          const x = punt.roles[r];
          return '<div class="eq-final-rol" style="--c:' + R[r].color + '"><h3>' + esc(R[r].titulo) + ' <small>' + esc(nombreDe(r)) + '</small></h3>' +
            '<div class="eq-final-cifra"><b>' + x.individual + '</b><span>puntuación individual</span></div>' +
            '<p>Valor obtenido: <strong>' + x.valor + ' pts</strong> (mínimo ' + x.reserva + ')</p>' +
            '<p>Objetivo secreto: ' + (x.secreto ? '<span class="etiqueta turquesa">cumplido</span>' : '<span class="etiqueta coral">no cumplido</span>') + '<br><small class="texto-tenue">' + esc(R[r].secreto.texto) + '</small></p>' +
            '<p class="eq-eval" data-rol="' + r + '"></p></div>';
        }).join('');
        const c = cuerpo('<div class="eq-final-cab"><div><h2 class="panel-titulo">' + UI().icono('trofeo') + ' ' + (punt.acuerdo ? 'Plan firmado' : 'Concurso de acreedores') + '</h2>' +
          '<p>' + (punt.acuerdo ? esc(desc(e.resultado.paquete)) + (e.resultado.compromisos.length ? ' + ' + esc(e.resultado.compromisos.map((id) => Q().COMPROMISOS[id].texto).join(', ')) : '') : 'Ninguna propuesta logró el sí de las tres partes a tiempo.') + '</p></div>' +
          '<div class="eq-final-total"><b>' + punt.equipo + '</b><span>equipo</span>' + UI().estrellas(punt.estrellas) + '</div></div>' +
          '<div class="eq-final-dims"><div><b>' + punt.mision + '</b><span>Misión (empresa salvada, caja, clima)</span></div><div><b>' + punt.conjunto + ' %</b><span>Valor conjunto frente al mejor plan posible</span></div><div><b>' + punt.rondas + '</b><span>Rondas</span></div></div>' +
          '<p class="eq-resumen"></p><div class="eq-final-roles">' + tarjetas + '</div>' +
          '<div class="eq-mejor"><strong>' + UI().icono('lupa', 'icono-en-linea') + ' El plan que más valor creaba para los tres:</strong> ' + esc(desc(punt.nash)) + '</div>' +
          '<details class="eq-historial" open><summary>Cómo fue la partida</summary><ol>' + e.declaraciones.map((d) => '<li><strong>Fase 1 · ' + esc(R[d.rol].titulo) + ':</strong> postura ' + esc(Q().POSTURAS[d.postura].titulo.toLowerCase()) + '</li>').join('') + e.historial.map((h) => '<li><strong>R' + h.ronda + ' · ' + esc(R[h.por].titulo) + ':</strong> ' + esc(desc(h.paquete)) + ' → ' + Q().ORDEN.map((r) => esc(R[r].titulo.split(' ')[0]) + ' ' + h.valores[r]).join(' · ') + ' pts' + (h.resultado === 'acuerdo' ? ' ✔ acuerdo ratificado' : h.resultado === 'no ratificado' ? ' ✘ no ratificado' : '') + '</li>').join('') +
          e.eventos.map((x) => '<li class="texto-tenue">R' + x.ronda + ' · Imprevisto: ' + esc(x.id === 'huelga' ? 'Huelga de 48 horas' : Q().EVENTOS[x.id].titulo) + '</li>').join('') + '</ol></details>' +
          '<details class="eq-historial"><summary>Registro de la IA (' + (registroIA.length + 1) + ' intervenciones)</summary><ol class="eq-registro"></ol></details>' +
          '<div class="eq-pie"></div>');
        const pie = c.querySelector('.eq-pie');
        pie.appendChild(boton({ texto: 'Menú', icono: 'atras', clase: 'btn-fantasma', onClick: () => app.ir('menu') }));
        pie.appendChild(boton({ texto: 'Jugar otra vez', icono: 'play', clase: 'btn-primario btn-grande', onClick: () => app.ir('equipo', {}) }));
        const ev = await MED().evaluar(e, punt);
        registroIA.push(ev.registro);
        mediadora('<p>' + esc(ev.resumen) + '</p><p><strong>' + esc(ev.leccion) + '</strong></p><p class="eq-ia-estado">' + estadoIA(ev.registro) + '</p>');
        Q().ORDEN.forEach((r) => { const p = c.querySelector('.eq-eval[data-rol="' + r + '"]'); if (p) p.innerHTML = UI().icono('mensaje', 'icono-en-linea') + ' ' + esc(ev.roles[r]); });
        const ol = c.querySelector('.eq-registro');
        registroIA.forEach((reg) => {
          const li = UI().el('li', {}, '<strong>' + esc(reg.momento) + '</strong> · ' + estadoIA(reg) + ' ');
          li.appendChild(UI().el('button', { type: 'button', class: 'enlace', onclick: () => verIA(reg) }, 'ver prompt y respuesta'));
          ol.appendChild(li);
        });
      }

      intro();
      pintarRecursos();
      return { desmontar() { if (controlIA) controlIA.abort(); escena.destruir(); document.querySelectorAll('.cinematica').forEach((n) => n.remove()); } };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
