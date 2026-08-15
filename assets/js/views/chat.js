/* Vista · Chat interno */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  var salaActual = 'sala-general';

  global.Views.chat = {
    titulo: 'Chat interno',
    render: function (params) {
      if (params && params.sala) salaActual = params.sala;
      var salas = Store.get('salas');
      var sala = Store.find('salas', salaActual) || salas[0];

      var h = '<div class="chat-wrap">';
      h += '<div class="chat-side"><div class="chat-side-h">💬 Conversaciones</div><div class="chat-rooms">' +
        grupo('Canales', salas.filter(function (s) { return s.tipo === 'general'; })) +
        grupo('Concejalías', salas.filter(function (s) { return s.tipo === 'area'; })) +
        grupo('Proyectos', salas.filter(function (s) { return s.tipo === 'proyecto'; })) +
        grupo('Privados', salas.filter(function (s) { return s.tipo === 'privado'; })) +
        '</div><button class="btn btn-ghost btn-sm" style="margin:8px" data-nuevo-privado>＋ Chat privado</button></div>';

      h += '<div class="chat-main"><div class="chat-h"><div class="room-ic">' + (sala.icono || '💬') + '</div>' +
        '<div><h4 style="font-size:.98rem">' + UI.esc(sala.nombre) + '</h4><p class="mini">' + UI.esc(sala.miembros || '') + '</p></div></div>' +
        '<div class="chat-body" id="chat-body">' + mensajes(sala.id) + '</div>' +
        '<form class="chat-input" id="chat-form"><input id="chat-txt" placeholder="Escribe un mensaje…" autocomplete="off" />' +
        '<button class="chat-send" type="submit" aria-label="Enviar">➤</button></form></div>';
      h += '</div>';
      return h;
    },
    mount: function (root) {
      root.querySelectorAll('[data-sala]').forEach(function (el) {
        el.addEventListener('click', function () { salaActual = el.dataset.sala; App.go('chat'); });
      });
      var body = root.querySelector('#chat-body');
      if (body) body.scrollTop = body.scrollHeight;
      var form = root.querySelector('#chat-form');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = root.querySelector('#chat-txt');
        var txt = input.value.trim();
        if (!txt) return;
        Store.insert('mensajes', { id: Store.uid('m'), sala: salaActual, autor: Auth.actual().id, texto: txt, fecha: new Date().toISOString() });
        input.value = '';
        body.innerHTML = mensajes(salaActual);
        body.scrollTop = body.scrollHeight;
      });
      root.querySelector('[data-nuevo-privado]').addEventListener('click', nuevoPrivado);
    }
  };

  function grupo(titulo, salas) {
    if (!salas.length) return '';
    return '<div class="mini" style="padding:10px 10px 4px;font-weight:700;text-transform:uppercase;letter-spacing:.6px">' + titulo + '</div>' +
      salas.map(function (s) {
        var ult = Store.get('mensajes').filter(function (m) { return m.sala === s.id; })[0];
        return '<div class="room ' + (s.id === salaActual ? 'is-active' : '') + '" data-sala="' + s.id + '">' +
          '<div class="room-ic" style="' + (s.tipo === 'area' && s.area ? 'background:' + UI.area(s.area).color : '') + '">' + (s.icono || '💬') + '</div>' +
          '<div style="flex:1;min-width:0"><div class="li-title">' + UI.esc(s.nombre) + '</div>' +
          '<div class="li-sub">' + (ult ? UI.esc(ult.texto) : 'Sin mensajes') + '</div></div></div>';
      }).join('');
  }

  function mensajes(salaId) {
    var yo = Auth.actual().id;
    var lista = Store.get('mensajes').filter(function (m) { return m.sala === salaId; })
      .sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
    if (!lista.length) return UI.empty('💬', 'Sé el primero en escribir en este canal');
    var out = '', dia = '';
    lista.forEach(function (m) {
      var d = UI.fmtFecha(m.fecha);
      if (d !== dia) { dia = d; out += '<div class="chat-day">' + d + '</div>'; }
      var mio = m.autor === yo;
      out += '<div class="msg ' + (mio ? 'me' : '') + '">' +
        (mio ? '' : '<div class="who">' + UI.esc(UI.usuario(m.autor).nombre) + '</div>') +
        UI.esc(m.texto) + '<div class="when">' + UI.fmtHora(m.fecha) + '</div></div>';
    });
    return out;
  }

  function nuevoPrivado() {
    var yo = Auth.actual().id;
    var users = Store.get('usuarios').filter(function (u) { return u.id !== yo; });
    var body = UI.modal('Nuevo chat privado',
      '<form id="f-priv"><label class="field"><span>Destinatario</span><select name="u">' +
      users.map(function (u) { return '<option value="' + u.id + '">' + UI.esc(u.nombre) + ' · ' + UI.esc(u.cargo) + '</option>'; }).join('') +
      '</select></label><button class="btn btn-primary btn-block">Abrir conversación</button></form>');
    body.querySelector('#f-priv').addEventListener('submit', function (e) {
      e.preventDefault();
      var id = new FormData(e.target).get('u');
      var u = UI.usuario(id);
      var salaId = 'sala-priv-' + [yo, id].sort().join('-');
      if (!Store.find('salas', salaId)) {
        Store.insert('salas', { id: salaId, nombre: u.nombre, tipo: 'privado', icono: UI.iniciales(u.nombre), miembros: 'Conversación privada' });
      }
      salaActual = salaId;
      UI.closeModal();
      App.go('chat');
    });
  }
})(window);
