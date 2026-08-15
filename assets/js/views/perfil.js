/* Vista · Perfil del usuario */
(function (global) {
  'use strict';
  global.Views = global.Views || {};

  global.Views.perfil = {
    titulo: 'Mi perfil',
    render: function () {
      var u = Auth.actual();
      var a = UI.area(u.area);
      var h = '<div class="page-head"><div><h2>Mi perfil</h2><p>Datos personales, competencias y seguridad de la cuenta</p></div></div>';

      h += '<div class="grid g-2-1"><div class="stack">' +
        '<div class="card"><div class="row" style="align-items:center">' +
        '<div class="li-ic" style="width:66px;height:66px;font-size:1.3rem;background:' + a.color + ';color:#fff;font-weight:700">' + UI.iniciales(u.nombre) + '</div>' +
        '<div><h3>' + UI.esc(u.nombre) + '</h3><p class="muted">' + UI.esc(u.cargo) + '</p>' +
        '<div class="row" style="margin-top:8px"><span class="chip" style="background:' + a.color + '1a;color:' + a.color + '">' + a.icono + ' ' + UI.esc(a.nombre) + '</span>' +
        '<span class="chip blue">' + (Auth.ROLES[u.rol] || {}).etiqueta + '</span>' +
        '<span class="chip green">' + UI.esc(u.estado) + '</span></div></div></div></div>';

      h += '<div class="card"><h3 class="card-t">📇 Datos de contacto</h3>' +
        '<form id="f-perfil"><div class="grid-2">' +
        '<label class="field"><span>Nombre y apellidos</span><input name="nombre" value="' + UI.esc(u.nombre) + '" required /></label>' +
        '<label class="field"><span>Cargo</span><input name="cargo" value="' + UI.esc(u.cargo) + '" required /></label></div>' +
        '<label class="field"><span>Correo (usuario de acceso)</span><input value="' + UI.esc(u.email) + '" disabled /></label>' +
        '<button class="btn btn-primary">Guardar cambios</button></form></div>';

      h += '<div class="card"><h3 class="card-t">🔐 Seguridad</h3>' +
        '<form id="f-pass"><div class="grid-2">' +
        '<label class="field"><span>Contraseña actual</span><input type="password" name="actual" required /></label>' +
        '<label class="field"><span>Nueva contraseña</span><input type="password" name="nueva" minlength="6" required /></label></div>' +
        '<button class="btn btn-ghost">Cambiar contraseña</button></form></div>';

      h += '</div><div class="stack">' +
        '<div class="card"><h3 class="card-t">🎯 Mis competencias</h3><div class="row">' +
        competencias(u.area).map(function (c) { return '<span class="chip blue">' + c + '</span>'; }).join('') + '</div></div>' +
        '<div class="card"><h3 class="card-t">📊 Resumen de actividad</h3>' +
        fila('Incidencias asignadas', Store.get('incidencias').filter(function (i) { return i.responsable === u.id; }).length) +
        fila('Proyectos en los que participo', Store.get('proyectos').filter(function (p) { return p.equipo.indexOf(u.id) !== -1; }).length) +
        fila('Documentos aportados', Store.get('documentos').filter(function (d) { return d.autor === u.id; }).length) +
        fila('Mensajes enviados', Store.get('mensajes').filter(function (m) { return m.autor === u.id; }).length) +
        fila('Alta en el sistema', UI.fmtFecha(u.alta)) + '</div>' +
        '<div class="card"><h3 class="card-t">⚙️ Preferencias</h3>' +
        '<label class="check"><input type="checkbox" checked /><span>Notificaciones de incidencias urgentes</span></label>' +
        '<label class="check"><input type="checkbox" checked /><span>Recordatorios de plazos administrativos</span></label>' +
        '<label class="check"><input type="checkbox" /><span>Resumen diario por correo</span></label></div>' +
        '</div></div>';
      return h;
    },
    mount: function (root) {
      root.querySelector('#f-perfil').addEventListener('submit', function (e) {
        e.preventDefault();
        var f = new FormData(e.target);
        Store.update('usuarios', Auth.actual().id, { nombre: f.get('nombre'), cargo: f.get('cargo') });
        Store.log('perfil_editado', '');
        UI.toast('Perfil actualizado', '', 'ok');
        App.go('perfil');
      });
      root.querySelector('#f-pass').addEventListener('submit', function (e) {
        e.preventDefault();
        var f = new FormData(e.target);
        var u = Auth.actual();
        Store.hashPassword(f.get('actual'), u.salt).then(function (h) {
          if (h !== u.hash) return UI.toast('Contraseña incorrecta', 'Revisa la contraseña actual.', 'err');
          var salt = Store.randomSalt();
          return Store.hashPassword(f.get('nueva'), salt).then(function (nh) {
            Store.update('usuarios', u.id, { salt: salt, hash: nh });
            Store.log('cambio_password', u.email);
            UI.toast('Contraseña actualizada', 'Usa la nueva en tu próximo acceso.', 'ok');
            e.target.reset();
          });
        });
      });
    }
  };

  function competencias(area) {
    var m = {
      urbanismo: ['Licencias', 'Planeamiento', 'Obra pública', 'Disciplina urbanística'],
      cultura: ['Programación cultural', 'Patrimonio', 'Biblioteca', 'Talleres'],
      deportes: ['Instalaciones', 'Escuelas deportivas', 'Eventos'],
      servicios: ['Limpieza viaria', 'Alumbrado', 'Jardines', 'Mantenimiento'],
      igualdad: ['Planes de igualdad', 'Violencia de género', 'Conciliación'],
      juventud: ['Ocio juvenil', 'Formación', 'Empleo joven'],
      medioamb: ['Residuos', 'Sostenibilidad', 'Zonas verdes'],
      festejos: ['Feria', 'Fiestas patronales', 'Verbenas'],
      hacienda: ['Presupuesto', 'Contratación', 'Tesorería'],
      alcaldia: ['Representación', 'Coordinación', 'Relaciones institucionales']
    };
    return m[area] || ['Gestión municipal'];
  }

  function fila(l, v) {
    return '<div class="spread" style="padding:9px 0;border-bottom:1px solid var(--linea)"><span class="mini">' + l + '</span><b style="font-size:.9rem">' + v + '</b></div>';
  }
})(window);
