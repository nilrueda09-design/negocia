/* =====================================================================
 * NEGOCIA · núcleo/preparacion.js
 * Fase 1: presupuesto de preparación, investigación de la contraparte,
 * definición de BATNA, punto de reserva, objetivo y oferta de apertura.
 * Preparar mal tiene consecuencias: lo que no se investiga no aparece
 * en la pizarra, y una BATNA sin verificar puede ser un espejismo.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const U = NG.Util;

  function crear(esc) {
    const prep = {
      escenarioId: esc.id,
      puntos: esc.jugador.puntosPreparacion,
      gastados: 0,
      investigado: [],
      revelado: { intereses: [], batnas: [], verificadas: [], criterios: [], personalidad: [], batnaContraparte: [] },
      notas: [],
      batnaId: null, reserva: null, objetivo: null, apertura: null
    };
    // Notas iniciales de la pizarra (lo que el jugador ya sabe)
    (esc.notasIniciales || []).forEach((n, i) => prep.notas.push(Object.assign({ id: 'ini-' + i, tipo: 'dato' }, n)));
    return prep;
  }

  const restantes = (prep) => prep.puntos - prep.gastados;

  /* Fichas de investigación con su estado para la UI. */
  function fichas(prep, esc) {
    return (esc.investigacion || []).map((f) => ({
      id: f.id, titulo: f.titulo, descripcion: f.descripcion, coste: f.coste, icono: f.icono || 'carpeta',
      hecha: prep.investigado.includes(f.id),
      asequible: !prep.investigado.includes(f.id) && f.coste <= restantes(prep)
    }));
  }

  /* Añade una nota a la pizarra a partir de una revelación. */
  function notaInteres(esc, idInteres) {
    for (const c of esc.contrapartes) {
      const it = (c.intereses || []).find((x) => x.id === idInteres);
      if (it) {
        const v = esc.variables.find((x) => x.id === it.variable);
        return {
          id: 'int-' + it.id, tipo: 'interes', quien: c.id, variable: it.variable,
          importancia: it.importancia, direccion: it.direccion || 'opuesta',
          titulo: it.titulo || (v ? v.nombre : 'Interés'), texto: it.texto
        };
      }
    }
    return null;
  }

  function investigar(prep, esc, id) {
    const f = (esc.investigacion || []).find((x) => x.id === id);
    if (!f) return { ok: false, motivo: 'Ficha desconocida' };
    if (prep.investigado.includes(id)) return { ok: false, motivo: 'Ya investigado' };
    if (f.coste > restantes(prep)) return { ok: false, motivo: 'No te queda tiempo de preparación suficiente' };
    prep.investigado.push(id);
    prep.gastados += f.coste;
    const notas = [];
    const r = f.revela || {};
    const lista = (x) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

    lista(r.interes).forEach((iid) => {
      if (!prep.revelado.intereses.includes(iid)) prep.revelado.intereses.push(iid);
      const n = notaInteres(esc, iid);
      if (n) notas.push(n);
    });
    lista(r.batna).forEach((bid) => {
      if (!prep.revelado.batnas.includes(bid)) prep.revelado.batnas.push(bid);
      const b = esc.jugador.batnas.find((x) => x.id === bid);
      if (b) notas.push({ id: 'batna-' + bid, tipo: 'batna', titulo: 'Nueva alternativa', texto: b.texto + ' (vale ' + b.valor + ' pts para ti)' });
    });
    lista(r.verifica).forEach((bid) => {
      if (!prep.revelado.verificadas.includes(bid)) prep.revelado.verificadas.push(bid);
      const b = esc.jugador.batnas.find((x) => x.id === bid);
      if (b) notas.push({ id: 'verif-' + bid, tipo: 'batna', titulo: 'Alternativa verificada', texto: (f.nota && f.nota.texto) || (b.texto + ': en realidad vale ' + b.valor + ' pts') });
    });
    lista(r.criterio).forEach((cid) => {
      if (!prep.revelado.criterios.includes(cid)) prep.revelado.criterios.push(cid);
      const c = (esc.criterios || []).find((x) => x.id === cid);
      if (c) notas.push({ id: 'crit-' + cid, tipo: 'criterio', titulo: 'Criterio objetivo', texto: c.texto });
    });
    lista(r.personalidad).forEach((cid) => {
      const c = esc.contrapartes.find((x) => x.id === cid) || esc.contrapartes[0];
      if (!prep.revelado.personalidad.includes(c.id)) prep.revelado.personalidad.push(c.id);
      const pers = NG.Personalidades[c.personalidad];
      notas.push({ id: 'pers-' + c.id, tipo: 'perfil', quien: c.id, titulo: 'Perfil de ' + c.nombre.split(' ')[0], texto: (f.nota && f.nota.texto) || (pers.nombre + ': ' + pers.descripcion) });
    });
    lista(r.batnaContraparte).forEach((cid) => {
      const c = esc.contrapartes.find((x) => x.id === cid) || esc.contrapartes[0];
      if (!prep.revelado.batnaContraparte.includes(c.id)) prep.revelado.batnaContraparte.push(c.id);
      notas.push({ id: 'cbatna-' + c.id, tipo: 'pista', quien: c.id, titulo: 'Su alternativa', texto: (f.nota && f.nota.texto) || c.batna.texto });
    });
    if (r.pista) notas.push({ id: 'pista-' + f.id, tipo: 'pista', titulo: (f.nota && f.nota.titulo) || 'Pista', texto: r.pista });

    // Nota genérica si la ficha no revela nada útil (también es aprendizaje)
    if (!notas.length) notas.push({ id: 'nada-' + f.id, tipo: 'pista', titulo: f.titulo, texto: (f.nota && f.nota.texto) || 'Nada concluyente.' });
    notas.forEach((n) => { if (!prep.notas.some((x) => x.id === n.id)) prep.notas.push(n); });
    return { ok: true, notas };
  }

  /* Alternativas visibles para el jugador con el valor que él cree que tienen. */
  function batnasVisibles(prep, esc) {
    return esc.jugador.batnas
      .filter((b) => b.conocida || prep.revelado.batnas.includes(b.id))
      .map((b) => {
        const dudosa = typeof b.valorAparente === 'number' && !prep.revelado.verificadas.includes(b.id);
        return { id: b.id, texto: b.texto, valorMostrado: dudosa ? b.valorAparente : b.valor, verificada: !dudosa };
      });
  }

  function definir(prep, esc, datos) {
    if (datos.batnaId !== undefined) prep.batnaId = datos.batnaId;
    if (datos.reserva !== undefined) prep.reserva = U.clamp(Math.round(datos.reserva), 0, 100);
    if (datos.objetivo !== undefined) prep.objetivo = U.clamp(Math.round(datos.objetivo), 0, 100);
    if (datos.apertura !== undefined) prep.apertura = datos.apertura ? NG.Analisis.normalizarPaquete(esc, datos.apertura) : null;
    return validar(prep, esc);
  }

  function validar(prep, esc) {
    const errores = [];
    const vis = batnasVisibles(prep, esc);
    if (!prep.batnaId || !vis.some((b) => b.id === prep.batnaId)) errores.push('Elige tu BATNA (tu mejor alternativa si no hay acuerdo).');
    if (typeof prep.reserva !== 'number') errores.push('Fija tu punto de reserva.');
    if (typeof prep.objetivo !== 'number') errores.push('Fija tu objetivo.');
    if (typeof prep.reserva === 'number' && typeof prep.objetivo === 'number' && prep.objetivo < prep.reserva)
      errores.push('El objetivo no puede estar por debajo de tu punto de reserva.');
    if (esc.quienAbre !== 'contraparte' && !esc.multiparte && !prep.apertura) errores.push('Prepara tu oferta de apertura.');
    return { ok: errores.length === 0, errores };
  }

  /* Valores por defecto razonables para la UI (no para los agentes). */
  function sugerencias(prep, esc) {
    const vis = batnasVisibles(prep, esc);
    const b = vis.find((x) => x.id === prep.batnaId) || vis[0];
    const reserva = b ? b.valorMostrado : 40;
    return { batnaId: b ? b.id : null, reserva, objetivo: Math.min(95, reserva + 25) };
  }

  NG.Preparacion = { crear, fichas, investigar, batnasVisibles, definir, validar, sugerencias, restantes };
})(typeof window !== 'undefined' ? window : globalThis);
