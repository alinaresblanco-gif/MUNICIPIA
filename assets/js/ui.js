/* MUNICIPIA · Utilidades de interfaz */
(function (global) {
  'use strict';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function toast(titulo, texto, tipo) {
    var stack = document.getElementById('toast-stack');
    var el = document.createElement('div');
    el.className = 'toast ' + (tipo || '');
    el.innerHTML = '<b>' + esc(titulo) + '</b>' + (texto ? esc(texto) : '');
    stack.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(30px)';
      setTimeout(function () { el.remove(); }, 320);
    }, 3600);
  }

  var modalEl = null;
  function modal(titulo, html) {
    modalEl = modalEl || document.getElementById('modal');
    document.getElementById('modal-title').textContent = titulo;
    document.getElementById('modal-body').innerHTML = html;
    modalEl.classList.add('show');
    modalEl.setAttribute('aria-hidden', 'false');
    return document.getElementById('modal-body');
  }
  function closeModal() {
    modalEl = modalEl || document.getElementById('modal');
    modalEl.classList.remove('show');
    modalEl.setAttribute('aria-hidden', 'true');
  }

  function fmtFecha(iso) {
    if (!iso) return '—';
    var d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtHora(iso) {
    var d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  function desde(iso) {
    var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return 'hace ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 24) return 'hace ' + h + ' h';
    var d = Math.round(h / 24);
    return d === 1 ? 'ayer' : 'hace ' + d + ' días';
  }
  function eur(n) {
    return (n || 0).toLocaleString('es-ES') + ' €';
  }
  function iniciales(nombre) {
    return (nombre || '?').split(' ').slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
  }
  function area(id) {
    return (Store.get('areas').filter(function (a) { return a.id === id; })[0]) || { nombre: '—', icono: '📁', color: '#6B7788' };
  }
  function usuario(id) {
    return (Store.get('usuarios').filter(function (u) { return u.id === id; })[0]) || { nombre: 'Sin asignar', cargo: '' };
  }
  function chipEstado(estado) {
    var m = { 'Abierta': 'red', 'En proceso': 'amber', 'Resuelta': 'green', 'Cerrada': 'gray', 'En ejecución': 'blue', 'Planificación': 'purple', 'Finalizado': 'green' };
    return '<span class="chip ' + (m[estado] || 'gray') + '">' + esc(estado) + '</span>';
  }
  function chipPrioridad(p) {
    var m = { 'Crítica': 'red', 'Alta': 'amber', 'Media': 'blue', 'Baja': 'gray' };
    return '<span class="chip ' + (m[p] || 'gray') + '">' + esc(p) + '</span>';
  }
  function colorEstado(estado) {
    return { 'Abierta': '#D93A3A', 'En proceso': '#E9A319', 'Resuelta': '#3FA66B', 'Cerrada': '#6B7788' }[estado] || '#1A4D8F';
  }
  function pct(a, b) {
    return b ? Math.round((a / b) * 100) : 0;
  }
  function empty(icono, texto) {
    return '<div class="empty"><div class="e-ic">' + icono + '</div><p>' + esc(texto) + '</p></div>';
  }

  global.UI = {
    esc: esc, toast: toast, modal: modal, closeModal: closeModal,
    fmtFecha: fmtFecha, fmtHora: fmtHora, desde: desde, eur: eur,
    iniciales: iniciales, area: area, usuario: usuario,
    chipEstado: chipEstado, chipPrioridad: chipPrioridad, colorEstado: colorEstado,
    pct: pct, empty: empty
  };
})(window);
