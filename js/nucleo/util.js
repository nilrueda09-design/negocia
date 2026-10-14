/* =====================================================================
 * NEGOCIA · núcleo/util.js
 * Utilidades puras: generador aleatorio con semilla, aritmética y copia.
 * Sin DOM: se carga igual en el navegador (<script>) y en Node (require).
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  /* ---------- Generador pseudoaleatorio reproducible (mulberry32) ----------
   * El estado es un objeto plano { s } para que la partida sea serializable:
   * misma semilla + mismas acciones = misma partida (tests, partida modelo). */
  function crearRng(semilla) {
    return { s: (semilla >>> 0) || 1 };
  }
  function siguiente(rng) {
    rng.s = (rng.s + 0x6D2B79F5) >>> 0;
    let t = rng.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const entre = (rng, a, b) => a + (b - a) * siguiente(rng);
  const entero = (rng, a, b) => a + Math.floor(siguiente(rng) * (b - a + 1));
  const elegir = (rng, lista) => lista[Math.floor(siguiente(rng) * lista.length)];
  const probabilidad = (rng, p) => siguiente(rng) < p;

  /* ---------- Aritmética ---------- */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const redondear = (x, dec = 0) => {
    const f = Math.pow(10, dec);
    return Math.round(x * f) / f;
  };
  const suma = (lista) => lista.reduce((s, x) => s + x, 0);
  const media = (lista) => (lista.length ? suma(lista) / lista.length : 0);

  /* Copia profunda de datos planos (estado de partida, paquetes). */
  const copiar = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

  /* Semilla nueva a partir de la hora (solo para partidas reales, no tests). */
  const semillaAleatoria = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;

  /* Formato de puntos con signo: +5 / −3 (con el signo menos tipográfico). */
  const conSigno = (x) => (x > 0 ? '+' + x : x < 0 ? '−' + Math.abs(x) : '0');

  NG.Util = {
    crearRng, siguiente, entre, entero, elegir, probabilidad,
    clamp, lerp, redondear, suma, media, copiar, semillaAleatoria, conSigno
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = NG;
})(typeof window !== 'undefined' ? window : globalThis);
