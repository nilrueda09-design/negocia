/* =====================================================================
 * NEGOCIA · visual/efectos.js
 * Feedback inmediato: números flotantes (+5 confianza), partículas al
 * acertar o fallar, sacudidas y destellos. Solo transform/opacity.
 * Con movimiento reducido se muestran estáticos o se omiten.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};
  const reducido = () => (NG.App && NG.App.movimientoReducido && NG.App.movimientoReducido());

  /* Número flotante en (x%, y%) de un contenedor posicionado. */
  function flotante(cont, x, y, texto, tipo) {
    if (!cont) return;
    const n = document.createElement('div');
    n.className = 'flotante ' + (tipo || 'neutro');
    n.textContent = texto;
    n.setAttribute('aria-hidden', 'true');
    n.style.left = x + '%';
    n.style.top = y + '%';
    cont.appendChild(n);
    setTimeout(() => n.remove(), reducido() ? 900 : 1800);
  }

  /* Partículas sutiles: 'acierto' (turquesa), 'error' (coral), 'oro' (ámbar). */
  const COLORES = { acierto: ['#3cc6b0', '#7fe6d5', '#ffffff'], error: ['#ff6b6b', '#ff9a8a'], oro: ['#f2b84b', '#ffd27a', '#fff4d6'] };
  function particulas(cont, x, y, tipo, cantidad) {
    if (!cont || reducido()) return;
    const cols = COLORES[tipo] || COLORES.oro;
    const n = cantidad || (tipo === 'oro' ? 26 : 12);
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'particula';
      const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * (tipo === 'oro' ? 160 : 70);
      p.style.left = x + '%'; p.style.top = y + '%';
      p.style.background = cols[i % cols.length];
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(ang) * dist - (tipo === 'error' ? -20 : 30) + 'px');
      const s = 4 + Math.random() * (tipo === 'oro' ? 8 : 5);
      p.style.width = p.style.height = s + 'px';
      p.style.animationDuration = (0.8 + Math.random() * 0.7) + 's';
      cont.appendChild(p);
      setTimeout(() => p.remove(), 1700);
    }
  }

  function sacudir(nodo) {
    if (!nodo || reducido()) return;
    nodo.classList.remove('sacudida'); void nodo.offsetWidth; nodo.classList.add('sacudida');
    setTimeout(() => nodo.classList.remove('sacudida'), 500);
  }

  /* Resalta un elemento brevemente (por ejemplo, una celda que cambia). */
  function resaltar(nodo, clase) {
    if (!nodo) return;
    const c = clase || 'resaltado';
    nodo.classList.remove(c); void nodo.offsetWidth; nodo.classList.add(c);
    setTimeout(() => nodo.classList.remove(c), 1600);
  }

  /* Animación de contador numérico (puntuaciones). */
  function contar(nodo, hasta, ms) {
    if (!nodo) return;
    if (reducido()) { nodo.textContent = hasta; return; }
    const t0 = performance.now(), dur = ms || 900;
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      nodo.textContent = Math.round(hasta * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
    setTimeout(() => { nodo.textContent = hasta; }, dur + 200);
  }

  NG.Efectos = { flotante, particulas, sacudir, resaltar, contar };
})(typeof window !== 'undefined' ? window : globalThis);
