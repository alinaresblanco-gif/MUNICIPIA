/* MUNICIPIA · Capa de datos (localStorage) */
(function (global) {
  'use strict';

  var KEY = 'municipia.db.v1';
  var SESSION_KEY = 'municipia.session';

  var db = null;

  function load() {
    try {
      db = JSON.parse(localStorage.getItem(KEY)) || null;
    } catch (e) {
      db = null;
    }
    return db;
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  /* Hash de contraseña: SHA-256 con sal por usuario. */
  function randomSalt() {
    var a = new Uint8Array(16);
    (global.crypto || {}).getRandomValues
      ? global.crypto.getRandomValues(a)
      : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function hashPassword(password, salt) {
    var data = salt + '::' + password;
    if (global.crypto && global.crypto.subtle && global.TextEncoder) {
      return global.crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(data))
        .then(function (buf) {
          return Array.prototype.map
            .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); })
            .join('');
        });
    }
    // Reserva para contextos sin WebCrypto (no criptográfica).
    var h = 5381;
    for (var i = 0; i < data.length; i++) { h = ((h << 5) + h + data.charCodeAt(i)) | 0; }
    return Promise.resolve('fallback:' + (h >>> 0).toString(16));
  }

  function get(collection) {
    return (db && db[collection]) || [];
  }

  function set(collection, arr) {
    db[collection] = arr;
    save();
  }

  function insert(collection, obj) {
    if (!db[collection]) db[collection] = [];
    db[collection].unshift(obj);
    save();
    return obj;
  }

  function update(collection, id, patch) {
    var arr = db[collection] || [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        Object.assign(arr[i], patch);
        save();
        return arr[i];
      }
    }
    return null;
  }

  function remove(collection, id) {
    db[collection] = (db[collection] || []).filter(function (x) { return x.id !== id; });
    save();
  }

  function find(collection, id) {
    return (db[collection] || []).filter(function (x) { return x.id === id; })[0] || null;
  }

  /* Auditoría de acciones */
  function log(accion, detalle) {
    var s = Store.session();
    insert('auditoria', {
      id: uid('log'),
      accion: accion,
      detalle: detalle || '',
      usuario: s ? s.email : 'anónimo',
      fecha: new Date().toISOString()
    });
  }

  var Store = {
    KEY: KEY,
    uid: uid,
    randomSalt: randomSalt,
    hashPassword: hashPassword,
    get: get, set: set, insert: insert, update: update, remove: remove, find: find, save: save, log: log,
    data: function () { return db; },
    init: function (seedFactory) {
      load();
      if (!db || !db.usuarios) {
        db = seedFactory();
        save();
      }
      return db;
    },
    reset: function (seedFactory) {
      db = seedFactory();
      save();
    },
    session: function () {
      try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)); }
      catch (e) { return null; }
    },
    setSession: function (user, recordar) {
      var payload = JSON.stringify({ id: user.id, email: user.email, ts: Date.now() });
      (recordar ? localStorage : sessionStorage).setItem(SESSION_KEY, payload);
    },
    clearSession: function () {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  };

  global.Store = Store;
})(window);
