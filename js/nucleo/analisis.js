/* =====================================================================
 * NEGOCIA · núcleo/analisis.js
 * Registro y compilación de escenarios + análisis exacto del espacio de
 * acuerdos: utilidades, frontera de Pareto, ZOPA y solución de Nash.
 *
 * Un "paquete" es un array de índices de opción alineado con
 * escenario.variables. Ej.: [2, 0, 3] = 3ª opción de la 1ª variable…
 * Como las opciones son discretas, el espacio se puede enumerar entero.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const U = NG.Util;

  /* ---------- Curvas de utilidad por opción (valores en [0,1]) ----------
   * 'asc'  → más es mejor        'desc' → menos es mejor
   * array  → valores a medida    {pico: i} → la opción i es la ideal   */
  function curvaUtilidad(curva, n) {
    if (Array.isArray(curva)) {
      if (curva.length !== n) throw new Error('Curva con ' + curva.length + ' valores para ' + n + ' opciones');
      return curva.slice();
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      if (curva === 'asc') out.push(n === 1 ? 1 : i / (n - 1));
      else if (curva === 'desc') out.push(n === 1 ? 1 : 1 - i / (n - 1));
      else if (curva && typeof curva.pico === 'number') {
        const k = curva.pico, ancho = Math.max(k, n - 1 - k) || 1;
        out.push(1 - Math.abs(i - k) / ancho);
      } else throw new Error('Curva desconocida: ' + JSON.stringify(curva));
    }
    return out;
  }

  /* Perfil = { pesos: [w_i], u: [[u_i,opción]] } en el orden de las variables. */
  function crearPerfil(variables, pesosPorId, curvasPorId) {
    const pesos = variables.map((v) => pesosPorId[v.id] || 0);
    const u = variables.map((v) => curvaUtilidad(curvasPorId[v.id] || 'asc', v.opciones.length));
    return { pesos, u };
  }

  /* U(p) = 100 · Σ w_i · u_i(p_i)  →  escala 0–100 */
  function utilidadPerfil(perfil, paquete) {
    let s = 0;
    for (let i = 0; i < paquete.length; i++) s += perfil.pesos[i] * perfil.u[i][paquete[i]];
    return 100 * s;
  }

  /* ---------- Compilación y validación de un escenario ---------- */
  function compilar(def) {
    const errores = [];
    const esc = def; // se enriquece in situ (los datos son propiedad del registro)
    const vars = esc.variables || [];
    if (!vars.length) errores.push('sin variables');
    const ids = new Set();
    vars.forEach((v) => {
      if (ids.has(v.id)) errores.push('variable duplicada ' + v.id);
      ids.add(v.id);
      if (!v.opciones || v.opciones.length < 2) errores.push('variable ' + v.id + ' con menos de 2 opciones');
    });

    const sumaPesos = (pesos, quien) => {
      const s = U.suma(pesos);
      if (Math.abs(s - 1) > 0.001) errores.push('los pesos de ' + quien + ' suman ' + s.toFixed(3));
    };

    // Perfil del jugador (declarado dentro de cada variable)
    const pesosJ = {}, curvasJ = {};
    vars.forEach((v) => { pesosJ[v.id] = v.jugador.peso; curvasJ[v.id] = v.jugador.curva; });
    try { esc.perfilJ = crearPerfil(vars, pesosJ, curvasJ); } catch (e) { errores.push('jugador: ' + e.message); }
    if (esc.perfilJ) sumaPesos(esc.perfilJ.pesos, 'jugador');

    // Perfiles de las contrapartes (ocultos para el jugador)
    esc.perfilesC = (esc.contrapartes || []).map((c) => {
      Object.keys(c.pesos).forEach((k) => { if (!ids.has(k)) errores.push(c.id + ': peso de variable inexistente ' + k); });
      let p = null;
      try { p = crearPerfil(vars, c.pesos, c.curvas); } catch (e) { errores.push(c.id + ': ' + e.message); }
      if (p) sumaPesos(p.pesos, c.id);
      if (!NG.Personalidades || !NG.Personalidades[c.personalidad]) errores.push(c.id + ': personalidad desconocida ' + c.personalidad);
      return p;
    });
    if (!esc.perfilesC.length) errores.push('sin contrapartes');

    if (errores.length) throw new Error('Escenario ' + esc.id + ' inválido: ' + errores.join('; '));

    // Enumeración completa del espacio de paquetes con utilidades precalculadas
    const radices = vars.map((v) => v.opciones.length);
    const total = radices.reduce((a, b) => a * b, 1);
    const paquetes = new Array(total);
    for (let k = 0; k < total; k++) {
      let r = k; const p = new Array(vars.length);
      for (let i = vars.length - 1; i >= 0; i--) { p[i] = r % radices[i]; r = Math.floor(r / radices[i]); }
      paquetes[k] = p;
    }
    esc.radices = radices;
    esc.paquetes = paquetes;
    esc.utilJBase = Float64Array.from(paquetes, (p) => utilidadPerfil(esc.perfilJ, p));
    esc.utilCBase = esc.perfilesC.map((perf) => Float64Array.from(paquetes, (p) => utilidadPerfil(perf, p)));
    esc.statusQuo = vars.map((v) => (typeof v.statusQuo === 'number' ? v.statusQuo : Math.floor((v.opciones.length - 1) / 2)));
    esc.multiparte = esc.contrapartes.length > 1;
    return esc;
  }

  /* Índice de un paquete en la enumeración (codificación de base mixta). */
  function indicePaquete(esc, p) {
    let k = 0;
    for (let i = 0; i < p.length; i++) k = k * esc.radices[i] + p[i];
    return k;
  }

  /* Acepta un array de índices o un objeto {idVariable: índice}. */
  function normalizarPaquete(esc, p) {
    if (Array.isArray(p)) return p.slice();
    return esc.variables.map((v, i) => (p && typeof p[v.id] === 'number' ? p[v.id] : esc.statusQuo[i]));
  }

  const igualPaquete = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => x === b[i]);

  /* ---------- Frontera de Pareto (maximizar todas las dimensiones) ---------- */
  function frontera(puntos) {
    // puntos: [{k, v:[u0,u1,…]}]  → devuelve los no dominados
    const dim = puntos.length ? puntos[0].v.length : 0;
    if (dim === 2) {
      const orden = puntos.slice().sort((a, b) => b.v[0] - a.v[0] || b.v[1] - a.v[1]);
      const res = []; let mejor = -Infinity;
      for (const pt of orden) if (pt.v[1] > mejor + 1e-9) { res.push(pt); mejor = pt.v[1]; }
      return res;
    }
    return puntos.filter((a) => !puntos.some((b) => b !== a &&
      b.v.every((x, i) => x >= a.v[i] - 1e-9) && b.v.some((x, i) => x > a.v[i] + 1e-9)));
  }

  /* ---------- Análisis del espacio de acuerdos ----------
   * opts: { utilJ, utilC: [arrays], dJ (BATNA del jugador), reservas: [R_c] }
   * Devuelve ZOPA, frontera, Nash y extremos para puntuar y para el debrief. */
  function analizar(esc, opts) {
    const n = esc.paquetes.length;
    const uJ = opts.utilJ || esc.utilJBase;
    const uC = opts.utilC || esc.utilCBase;
    const dJ = opts.dJ;
    const R = opts.reservas;
    const zopa = [];
    let maxJ = -Infinity, kMaxJ = -1, jointMax = -Infinity, kJointMax = -1, jointMin = Infinity;
    let nash = -Infinity, kNash = -1;
    for (let k = 0; k < n; k++) {
      let ok = uJ[k] >= dJ, joint = uJ[k], prod = uJ[k] - dJ;
      for (let c = 0; c < uC.length; c++) {
        if (uC[c][k] < R[c]) ok = false;
        joint += uC[c][k];
        prod *= Math.max(0, uC[c][k] - R[c]);
      }
      // Máximo alcanzable para el jugador respetando las reservas de la(s) contraparte(s)
      let factibleC = true;
      for (let c = 0; c < uC.length; c++) if (uC[c][k] < R[c]) factibleC = false;
      if (factibleC && uJ[k] > maxJ) { maxJ = uJ[k]; kMaxJ = k; }
      if (!ok) continue;
      zopa.push(k);
      if (joint > jointMax) { jointMax = joint; kJointMax = k; }
      if (joint < jointMin) jointMin = joint;
      if (prod > nash) { nash = prod; kNash = k; }
    }
    return {
      zopa, hayZopa: zopa.length > 0,
      maxJFactible: maxJ, kMaxJ,
      jointMax, jointMin: zopa.length ? jointMin : 0, kJointMax,
      kNash,
      puntos: null // se calculan bajo demanda en mesa()
    };
  }

  /* El mejor acuerdo para el jugador que NO empeora a ninguna contraparte
   * respecto a un acuerdo dado → mide el "valor dejado sobre la mesa". */
  function mejorSinPerjudicar(esc, uJ, uC, kAcuerdo) {
    let mejor = kAcuerdo;
    for (let k = 0; k < esc.paquetes.length; k++) {
      let ok = true;
      for (let c = 0; c < uC.length; c++) if (uC[c][k] < uC[c][kAcuerdo] - 1e-9) { ok = false; break; }
      if (ok && uJ[k] > uJ[mejor] + 1e-9) mejor = k;
    }
    return mejor;
  }

  /* Texto legible de un paquete: "820 € · 30 días · 14.000 t" */
  function describir(esc, p) {
    return esc.variables.map((v, i) => v.opciones[p[i]]).join(' · ');
  }

  /* Diferencias entre dos paquetes, variable a variable. */
  function diferencias(esc, a, b) {
    const out = [];
    esc.variables.forEach((v, i) => { if (a[i] !== b[i]) out.push({ variable: v.id, nombre: v.nombre, de: v.opciones[a[i]], a: v.opciones[b[i]], i }); });
    return out;
  }

  /* ---------- Registro global de escenarios ---------- */
  const registro = { lista: [], porId: {} };
  NG.Escenarios = {
    registrar(def) {
      const esc = compilar(def);
      if (registro.porId[esc.id]) registro.lista = registro.lista.filter((e) => e.id !== esc.id);
      registro.porId[esc.id] = esc;
      registro.lista.push(esc);
      registro.lista.sort((a, b) => a.orden - b.orden);
      return esc;
    },
    obtener: (id) => registro.porId[id] || null,
    todos: () => registro.lista.slice()
  };

  NG.Analisis = {
    curvaUtilidad, crearPerfil, utilidadPerfil, compilar, indicePaquete, normalizarPaquete,
    igualPaquete, frontera, analizar, mejorSinPerjudicar, describir, diferencias
  };
})(typeof window !== 'undefined' ? window : globalThis);
