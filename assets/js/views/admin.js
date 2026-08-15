/* Vista · Administración (usuarios, solicitudes, proveedores, auditoría) */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  var tab = 'solicitudes';

  global.Views.admin = {
    titulo: 'Administración',
    render: function () {
      var h = '<div class="page-head"><div><h2>Administración</h2><p>Usuarios, permisos, proveedores y auditoría del sistema</p></div></div>';
      h += '<div class="seg" style="margin-bottom:18px;width:max-content">' +
        s('solicitudes', '📨 Solicitudes de acceso') + s('usuarios', '👥 Usuarios y roles') +
        s('proveedores', '🏢 Proveedores') + s('auditoria', '🕵️ Auditoría') + '</div>';
      h += tab === 'solicitudes' ? solicitudes() : tab === 'usuarios' ? usuarios() : tab === 'proveedores' ? proveedores() : auditoria();
      return h;
    },
    mount: function (root) {
      root.querySelectorAll('[data-s]').forEach(function (b) {
        b.addEventListener('click', function () { tab = b.dataset.s; App.go('admin'); });
      });
      root.querySelectorAll('[data-aprobar]').forEach(function (b) {
        b.addEventListener('click', function () {
          var u = Auth.aprobar(b.dataset.aprobar);
          UI.toast('Acceso autorizado', u.nombre + ' ya puede entrar en MUNICIPIA.', 'ok');
          App.go('admin');
        });
      });
      root.querySelectorAll('[data-denegar]').forEach(function (b) {
        b.addEventListener('click', function () {
          Auth.denegar(b.dataset.denegar, 'Denegada desde el panel de administración');
          UI.toast('Solicitud denegada', '', 'err');
          App.go('admin');
        });
      });
      root.querySelectorAll('[data-rol]').forEach(function (sel) {
        sel.addEventListener('change', function () {
          Store.update('usuarios', sel.dataset.rol, { rol: sel.value });
          Store.log('cambio_rol', sel.dataset.rol + ' → ' + sel.value);
          UI.toast('Rol actualizado', '', 'ok');
        });
      });
      root.querySelectorAll('[data-baja]').forEach(function (b) {
        b.addEventListener('click', function () {
          var u = Store.find('usuarios', b.dataset.baja);
          Store.update('usuarios', u.id, { estado: u.estado === 'activo' ? 'bloqueado' : 'activo' });
          App.go('admin');
        });
      });
      var r = root.querySelector('[data-reset]');
      if (r) r.addEventListener('click', function () {
        if (confirm('¿Restablecer los datos de demostración? Se perderán los cambios locales.')) {
          Store.reset(SEED);
          Auth.migrarSemilla().then(function () { UI.toast('Datos restablecidos', '', 'warn'); App.go('admin'); });
        }
      });
    }
  };

  function s(id, t) { return '<button data-s="' + id + '" class="' + (tab === id ? 'is-active' : '') + '">' + t + '</button>'; }

  function solicitudes() {
    var sol = Store.get('solicitudes');
    var pend = sol.filter(function (x) { return x.estado === 'pendiente'; });
    var h = '<div class="card" style="margin-bottom:16px"><h3 class="card-t">📨 Pendientes de autorización (' + pend.length + ')</h3>';
    h += pend.length ? '<div class="list">' + pend.map(function (x) {
      return '<div class="list-item" style="cursor:default"><div class="li-ic" style="background:#FDF3E0;color:#8A5F0B">⏳</div>' +
        '<div class="li-body"><div class="li-title">' + UI.esc(x.nombre) + ' · ' + UI.esc(x.email) + '</div>' +
        '<div class="li-sub">' + UI.esc(x.cargo) + ' · ' + UI.esc(UI.area(x.area).nombre) + ' · código ' + UI.esc(x.token) + ' · ' + UI.desde(x.fecha) + '</div></div>' +
        '<div class="row"><a class="btn btn-ghost btn-sm" href="' + Auth.enlaceCorreo(x) + '">✉ Reenviar</a>' +
        '<button class="btn btn-danger btn-sm" data-denegar="' + x.id + '">Denegar</button>' +
        '<button class="btn btn-green btn-sm" data-aprobar="' + x.id + '">Autorizar</button></div></div>';
    }).join('') + '</div>' : UI.empty('📭', 'No hay solicitudes pendientes');
    h += '</div>';

    var hist = sol.filter(function (x) { return x.estado !== 'pendiente'; });
    h += '<div class="card"><h3 class="card-t">Histórico de solicitudes</h3><div class="list">' +
      (hist.length ? hist.map(function (x) {
        return '<div class="list-item" style="cursor:default"><div class="li-ic">' + (x.estado === 'aprobada' ? '✅' : '⛔') + '</div>' +
          '<div class="li-body"><div class="li-title">' + UI.esc(x.nombre) + '</div><div class="li-sub">' + UI.esc(x.email) + ' · ' + UI.fmtFecha(x.resuelta || x.fecha) + '</div></div>' +
          '<span class="chip ' + (x.estado === 'aprobada' ? 'green' : 'red') + '">' + x.estado + '</span></div>';
      }).join('') : UI.empty('🗂️', 'Sin histórico')) + '</div></div>';
    return h;
  }

  function usuarios() {
    return '<div class="card"><h3 class="card-t">👥 Usuarios del sistema <button class="btn btn-ghost btn-sm" data-reset>♻ Restablecer datos demo</button></h3>' +
      '<div style="overflow-x:auto"><table class="table"><thead><tr><th>Usuario</th><th>Área</th><th>Rol</th><th>Estado</th><th>Alta</th><th></th></tr></thead><tbody>' +
      Store.get('usuarios').map(function (u) {
        return '<tr><td><b>' + UI.esc(u.nombre) + '</b><div class="mini">' + UI.esc(u.email) + '</div></td>' +
          '<td>' + UI.area(u.area).icono + ' ' + UI.esc(UI.area(u.area).nombre) + '</td>' +
          '<td><select data-rol="' + u.id + '" style="padding:6px;border-radius:8px;border:1px solid var(--linea)">' +
          Object.keys(Auth.ROLES).map(function (r) { return '<option value="' + r + '" ' + (u.rol === r ? 'selected' : '') + '>' + Auth.ROLES[r].etiqueta + '</option>'; }).join('') +
          '</select></td>' +
          '<td><span class="chip ' + (u.estado === 'activo' ? 'green' : 'red') + '">' + u.estado + '</span></td>' +
          '<td>' + UI.fmtFecha(u.alta) + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" data-baja="' + u.id + '">' + (u.estado === 'activo' ? 'Bloquear' : 'Activar') + '</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function proveedores() {
    return '<div class="grid g-2">' + Store.get('proveedores').map(function (p) {
      return '<div class="card"><div class="spread"><h4>🏢 ' + UI.esc(p.nombre) + '</h4>' +
        '<span class="chip amber">' + '★'.repeat(p.valoracion) + '</span></div>' +
        '<p class="mini" style="margin-top:6px">CIF ' + UI.esc(p.cif) + '</p>' +
        '<div class="grid g-2" style="gap:8px;margin-top:12px">' +
        '<div style="background:var(--gris);border-radius:10px;padding:9px"><div class="mini">Contacto</div><div style="font-size:.84rem">' + UI.esc(p.contacto) + '</div></div>' +
        '<div style="background:var(--gris);border-radius:10px;padding:9px"><div class="mini">Teléfono</div><div style="font-size:.84rem">' + UI.esc(p.tel) + '</div></div></div>' +
        '<p class="mini" style="margin-top:10px">' + p.contratos + ' contratos adjudicados</p></div>';
    }).join('') + '</div>';
  }

  function auditoria() {
    var logs = Store.get('auditoria').slice(0, 60);
    return '<div class="card"><h3 class="card-t">🕵️ Registro de acciones</h3><div style="overflow-x:auto">' +
      '<table class="table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>' +
      (logs.length ? logs.map(function (l) {
        return '<tr><td>' + new Date(l.fecha).toLocaleString('es-ES') + '</td><td>' + UI.esc(l.usuario) + '</td>' +
          '<td><span class="chip blue">' + UI.esc(l.accion) + '</span></td><td>' + UI.esc(l.detalle) + '</td></tr>';
      }).join('') : '<tr><td colspan="4">' + UI.empty('🕵️', 'Sin registros todavía') + '</td></tr>') +
      '</tbody></table></div></div>';
  }
})(window);
