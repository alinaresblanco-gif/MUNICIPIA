/* MUNICIPIA · Autenticación y control de acceso */
(function (global) {
  'use strict';

  var ADMIN_EMAIL = 'alinares.blanco@gmail.com';

  /* Opcional: URL /exec de un Web App de Google Apps Script que envíe el correo
     de validación automáticamente. Si queda vacío, se usa el cliente de correo del dispositivo. */
  var MAIL_ENDPOINT = '';

  var ROLES = {
    admin:    { etiqueta: 'Administrador', vistas: '*' },
    alcalde:  { etiqueta: 'Alcaldía', vistas: '*' },
    concejal: { etiqueta: 'Concejal/a', vistas: ['dashboard', 'concejalias', 'incidencias', 'proyectos', 'documentos', 'calendario', 'chat', 'transparencia', 'personal', 'perfil'] },
    tecnico:  { etiqueta: 'Técnico municipal', vistas: ['dashboard', 'incidencias', 'proyectos', 'documentos', 'calendario', 'chat', 'personal', 'perfil'] }
  };

  /* Convierte las contraseñas de demo (tempPass) en hash con sal la primera vez. */
  function migrarSemilla() {
    var pendientes = Store.get('usuarios').filter(function (u) { return u.tempPass; });
    if (!pendientes.length) return Promise.resolve();
    return Promise.all(pendientes.map(function (u) {
      var salt = Store.randomSalt();
      return Store.hashPassword(u.tempPass, salt).then(function (h) {
        delete u.tempPass;
        u.salt = salt;
        u.hash = h;
      });
    })).then(function () { Store.save(); });
  }

  /* Añade los usuarios oficiales que aún no existan en el dispositivo (altas posteriores a la instalación). */
  function sincronizarUsuariosBase() {
    var base = (global.SEED ? global.SEED().usuarios : []) || [];
    var nuevos = base.filter(function (u) { return !porEmail(u.email); });
    nuevos.forEach(function (u) { Store.insert('usuarios', u); });
    return migrarSemilla();
  }

  function porEmail(email) {
    var e = String(email || '').trim().toLowerCase();
    return Store.get('usuarios').filter(function (u) { return u.email.toLowerCase() === e; })[0] || null;
  }

  function solicitudPorEmail(email) {
    var e = String(email || '').trim().toLowerCase();
    return Store.get('solicitudes').filter(function (s) { return s.email.toLowerCase() === e; })[0] || null;
  }

  function login(email, password) {
    return migrarSemilla().then(function () {
      var u = porEmail(email);
      if (!u) {
        var sol = solicitudPorEmail(email);
        if (sol && sol.estado === 'pendiente') {
          return { ok: false, tipo: 'info', msg: 'Tu solicitud de acceso está pendiente de autorización por el Ayuntamiento. Recibirás confirmación en tu correo.' };
        }
        if (sol && sol.estado === 'denegada') {
          return { ok: false, tipo: 'error', msg: 'Tu solicitud de acceso fue denegada. Contacta con Alcaldía.' };
        }
        return { ok: false, tipo: 'error', msg: 'Este correo no está registrado. Solicita acceso en la pestaña «Solicitar acceso».' };
      }
      if (u.estado !== 'activo') {
        return { ok: false, tipo: 'info', msg: 'Cuenta no activa. Requiere autorización del administrador.' };
      }
      return Store.hashPassword(password, u.salt).then(function (h) {
        if (h !== u.hash) return { ok: false, tipo: 'error', msg: 'Contraseña incorrecta. Inténtalo de nuevo.' };
        Store.setSession(u, true);
        Store.log('login', u.email);
        return { ok: true, user: u };
      });
    });
  }

  function solicitarAcceso(datos) {
    if (porEmail(datos.email)) {
      return Promise.resolve({ ok: false, tipo: 'error', msg: 'Ese correo ya tiene una cuenta activa. Usa «Iniciar sesión».' });
    }
    var existente = solicitudPorEmail(datos.email);
    if (existente && existente.estado === 'pendiente') {
      return Promise.resolve({ ok: false, tipo: 'info', msg: 'Ya existe una solicitud pendiente para ese correo.' });
    }
    var salt = Store.randomSalt();
    return Store.hashPassword(datos.password, salt).then(function (h) {
      var token = Store.uid('tk').toUpperCase();
      var sol = {
        id: Store.uid('sol'),
        nombre: datos.nombre,
        cargo: datos.cargo,
        area: datos.area,
        email: String(datos.email).trim().toLowerCase(),
        salt: salt,
        hash: h,
        rol: 'concejal',
        estado: 'pendiente',
        token: token,
        fecha: new Date().toISOString()
      };
      if (existente) Store.remove('solicitudes', existente.id);
      Store.insert('solicitudes', sol);
      Store.insert('alertas', {
        id: Store.uid('al'),
        texto: 'Nueva solicitud de acceso: ' + sol.nombre + ' (' + sol.email + ')',
        tipo: 'warn', fecha: new Date().toISOString(), leida: false
      });
      return { ok: true, solicitud: sol, mailto: enlaceCorreo(sol) };
    });
  }

  function enlaceCorreo(sol) {
    return 'mailto:' + ADMIN_EMAIL + '?subject=' + encodeURIComponent(asuntoCorreo(sol)) +
      '&body=' + encodeURIComponent(cuerpoCorreo(sol));
  }

  function asuntoCorreo(sol) {
    return '[MUNICIPIA] Autorización de acceso · ' + sol.nombre;
  }

  function cuerpoCorreo(sol) {
    var a = UI.area(sol.area).nombre;
    return [
      'Solicitud de acceso a la app municipal MUNICIPIA (Ayuntamiento de Montemayor).',
      '',
      'Nombre: ' + sol.nombre,
      'Cargo: ' + sol.cargo,
      'Área: ' + a,
      'Correo (usuario): ' + sol.email,
      'Fecha: ' + new Date(sol.fecha).toLocaleString('es-ES'),
      'Código de validación: ' + sol.token,
      '',
      'Para AUTORIZAR el acceso, responde a este correo con la palabra APROBADO seguida del código,',
      'o entra en MUNICIPIA > Administración > Solicitudes de acceso y valida la solicitud.',
      '',
      '— Enviado automáticamente por MUNICIPIA'
    ].join('\n');
  }

  /* Intenta el envío automático; si no hay endpoint configurado, resuelve a false. */
  function enviarCorreo(sol) {
    if (!MAIL_ENDPOINT) return Promise.resolve(false);
    return fetch(MAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        accion: 'solicitudAcceso', para: ADMIN_EMAIL,
        asunto: asuntoCorreo(sol), cuerpo: cuerpoCorreo(sol), solicitud: sol
      })
    }).then(function () { return true; }).catch(function () { return false; });
  }

  function aprobar(solId) {
    var sol = Store.find('solicitudes', solId);
    if (!sol) return null;
    var u = {
      id: Store.uid('u'),
      nombre: sol.nombre, email: sol.email, cargo: sol.cargo, area: sol.area,
      rol: sol.rol || 'concejal', estado: 'activo', salt: sol.salt, hash: sol.hash,
      alta: new Date().toISOString().slice(0, 10)
    };
    Store.insert('usuarios', u);
    Store.update('solicitudes', solId, { estado: 'aprobada', resuelta: new Date().toISOString() });
    Store.log('alta_usuario', sol.email);
    return u;
  }

  function denegar(solId, motivo) {
    Store.update('solicitudes', solId, { estado: 'denegada', motivo: motivo || '', resuelta: new Date().toISOString() });
    Store.log('denegar_acceso', solId);
  }

  function actual() {
    var s = Store.session();
    if (!s) return null;
    return Store.get('usuarios').filter(function (u) { return u.id === s.id; })[0] || null;
  }

  function puede(vista) {
    var u = actual();
    if (!u) return false;
    var r = ROLES[u.rol] || ROLES.concejal;
    return r.vistas === '*' || r.vistas.indexOf(vista) !== -1;
  }

  function logout() {
    Store.log('logout', '');
    Store.clearSession();
  }

  global.Auth = {
    ADMIN_EMAIL: ADMIN_EMAIL, ROLES: ROLES,
    login: login, logout: logout, actual: actual, puede: puede,
    solicitarAcceso: solicitarAcceso, aprobar: aprobar, denegar: denegar,
    enlaceCorreo: enlaceCorreo, enviarCorreo: enviarCorreo,
    migrarSemilla: migrarSemilla, sincronizarUsuariosBase: sincronizarUsuariosBase, porEmail: porEmail
  };
})(window);
