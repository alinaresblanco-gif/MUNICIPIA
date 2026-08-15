/* MUNICIPIA · Arranque, navegación y shell */
(function (global) {
  'use strict';

  var NAV = [
    { id: 'dashboard',     ic: '🏠', txt: 'Inicio',            bottom: true },
    { id: 'concejalias',   ic: '🏛️', txt: 'Concejalías',       bottom: true },
    { id: 'incidencias',   ic: '🚧', txt: 'Incidencias',       bottom: true },
    { id: 'proyectos',     ic: '📌', txt: 'Proyectos' },
    { id: 'documentos',    ic: '📁', txt: 'Documentoteca',     bottom: true },
    { id: 'calendario',    ic: '🗓️', txt: 'Calendario' },
    { id: 'chat',          ic: '💬', txt: 'Chat interno' },
    { id: 'transparencia', ic: '📊', txt: 'Transparencia' },
    { id: 'personal',      ic: '👤', txt: 'Zona personal',     bottom: true },
    { id: 'perfil',        ic: '⚙️', txt: 'Mi perfil' },
    { id: 'admin',         ic: '🛡️', txt: 'Administración', alcaldia: true }
  ];

  var vistaActual = 'dashboard';
  var vistaPrevia = 'dashboard';
  var paramsActuales = null;

  function pintarVista(id, params) {
    if (!Views[id] || !Auth.puede(id)) id = 'dashboard';
    if (id !== 'chat') vistaPrevia = id;
    vistaActual = id;
    paramsActuales = params || null;

    var root = document.getElementById('view-root');
    root.innerHTML = Views[id].render(params || {});
    if (Views[id].mount) Views[id].mount(root);

    document.getElementById('hdr-view-name').textContent = Views[id].titulo;
    document.title = 'MUNICIPIA · ' + Views[id].titulo;
    pintarNav();
    global.scrollTo({ top: 0, behavior: 'smooth' });
    cerrarSidebar();
    actualizarFab();
    document.getElementById('btn-back').classList.toggle('is-hidden', id === 'dashboard');
  }

  var App = {
    go: function (id, params) {
      if (!Views[id] || !Auth.puede(id)) id = 'dashboard';
      var estado = { municipia: true, vista: id, params: params || null };
      // volver a la misma vista (refrescos) no debe generar pasos de historial
      if (id === vistaActual) history.replaceState(estado, '', '#' + id);
      else history.pushState(estado, '', '#' + id);
      pintarVista(id, params);
      return false;
    },
    vista: function () { return vistaActual; },
    estado: function () { return { municipia: true, vista: vistaActual, params: paramsActuales }; }
  };
  global.App = App;

  /* Botón «atrás» del móvil: cierra el modal o vuelve a la vista anterior */
  global.addEventListener('popstate', function (e) {
    if (UI.modalAbierto()) { UI.closeModal(true); return; }
    if (sidebarAbierto) { cerrarSidebar(true); return; }
    if (!Auth.actual()) return;
    var st = e.state;
    if (st && st.municipia && st.vista) pintarVista(st.vista, st.params);
    else pintarVista(vistaDelHash());
  });

  function vistaDelHash() {
    var h = (location.hash || '').replace('#', '');
    return Views[h] && Auth.puede(h) ? h : 'dashboard';
  }

  /* ---------- Navegación ---------- */
  function navPermitida() {
    return NAV.filter(function (n) { return Auth.puede(n.id); });
  }

  function pintarNav() {
    var side = document.getElementById('sb-nav');
    side.innerHTML = navPermitida().map(function (n) {
      return '<button class="sb-item ' + (n.alcaldia ? 'alcaldia ' : '') + (vistaActual === n.id ? 'is-active' : '') + '" data-nav="' + n.id + '">' +
        '<span class="ic">' + n.ic + '</span>' + n.txt + '</button>';
    }).join('');

    var bottom = document.getElementById('bottom-nav');
    bottom.innerHTML = navPermitida().filter(function (n) { return n.bottom; }).slice(0, 5).map(function (n) {
      return '<button class="bn-item ' + (vistaActual === n.id ? 'is-active' : '') + '" data-nav="' + n.id + '">' +
        '<span class="ic">' + n.ic + '</span>' + n.txt + '</button>';
    }).join('');

    document.querySelectorAll('[data-nav]').forEach(function (b) {
      b.addEventListener('click', function () { App.go(b.dataset.nav); });
    });
  }

  var sidebarAbierto = false;

  function abrirSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sb-overlay').classList.add('show');
    if (!sidebarAbierto) {
      sidebarAbierto = true;
      history.pushState({ municipia: true, menu: true }, '', location.hash || '');
    }
  }

  function cerrarSidebar(desdeHistorial) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sb-overlay').classList.remove('show');
    var estaba = sidebarAbierto;
    sidebarAbierto = false;
    if (estaba && !desdeHistorial) history.replaceState(App.estado(), '', '#' + App.vista());
  }

  function actualizarFab() {
    var fab = document.getElementById('fab-chat');
    fab.classList.toggle('is-open', vistaActual === 'chat');
    fab.setAttribute('aria-label', vistaActual === 'chat' ? 'Cerrar chat' : 'Abrir chat interno');
    var badge = document.getElementById('fab-badge');
    var n = vistaActual === 'chat' ? 0 : Store.get('mensajes').filter(function (m) {
      return m.autor !== (Auth.actual() || {}).id && (Date.now() - new Date(m.fecha).getTime()) < 12 * 3600000;
    }).length;
    badge.textContent = n;
    badge.style.display = n ? 'grid' : 'none';
  }

  /* ---------- Sesión ---------- */
  function entrar(user) {
    document.getElementById('auth-screen').classList.add('is-hidden');
    document.getElementById('app-shell').classList.remove('is-hidden');
    var av = document.getElementById('btn-profile');
    av.textContent = UI.iniciales(user.nombre);
    av.title = user.nombre;
    var alertas = Store.get('alertas').filter(function (a) { return !a.leida; }).length;
    var b = document.getElementById('alert-badge');
    b.textContent = alertas;
    b.style.display = alertas ? 'grid' : 'none';
    var inicio = vistaDelHash();
    history.replaceState({ municipia: true, vista: inicio, params: null }, '', '#' + inicio);
    pintarVista(inicio);
    UI.toast('Bienvenido/a a MUNICIPIA', user.nombre + ' · ' + user.cargo, 'ok');
  }

  function salir() {
    Auth.logout();
    UI.closeModal(true);
    document.getElementById('app-shell').classList.add('is-hidden');
    document.getElementById('auth-screen').classList.remove('is-hidden');
    document.getElementById('form-login').reset();
    history.replaceState(null, '', location.pathname);
  }

  /* ---------- Pantalla de acceso ---------- */
  function initAuthUI() {
    var sel = document.querySelector('#form-signup select[name="area"]');
    sel.innerHTML = Store.get('areas').map(function (a) {
      return '<option value="' + a.id + '">' + a.icono + ' ' + a.nombre + '</option>';
    }).join('');

    document.querySelectorAll('[data-authtab]').forEach(function (t) {
      t.addEventListener('click', function () {
        document.querySelectorAll('[data-authtab]').forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
        var login = t.dataset.authtab === 'login';
        document.getElementById('form-login').classList.toggle('is-hidden', !login);
        document.getElementById('form-signup').classList.toggle('is-hidden', login);
      });
    });

    document.querySelectorAll('[data-toggle-pass]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = b.parentNode.querySelector('input');
        i.type = i.type === 'password' ? 'text' : 'password';
      });
    });

    document.getElementById('form-login').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      msg('login-msg', '');
      Auth.login(f.get('email'), f.get('password')).then(function (r) {
        if (!r.ok) return msg('login-msg', r.msg, r.tipo);
        entrar(r.user);
      });
    });

    document.getElementById('form-signup').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      if (f.get('password') !== f.get('password2')) return msg('signup-msg', 'Las contraseñas no coinciden.', 'error');
      Auth.solicitarAcceso({
        nombre: f.get('nombre'), cargo: f.get('cargo'), area: f.get('area'),
        email: f.get('email'), password: f.get('password')
      }).then(function (r) {
        if (!r.ok) return msg('signup-msg', r.msg, r.tipo);
        e.target.reset();
        return Auth.enviarCorreo(r.solicitud).then(function (enviado) {
          if (enviado) {
            return msg('signup-msg', 'Solicitud enviada a ' + Auth.ADMIN_EMAIL + ' para su autorización. ' +
              'Código de validación: ' + r.solicitud.token + '. Recibirás la confirmación por correo.', 'ok');
          }
          msg('signup-msg', 'Solicitud registrada. Se abrirá tu gestor de correo para enviarla a ' +
            Auth.ADMIN_EMAIL + '. Código de validación: ' + r.solicitud.token +
            '. Podrás acceder en cuanto se autorice tu alta.', 'ok');
          var a = document.createElement('a');
          a.href = r.mailto;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
      });
    });
  }

  function msg(id, texto, tipo) {
    var el = document.getElementById(id);
    el.textContent = texto || '';
    el.className = 'auth-msg' + (texto ? ' show ' + (tipo || 'info') : '');
  }

  /* ---------- Shell ---------- */
  function initShell() {
    document.getElementById('btn-logout').addEventListener('click', salir);
    document.getElementById('btn-profile').addEventListener('click', function () { App.go('perfil'); });
    document.getElementById('sb-overlay').addEventListener('click', function () { cerrarSidebar(); });

    document.getElementById('fab-chat').addEventListener('click', function () {
      App.go(vistaActual === 'chat' ? vistaPrevia : 'chat');
    });

    document.getElementById('btn-back').addEventListener('click', function (e) {
      e.stopPropagation();
      history.back();
    });

    document.getElementById('btn-alerts').addEventListener('click', function () {
      var al = Store.get('alertas');
      UI.modal('Alertas del sistema', al.length ? '<div class="list">' + al.map(function (a) {
        return '<div class="list-item" style="cursor:default"><div class="li-ic">' +
          (a.tipo === 'err' ? '🚨' : a.tipo === 'warn' ? '⚠️' : 'ℹ️') + '</div>' +
          '<div class="li-body"><div class="li-title" style="white-space:normal">' + UI.esc(a.texto) + '</div>' +
          '<div class="li-sub">' + UI.desde(a.fecha) + '</div></div></div>';
      }).join('') + '</div>' : UI.empty('🔔', 'Sin alertas'));
      Store.set('alertas', al.map(function (a) { a.leida = true; return a; }));
      var b = document.getElementById('alert-badge');
      b.textContent = '0'; b.style.display = 'none';
    });

    /* Menú lateral en móvil: el escudo abre la navegación */
    document.querySelector('.hdr-left').addEventListener('click', function () {
      if (global.innerWidth <= 900) {
        if (sidebarAbierto) cerrarSidebar(); else abrirSidebar();
      } else {
        App.go('dashboard');
      }
    });

    document.getElementById('modal-close').addEventListener('click', function () { UI.closeModal(); });
    document.getElementById('modal').addEventListener('click', function (e) {
      if (e.target.id === 'modal') UI.closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') UI.closeModal();
    });

    /* Acciones globales delegadas */
    document.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go]');
      if (go) { App.go(go.dataset.go); return; }
      var ni = e.target.closest('[data-nueva-incidencia]');
      if (ni) global.nuevaIncidencia();
    });
  }

  /* ---------- Arranque ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    Store.init(global.SEED);
    Auth.sincronizarUsuariosBase().then(function () {
      initAuthUI();
      initShell();
      var u = Auth.actual();
      if (u && u.estado === 'activo') entrar(u);
    });
  });
})(window);
