/* MUNICIPIA · Capa de datos (localStorage) */
(function (global) {
  'use strict';

  var KEY = 'municipia.db.v1';
  var SESSION_KEY = 'municipia.session';

  /* URL /exec del despliegue del Apps Script (backend en Google Sheets) */
  var BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwRJPOs-nMPLr3j6t-xh8N80n3pAJQpr7fDwPtOF9TgIX0-5FMyfNHA3E1TdGeKY9C4bw/exec';

  /* Colecciones cuyos campos anidados viven en tablas hija en el backend */
  var HIJOS = {
    incidencias: {
      historial: { tabla: 'incidencias_historial', fk: 'incidencia_id', mapa: function (x) { return { fecha: x.f, texto: x.t }; } }
    },
    proyectos: {
      equipo: { tabla: 'proyectos_equipo', fk: 'proyecto_id', mapa: function (x) { return { usuario_id: x }; } },
      riesgos: { tabla: 'proyectos_riesgos', fk: 'proyecto_id', mapa: function (x) { return { riesgo: x.r, nivel: x.n }; } },
      hitos: { tabla: 'proyectos_hitos', fk: 'proyecto_id', mapa: function (x) { return { descripcion: x.h, completado: x.ok }; } }
    },
    votaciones: {
      opciones: { tabla: 'votaciones_opciones', fk: 'votacion_id', mapa: function (x) { return { opcion: x.o, votos: x.v }; } }
    }
  };

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
    pushInsert(collection, obj);
    return obj;
  }

  function update(collection, id, patch) {
    var arr = db[collection] || [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        var previo = JSON.parse(JSON.stringify(arr[i]));
        Object.assign(arr[i], patch);
        save();
        pushUpdate(collection, id, patch, previo);
        return arr[i];
      }
    }
    return null;
  }

  function remove(collection, id) {
    db[collection] = (db[collection] || []).filter(function (x) { return x.id !== id; });
    save();
    pushRemove(collection, id);
  }

  /* ---- Sincronización remota (backend Apps Script / Google Sheets) ---- */

  function enviar(accion, payload) {
    if (!BACKEND_URL) return Promise.resolve(null);
    var cuerpo = Object.assign({ accion: accion }, payload);
    return fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(cuerpo)
    }).then(function (r) { return r.json(); })
      .catch(function (err) { console.warn('MUNICIPIA: fallo al sincronizar con el backend.', accion, err); return null; });
  }

  function pushInsert(collection, obj) {
    if (!BACKEND_URL) return;
    var hijos = HIJOS[collection];
    var plano = obj;
    if (hijos) {
      plano = {};
      Object.keys(obj).forEach(function (k) { if (!hijos[k]) plano[k] = obj[k]; });
    }
    enviar('insertar', { tabla: collection, datos: plano });
    if (hijos) {
      Object.keys(hijos).forEach(function (campo) {
        (obj[campo] || []).forEach(function (item) { insertarHijo(hijos[campo], obj.id, item); });
      });
    }
  }

  function pushUpdate(collection, id, patch, previo) {
    if (!BACKEND_URL) return;
    var hijos = HIJOS[collection];
    var patchPlano = patch;
    if (hijos) {
      patchPlano = {};
      Object.keys(patch).forEach(function (k) {
        if (hijos[k]) return;
        patchPlano[k] = patch[k];
      });
    }
    if (Object.keys(patchPlano).length) enviar('actualizar', { tabla: collection, id: id, datos: patchPlano });
    if (hijos) {
      Object.keys(hijos).forEach(function (campo) {
        if (!patch[campo]) return;
        var antes = (previo[campo] || []).length;
        patch[campo].slice(antes).forEach(function (item) { insertarHijo(hijos[campo], id, item); });
      });
    }
  }

  function pushRemove(collection, id) {
    if (!BACKEND_URL) return;
    enviar('eliminar', { tabla: collection, id: id });
  }

  function insertarHijo(def, padreId, item) {
    var fila = def.mapa(item);
    fila[def.fk] = padreId;
    enviar('insertar', { tabla: def.tabla, datos: fila });
  }

  function pull() {
    if (!BACKEND_URL) return Promise.resolve(null);
    return fetch(BACKEND_URL + '?accion=listarTodo')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error(res && res.error);
        return reconstruir(res.datos);
      })
      .catch(function (err) { console.warn('MUNICIPIA: sin conexión con el backend, se usan datos locales.', err); return null; });
  }

  /* Reconstruye los arrays anidados (historial, equipo, riesgos, hitos, opciones) a partir de las tablas hija */
  function reconstruir(datos) {
    var out = {};
    Object.keys(datos).forEach(function (t) { out[t] = datos[t]; });

    (out.incidencias || []).forEach(function (inc) {
      inc.historial = (out.incidencias_historial || [])
        .filter(function (h) { return h.incidencia_id === inc.id; })
        .map(function (h) { return { f: h.fecha, t: h.texto }; });
    });

    (out.proyectos || []).forEach(function (p) {
      p.equipo = (out.proyectos_equipo || []).filter(function (x) { return x.proyecto_id === p.id; }).map(function (x) { return x.usuario_id; });
      p.riesgos = (out.proyectos_riesgos || []).filter(function (x) { return x.proyecto_id === p.id; }).map(function (x) { return { r: x.riesgo, n: x.nivel }; });
      p.hitos = (out.proyectos_hitos || []).filter(function (x) { return x.proyecto_id === p.id; }).map(function (x) { return { h: x.descripcion, ok: !!x.completado }; });
    });

    (out.votaciones || []).forEach(function (v) {
      v.opciones = (out.votaciones_opciones || []).filter(function (o) { return o.votacion_id === v.id; }).map(function (o) { return { o: o.opcion, v: +o.votos }; });
      v.votantes = (out.votaciones_votos || []).filter(function (x) { return x.votacion_id === v.id; });
    });

    delete out.incidencias_historial;
    delete out.proyectos_equipo; delete out.proyectos_riesgos; delete out.proyectos_hitos;
    delete out.votaciones_opciones; delete out.votaciones_votos;
    return out;
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
      return pull().then(function (remoto) {
        if (remoto) {
          db = remoto;
          save();
        } else if (!db || !db.usuarios) {
          db = seedFactory();
          save();
        }
        return db;
      });
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
