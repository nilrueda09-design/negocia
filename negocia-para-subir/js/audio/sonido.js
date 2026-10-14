/* =====================================================================
 * NEGOCIA · audio/sonido.js
 * Efectos de sonido sintetizados con Web Audio API (sin archivos).
 * El AudioContext solo se crea tras la primera interacción del usuario
 * (política de autoplay de los navegadores). Hay un botón visible de
 * silencio y la preferencia se guarda en el progreso.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  let ctx = null, maestro = null, activo = true, volumen = 0.6, desbloqueado = false;
  let ultimoTecleo = 0;

  function crear() {
    if (ctx) return ctx;
    const AC = raiz.AudioContext || raiz.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    maestro = ctx.createGain();
    maestro.gain.value = activo ? volumen : 0;
    const comp = ctx.createDynamicsCompressor();
    maestro.connect(comp); comp.connect(ctx.destination);
    return ctx;
  }
  function desbloquear() {
    desbloqueado = true;
    crear();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  /* ---------- Bloques de síntesis ---------- */
  function tono(frec, dur, o) {
    o = o || {};
    if (!ctx || !activo) return;
    const t0 = ctx.currentTime + (o.retardo || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.tipo || 'sine';
    osc.frequency.setValueAtTime(frec, t0);
    if (o.hasta) osc.frequency.exponentialRampToValueAtTime(o.hasta, t0 + dur);
    const pico = (o.vol || 0.25);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(pico, t0 + (o.ataque || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let nodo = osc;
    if (o.filtro) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filtro; osc.connect(f); nodo = f; }
    nodo.connect(g); g.connect(maestro);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function ruido(dur, o) {
    o = o || {};
    if (!ctx || !activo) return;
    const t0 = ctx.currentTime + (o.retardo || 0);
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = o.tipoFiltro || 'lowpass';
    f.frequency.setValueAtTime(o.desde || 1200, t0);
    if (o.hasta) f.frequency.exponentialRampToValueAtTime(o.hasta, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(maestro);
    src.start(t0); src.stop(t0 + dur);
  }

  /* ---------- Catálogo ---------- */
  const SONIDOS = {
    clic: () => tono(660, 0.06, { tipo: 'triangle', vol: 0.12 }),
    seleccion: () => tono(520, 0.05, { tipo: 'triangle', vol: 0.08 }),
    tecla: () => {
      const ahora = performance.now();
      if (ahora - ultimoTecleo < 55) return;
      ultimoTecleo = ahora;
      tono(1800 + Math.random() * 400, 0.018, { tipo: 'square', vol: 0.018, filtro: 2600 });
    },
    acierto: () => { [523, 659, 784].forEach((f, i) => tono(f, 0.22, { tipo: 'triangle', vol: 0.16, retardo: i * 0.07 })); },
    error: () => { tono(180, 0.28, { tipo: 'sawtooth', vol: 0.12, hasta: 110, filtro: 700 }); },
    subida: () => { tono(740, 0.12, { tipo: 'sine', vol: 0.12 }); tono(988, 0.16, { tipo: 'sine', vol: 0.1, retardo: 0.06 }); },
    bajada: () => { tono(392, 0.16, { tipo: 'sine', vol: 0.12, hasta: 300 }); },
    notificacion: () => { tono(880, 0.12, { tipo: 'sine', vol: 0.16 }); tono(1320, 0.2, { tipo: 'sine', vol: 0.14, retardo: 0.1 }); },
    telefono: () => {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) {
        tono(i % 2 ? 480 : 440, 0.05, { tipo: 'square', vol: 0.05, filtro: 1800, retardo: r * 0.6 + i * 0.05 });
      }
    },
    vibracion: () => { for (let i = 0; i < 3; i++) tono(95, 0.12, { tipo: 'sawtooth', vol: 0.08, filtro: 220, retardo: i * 0.18 }); },
    puerta: () => { ruido(0.25, { vol: 0.25, desde: 900, hasta: 200 }); tono(70, 0.35, { tipo: 'sine', vol: 0.3, retardo: 0.18, hasta: 45 }); },
    fanfarria: () => {
      [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]].forEach(([f, r]) => tono(f, 0.5, { tipo: 'triangle', vol: 0.15, retardo: r }));
      [523, 659, 784].forEach((f) => tono(f, 1.1, { tipo: 'sine', vol: 0.07, retardo: 0.42 }));
    },
    tic: () => tono(1200, 0.03, { tipo: 'square', vol: 0.05, filtro: 3000 }),
    alarma: () => { tono(880, 0.09, { tipo: 'square', vol: 0.08, filtro: 2500 }); tono(880, 0.09, { tipo: 'square', vol: 0.08, filtro: 2500, retardo: 0.14 }); },
    barrido: () => ruido(0.45, { vol: 0.08, desde: 300, hasta: 3000, tipoFiltro: 'bandpass' }),
    sello: () => { tono(140, 0.2, { tipo: 'sine', vol: 0.3, hasta: 60 }); ruido(0.08, { vol: 0.15, desde: 2000 }); },
    logro: () => { [784, 988, 1175, 1568].forEach((f, i) => tono(f, 0.3, { tipo: 'triangle', vol: 0.12, retardo: i * 0.08 })); },
    ruptura: () => { [392, 311, 233].forEach((f, i) => tono(f, 0.5, { tipo: 'triangle', vol: 0.12, retardo: i * 0.22 })); }
  };

  function reproducir(nombre) {
    if (!activo || !desbloqueado) return;
    if (!crear()) return;
    if (ctx.state === 'suspended') ctx.resume();
    const f = SONIDOS[nombre];
    if (f) { try { f(); } catch (e) { /* el audio nunca debe romper el juego */ } }
  }
  function activar(si) {
    activo = !!si;
    if (maestro) maestro.gain.value = activo ? volumen : 0;
  }
  function fijarVolumen(v) {
    volumen = Math.max(0, Math.min(1, v));
    if (maestro && activo) maestro.gain.value = volumen;
  }

  /* Desbloqueo con el primer gesto del usuario + sonido de clic en botones */
  if (typeof document !== 'undefined') {
    const primerGesto = () => { desbloquear(); };
    document.addEventListener('pointerdown', primerGesto, { once: true, capture: true });
    document.addEventListener('keydown', primerGesto, { once: true, capture: true });
    document.addEventListener('click', (ev) => {
      const b = ev.target.closest && ev.target.closest('[data-sonido]');
      if (b && !b.disabled) reproducir(b.getAttribute('data-sonido'));
    }, true);
  }

  NG.Sonido = { reproducir, activar, fijarVolumen, activo: () => activo, desbloquear, SONIDOS };
})(typeof window !== 'undefined' ? window : globalThis);
