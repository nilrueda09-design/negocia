/* =====================================================================
 * NEGOCIA · ui/componentes.js
 * Utilidades de interfaz: creación de nodos, iconos SVG, modales
 * accesibles (foco atrapado, Esc), avisos, anunciador ARIA y medidores.
 * ===================================================================== */
(function (raiz) {
  'use strict';
  const NG = raiz.NG = raiz.NG || {};

  /* ---------- Iconos (24×24, trazo) ---------- */
  const P = {
    euro: 'M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9',
    calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    caja: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
    persona: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
    grafico: 'M4 20V4M4 20h16M8 16l4-5 3 3 5-7',
    brujula: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
    indice: 'M4 18l5-6 4 3 7-9M15 6h5v5',
    fabrica: 'M3 21V10l6 3V10l6 3V6h6v15zM7 17h2M12 17h2M17 17h2',
    cafe: 'M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2.5 2.5 0 0 1 0 5h-2M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4',
    carpeta: 'M3 7h7l2 2h9v10H3z',
    telefono: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z',
    movil: 'M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2',
    mensaje: 'M4 5h16v11H9l-5 4z',
    puerta: 'M6 21V3h10v18M3 21h18M13 12h.01',
    reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3',
    sonido: 'M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
    silencio: 'M4 10v4h4l5 4V6L8 10zM17 9l5 6M22 9l-5 6',
    ajustes: 'M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4M4 12h5M13 12h7M11 10v4',
    ayuda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01',
    candado: 'M6 11h12v10H6zM8 11V7a4 4 0 1 1 8 0v4',
    estrella: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z',
    trofeo: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M10 17h4v4h-4z',
    libro: 'M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z',
    mapa: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
    flecha: 'M5 12h14M13 6l6 6-6 6',
    atras: 'M19 12H5M11 6l-6 6 6 6',
    check: 'M5 12l5 5 9-10',
    x: 'M6 6l12 12M18 6L6 18',
    pausa: 'M8 5v14M16 5v14',
    pregunta: 'M8 9a4 4 0 1 1 5.5 3.7c-.9.4-1.5 1.2-1.5 2.1V16M12 20h.01',
    compartir: 'M12 15V3M8 7l4-4 4 4M5 13v7h14v-7',
    presion: 'M13 2L4 14h7l-1 8 9-12h-7z',
    oferta: 'M4 12l8-8h8v8l-8 8zM15.5 8.5h.01',
    concesion: 'M7 17L17 7M9 7h8v8',
    meso: 'M4 5h7v6H4zM13 5h7v6h-7zM8.5 13h7v6h-7z',
    apreton: 'M2 12l4-4 4 2 3-3 4 1 5 5-4 4-3-1-3 3-3-2-3 1zM10 10l3 3',
    salir: 'M15 3h5v18h-5M10 17l5-5-5-5M15 12H3',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
    lupa: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    chincheta: 'M9 3h6l-1 6 3 3H7l3-3zM12 12v9',
    bandera: 'M5 21V4M5 4h12l-2 4 2 4H5',
    ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    rayo: 'M13 2L4 14h7l-1 8 9-12h-7z',
    corazon: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
    cerebro: 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z',
    escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    personas: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c.8-3.4 3.4-5 7-5s6.2 1.6 7 5M16 4.5a3.5 3.5 0 0 1 0 6.8M18 15c2 .6 3.4 2.2 4 5',
    repetir: 'M4 4v6h6M20 20v-6h-6M5.5 15a8 8 0 0 0 14 2M18.5 9a8 8 0 0 0-14-2',
    play: 'M7 4l13 8-13 8z',
    diana: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01'
  };
  function icono(nombre, clase) {
    const d = P[nombre] || P.info;
    return '<svg class="' + (clase || 'icono') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  }

  /* Emblema del juego: dos posiciones que convergen hacia un acuerdo. */
  let nEmblema = 0;
  function emblema(clase) {
    const u = 'emb' + (++nEmblema); // ids únicos: un degradado dentro de un nodo oculto no se pinta en otro
    return '<svg class="' + (clase || 'emblema') + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + u + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e0a034"/></linearGradient>' +
      '<linearGradient id="' + u + 'b" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ee6d2"/><stop offset="1" stop-color="#1f8f7e"/></linearGradient></defs>' +
      '<path d="M6 14 L30 32 L6 50 L6 38 L16 32 L6 26 Z" fill="url(#' + u + 'a)"/>' +
      '<path d="M58 14 L34 32 L58 50 L58 38 L48 32 L58 26 Z" fill="url(#' + u + 'b)"/>' +
      '<circle cx="32" cy="32" r="5" fill="#fff4d6"/></svg>';
  }

  /* ---------- DOM ---------- */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escapar = (t) => String(t === undefined || t === null ? '' : t).replace(/[&<>"']/g, (c) => ESC[c]);

  /* el('button', {class:'btn', onclick: fn, 'aria-label': 'x'}, [hijos | 'texto' | '<html>']) */
  function el(tag, attrs, hijos) {
    const n = document.createElement(tag);
    Object.keys(attrs || {}).forEach((k) => {
      const v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k.indexOf('on') === 0 && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'texto') n.textContent = v;
      else if (v === true) n.setAttribute(k, '');
      else n.setAttribute(k, v);
    });
    (Array.isArray(hijos) ? hijos : hijos !== undefined ? [hijos] : []).forEach((h) => {
      if (h === null || h === undefined || h === false) return;
      if (typeof h === 'string') n.insertAdjacentHTML('beforeend', h);
      else n.appendChild(h);
    });
    return n;
  }
  const $ = (sel, raizN) => (raizN || document).querySelector(sel);
  const $$ = (sel, raizN) => Array.from((raizN || document).querySelectorAll(sel));

  function boton(o) {
    const b = el('button', {
      type: 'button', class: 'btn ' + (o.clase || ''), 'aria-label': o.aria, disabled: o.deshabilitado, title: o.titulo,
      'data-sonido': o.sonido === false ? null : 'clic', onclick: o.onClick
    }, (o.icono ? icono(o.icono) : '') + '<span>' + escapar(o.texto) + '</span>' + (o.iconoFinal ? icono(o.iconoFinal) : ''));
    return b;
  }

  /* ---------- Anunciador para lectores de pantalla ---------- */
  function anunciar(texto) {
    const a = document.getElementById('anunciador');
    if (!a) return;
    a.textContent = '';
    setTimeout(() => { a.textContent = texto; }, 40);
  }

  /* ---------- Avisos ---------- */
  function toast(o) {
    const cont = document.getElementById('toasts');
    if (!cont) return;
    const t = el('div', { class: 'toast', role: 'status' }, [
      '<div class="toast-icono">' + icono(o.icono || 'info') + '</div>',
      el('div', {}, ['<strong>' + escapar(o.titulo) + '</strong>', o.texto ? '<small>' + escapar(o.texto) + '</small>' : ''])
    ]);
    cont.appendChild(t);
    setTimeout(() => { t.classList.add('saliendo'); setTimeout(() => t.remove(), 400); }, o.duracion || 4200);
  }

  /* ---------- Modal accesible ---------- */
  let modalActual = null;
  function modal(o) {
    cerrarModal(true);
    const capa = document.getElementById('capa-modal');
    const previo = document.activeElement;
    const idTitulo = 'modal-titulo-' + Date.now();
    const caja = el('div', { class: 'modal ' + (o.clase || ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': idTitulo });
    caja.appendChild(el('div', { class: 'modal-cabecera' }, [
      o.icono ? '<div class="toast-icono">' + icono(o.icono) + '</div>' : '',
      el('h2', { id: idTitulo, texto: o.titulo }),
      o.cerrable === false ? null : el('button', { type: 'button', class: 'btn-icono', 'aria-label': 'Cerrar', onclick: () => cerrarModal() }, icono('x'))
    ]));
    const cuerpo = el('div', { class: 'modal-cuerpo' });
    if (typeof o.contenido === 'string') cuerpo.innerHTML = o.contenido; else if (o.contenido) cuerpo.appendChild(o.contenido);
    caja.appendChild(cuerpo);
    if (o.acciones && o.acciones.length) {
      const pie = el('div', { class: 'modal-pie' });
      o.acciones.forEach((a) => pie.appendChild(boton({ texto: a.texto, icono: a.icono, clase: a.clase || '', onClick: () => { if (a.cerrar !== false) cerrarModal(); if (a.onClick) a.onClick(); } })));
      caja.appendChild(pie);
    }
    capa.innerHTML = '';
    capa.appendChild(caja);
    capa.hidden = false;
    const teclas = (ev) => {
      if (ev.key === 'Escape' && o.cerrable !== false) { ev.preventDefault(); cerrarModal(); }
      if (ev.key === 'Tab') {
        const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', caja).filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
        else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
    };
    capa.addEventListener('keydown', teclas);
    const alClicFuera = (ev) => { if (ev.target === capa && o.cerrable !== false) cerrarModal(); };
    capa.addEventListener('click', alClicFuera);
    modalActual = { capa, previo, teclas, alClicFuera, alCerrar: o.alCerrar };
    setTimeout(() => {
      const primero = $('.modal-pie .btn-primario', caja) || $('.modal-pie .btn', caja) || $('button, input, select', cuerpo) || $('button', caja);
      if (primero) primero.focus();
    }, 30);
    return { cerrar: () => cerrarModal(), caja, cuerpo };
  }
  function cerrarModal(silencioso) {
    if (!modalActual) return;
    const m = modalActual;
    modalActual = null;
    m.capa.removeEventListener('keydown', m.teclas);
    m.capa.removeEventListener('click', m.alClicFuera);
    m.capa.hidden = true;
    m.capa.innerHTML = '';
    if (m.previo && m.previo.focus && document.body.contains(m.previo)) m.previo.focus();
    if (!silencioso && m.alCerrar) m.alCerrar();
  }

  /* ---------- Medidor ---------- */
  function medidor(o) {
    const n = el('div', { class: 'medidor ' + (o.clase || '') });
    n.innerHTML = '<div class="medidor-cabecera"><span>' + (o.icono ? icono(o.icono, 'icono-en-linea') + ' ' : '') + escapar(o.etiqueta) + '</span><span class="valor"></span></div>' +
      '<div class="medidor-pista" role="meter" aria-label="' + escapar(o.etiqueta) + '" aria-valuemin="0" aria-valuemax="' + (o.max || 100) + '"><div class="medidor-relleno"></div></div>';
    const api = {
      el: n,
      fijar(valor, max, texto) {
        max = max || o.max || 100;
        const pct = Math.max(0, Math.min(100, (valor / max) * 100));
        n.querySelector('.medidor-relleno').style.width = pct + '%';
        n.querySelector('.valor').textContent = texto !== undefined ? texto : Math.round(valor);
        const pista = n.querySelector('.medidor-pista');
        pista.setAttribute('aria-valuenow', Math.round(valor));
        pista.setAttribute('aria-valuemax', max);
        if (o.alFijar) o.alFijar(n, valor, max);
        n.classList.remove('pulso'); void n.offsetWidth; n.classList.add('pulso');
      }
    };
    if (o.valor !== undefined) api.fijar(o.valor, o.max);
    return api;
  }

  function estrellas(n, total) {
    let s = '<span class="estrellas" aria-label="' + n + ' de ' + (total || 3) + ' estrellas">';
    for (let i = 0; i < (total || 3); i++) s += '<span class="' + (i < n ? 'llena' : '') + '">' + icono('estrella') + '</span>';
    return s + '</span>';
  }

  NG.UI = { icono, emblema, escapar, el, $, $$, boton, anunciar, toast, modal, cerrarModal, medidor, estrellas, ICONOS: P };
})(typeof window !== 'undefined' ? window : globalThis);
