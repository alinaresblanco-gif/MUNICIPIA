/* MUNICIPIA · Datos semilla (demo) */
(function (global) {
  'use strict';

  var AREAS = [
    { id: 'urbanismo',  nombre: 'Urbanismo',      icono: '🏗️', color: '#1A4D8F', presupuesto: 480000, ejecutado: 312000 },
    { id: 'cultura',    nombre: 'Cultura',        icono: '🎭', color: '#7A5AF8', presupuesto: 145000, ejecutado: 98500 },
    { id: 'deportes',   nombre: 'Deportes',       icono: '⚽', color: '#3FA66B', presupuesto: 130000, ejecutado: 76000 },
    { id: 'servicios',  nombre: 'Servicios',      icono: '🛠️', color: '#E9A319', presupuesto: 390000, ejecutado: 288000 },
    { id: 'igualdad',   nombre: 'Igualdad',       icono: '⚖️', color: '#D93A3A', presupuesto: 62000,  ejecutado: 31000 },
    { id: 'juventud',   nombre: 'Juventud',       icono: '🎓', color: '#2C9AB7', presupuesto: 74000,  ejecutado: 45200 },
    { id: 'medioamb',   nombre: 'Medio ambiente', icono: '🌳', color: '#2F8C56', presupuesto: 210000, ejecutado: 121000 },
    { id: 'festejos',   nombre: 'Festejos',       icono: '🎉', color: '#C9457C', presupuesto: 168000, ejecutado: 152000 },
    { id: 'hacienda',   nombre: 'Hacienda',       icono: '💶', color: '#123566', presupuesto: 260000, ejecutado: 190000 },
    { id: 'alcaldia',   nombre: 'Alcaldía',       icono: '🏛️', color: '#8A5F0B', presupuesto: 155000, ejecutado: 88000 }
  ];

  function dias(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function horas(n) {
    var d = new Date();
    d.setHours(d.getHours() - n);
    return d.toISOString();
  }

  function seed() {
    return {
      areas: AREAS,

      usuarios: [
        { id: 'u-admin', nombre: 'Antonio Linares Blanco', email: 'alinares.blanco@gmail.com', cargo: 'Administrador del sistema', area: 'alcaldia', rol: 'admin', estado: 'activo', tempPass: 'municipia', alta: dias(-320) },
        { id: 'u-alcalde', nombre: 'Manuel Ortega Prieto', email: 'alcaldia@montemayor.es', cargo: 'Alcalde-Presidente', area: 'alcaldia', rol: 'alcalde', estado: 'activo', tempPass: 'municipia', alta: dias(-300) },
        { id: 'u-cultura', nombre: 'Ana Ruiz Molina', email: 'cultura@montemayor.es', cargo: 'Concejal de Cultura', area: 'cultura', rol: 'concejal', estado: 'activo', tempPass: 'municipia', alta: dias(-280) },
        { id: 'u-urb', nombre: 'Javier Cano Prados', email: 'urbanismo@montemayor.es', cargo: 'Concejal de Urbanismo', area: 'urbanismo', rol: 'concejal', estado: 'activo', tempPass: 'municipia', alta: dias(-275) },
        { id: 'u-serv', nombre: 'Lucía Vera Serrano', email: 'servicios@montemayor.es', cargo: 'Concejala de Servicios', area: 'servicios', rol: 'concejal', estado: 'activo', tempPass: 'municipia', alta: dias(-260) },
        { id: 'u-tec', nombre: 'Pedro Salas Jiménez', email: 'tecnico@montemayor.es', cargo: 'Técnico de obras', area: 'servicios', rol: 'tecnico', estado: 'activo', tempPass: 'municipia', alta: dias(-210) }
      ],

      solicitudes: [],

      incidencias: [
        { id: 'inc-1001', titulo: 'Farola apagada en Plaza de la Constitución', area: 'servicios', estado: 'En proceso', prioridad: 'Alta', responsable: 'u-tec', ubicacion: 'Plaza de la Constitución, 4', x: 34, y: 41, origen: 'Buzón ciudadano', fecha: dias(-3), estimada: dias(2), descripcion: 'Dos luminarias sin servicio desde el temporal. Riesgo para viandantes.', fotos: 2, historial: [{ f: dias(-3), t: 'Incidencia creada desde buzón ciudadano' }, { f: dias(-2), t: 'Asignada a Pedro Salas' }, { f: dias(-1), t: 'Estado: En proceso · material solicitado' }] },
        { id: 'inc-1002', titulo: 'Socavón en calle Real', area: 'urbanismo', estado: 'Abierta', prioridad: 'Crítica', responsable: 'u-urb', ubicacion: 'C/ Real, 22', x: 62, y: 28, origen: 'Policía Local', fecha: dias(-1), estimada: dias(1), descripcion: 'Hundimiento del firme de 60 cm. Zona vallada provisionalmente.', fotos: 4, historial: [{ f: dias(-1), t: 'Incidencia creada · prioridad crítica' }] },
        { id: 'inc-1003', titulo: 'Contenedor de vidrio desbordado', area: 'medioamb', estado: 'Resuelta', prioridad: 'Media', responsable: 'u-serv', ubicacion: 'Avda. Andalucía', x: 20, y: 68, origen: 'Buzón ciudadano', fecha: dias(-9), estimada: dias(-7), descripcion: 'Acumulación de vidrio junto al contenedor.', fotos: 1, historial: [{ f: dias(-9), t: 'Creada' }, { f: dias(-7), t: 'Resuelta · retirada extraordinaria' }] },
        { id: 'inc-1004', titulo: 'Pista polideportiva con red rota', area: 'deportes', estado: 'Abierta', prioridad: 'Baja', responsable: 'u-serv', ubicacion: 'Polideportivo Municipal', x: 78, y: 62, origen: 'Interna', fecha: dias(-5), estimada: dias(9), descripcion: 'Red de la pista 2 deteriorada.', fotos: 1, historial: [{ f: dias(-5), t: 'Creada' }] },
        { id: 'inc-1005', titulo: 'Fuga de agua en parque infantil', area: 'servicios', estado: 'En proceso', prioridad: 'Alta', responsable: 'u-tec', ubicacion: 'Parque de la Fuente', x: 48, y: 75, origen: 'Buzón ciudadano', fecha: dias(-2), estimada: dias(1), descripcion: 'Pérdida continua en la red de riego.', fotos: 3, historial: [{ f: dias(-2), t: 'Creada' }, { f: dias(-1), t: 'Corte parcial de sector' }] },
        { id: 'inc-1006', titulo: 'Pintada en fachada del Centro Cultural', area: 'cultura', estado: 'Abierta', prioridad: 'Media', responsable: 'u-cultura', ubicacion: 'C/ Iglesia, 1', x: 55, y: 50, origen: 'Interna', fecha: dias(-4), estimada: dias(6), descripcion: 'Grafiti en fachada principal, previsto repintado.', fotos: 2, historial: [{ f: dias(-4), t: 'Creada' }] }
      ],

      proyectos: [
        { id: 'pro-1', nombre: 'Remodelación del Paseo Central', area: 'urbanismo', estado: 'En ejecución', avance: 62, presupuesto: 285000, gastado: 176700, inicio: dias(-120), fin: dias(75), responsable: 'u-urb', equipo: ['u-urb', 'u-tec'], proveedor: 'Construcciones Montemayor S.L.', riesgos: [{ r: 'Retraso por suministro de adoquín', n: 'Medio' }, { r: 'Meteorología adversa', n: 'Bajo' }], hitos: [{ h: 'Demolición y movimiento de tierras', ok: true }, { h: 'Red de saneamiento', ok: true }, { h: 'Pavimentación', ok: false }, { h: 'Mobiliario urbano y arbolado', ok: false }] },
        { id: 'pro-2', nombre: 'Feria de Otoño 2026', area: 'festejos', estado: 'Planificación', avance: 25, presupuesto: 96000, gastado: 21500, inicio: dias(-20), fin: dias(140), responsable: 'u-cultura', equipo: ['u-cultura'], proveedor: 'Eventos Sur', riesgos: [{ r: 'Ajuste de caché de artistas', n: 'Medio' }], hitos: [{ h: 'Contratación de artistas', ok: true }, { h: 'Plan de seguridad', ok: false }, { h: 'Montaje de recinto', ok: false }] },
        { id: 'pro-3', nombre: 'Eficiencia energética alumbrado LED', area: 'medioamb', estado: 'En ejecución', avance: 78, presupuesto: 210000, gastado: 158000, inicio: dias(-200), fin: dias(30), responsable: 'u-serv', equipo: ['u-serv', 'u-tec'], proveedor: 'IluminaSur', riesgos: [{ r: 'Ampliación de puntos de luz', n: 'Bajo' }], hitos: [{ h: 'Auditoría energética', ok: true }, { h: 'Sustitución fase 1', ok: true }, { h: 'Sustitución fase 2', ok: true }, { h: 'Telegestión', ok: false }] },
        { id: 'pro-4', nombre: 'Escuela Municipal de Deportes', area: 'deportes', estado: 'En ejecución', avance: 45, presupuesto: 68000, gastado: 29800, inicio: dias(-60), fin: dias(120), responsable: 'u-serv', equipo: ['u-serv'], proveedor: 'Club Deportivo Montemayor', riesgos: [], hitos: [{ h: 'Convenio con clubes', ok: true }, { h: 'Contratación monitores', ok: false }] },
        { id: 'pro-5', nombre: 'Plan de Igualdad Municipal 2026-2029', area: 'igualdad', estado: 'Planificación', avance: 15, presupuesto: 42000, gastado: 4300, inicio: dias(-15), fin: dias(200), responsable: 'u-cultura', equipo: ['u-cultura'], proveedor: 'Consultora Ígneo', riesgos: [{ r: 'Participación ciudadana baja', n: 'Medio' }], hitos: [{ h: 'Diagnóstico', ok: true }, { h: 'Mesas de participación', ok: false }] }
      ],

      documentos: [
        { id: 'doc-1', nombre: 'Acta Pleno ordinario octubre', carpeta: 'Actas', area: 'alcaldia', tipo: 'pdf', version: 'v2', fecha: dias(-12), autor: 'u-alcalde', tam: '1,2 MB' },
        { id: 'doc-2', nombre: 'Pliego técnico Paseo Central', carpeta: 'Pliegos', area: 'urbanismo', tipo: 'pdf', version: 'v4', fecha: dias(-40), autor: 'u-urb', tam: '3,8 MB' },
        { id: 'doc-3', nombre: 'Contrato IluminaSur LED', carpeta: 'Contratos', area: 'medioamb', tipo: 'pdf', version: 'v1', fecha: dias(-180), autor: 'u-serv', tam: '860 KB' },
        { id: 'doc-4', nombre: 'Presupuesto general 2026', carpeta: 'Presupuestos', area: 'hacienda', tipo: 'xls', version: 'v7', fecha: dias(-30), autor: 'u-admin', tam: '2,1 MB' },
        { id: 'doc-5', nombre: 'Ordenanza de convivencia ciudadana', carpeta: 'Normativas', area: 'alcaldia', tipo: 'pdf', version: 'v1', fecha: dias(-150), autor: 'u-admin', tam: '640 KB' },
        { id: 'doc-6', nombre: 'Informe técnico socavón C/ Real', carpeta: 'Informes', area: 'urbanismo', tipo: 'doc', version: 'v1', fecha: dias(-1), autor: 'u-tec', tam: '410 KB' },
        { id: 'doc-7', nombre: 'Plan estratégico Montemayor 2030', carpeta: 'Planes estratégicos', area: 'alcaldia', tipo: 'pdf', version: 'v3', fecha: dias(-90), autor: 'u-alcalde', tam: '5,4 MB' },
        { id: 'doc-8', nombre: 'Memoria Feria de Otoño 2025', carpeta: 'Informes', area: 'festejos', tipo: 'doc', version: 'v2', fecha: dias(-200), autor: 'u-cultura', tam: '1,7 MB' }
      ],

      eventos: [
        { id: 'ev-1', titulo: 'Pleno ordinario', fecha: dias(3), hora: '19:00', area: 'alcaldia', tipo: 'Reunión', lugar: 'Salón de Plenos' },
        { id: 'ev-2', titulo: 'Junta de gobierno local', fecha: dias(1), hora: '09:30', area: 'alcaldia', tipo: 'Reunión', lugar: 'Sala de juntas' },
        { id: 'ev-3', titulo: 'Fin de plazo licitación Paseo Central', fecha: dias(6), hora: '14:00', area: 'urbanismo', tipo: 'Plazo', lugar: 'Sede electrónica' },
        { id: 'ev-4', titulo: 'Inauguración exposición fotográfica', fecha: dias(4), hora: '20:00', area: 'cultura', tipo: 'Evento', lugar: 'Centro Cultural' },
        { id: 'ev-5', titulo: 'Comisión de Hacienda', fecha: dias(8), hora: '11:00', area: 'hacienda', tipo: 'Reunión', lugar: 'Sala de juntas' },
        { id: 'ev-6', titulo: 'Torneo escolar de fútbol sala', fecha: dias(10), hora: '17:00', area: 'deportes', tipo: 'Evento', lugar: 'Polideportivo' },
        { id: 'ev-7', titulo: 'Reunión con vecinos zona norte', fecha: dias(-2), hora: '18:30', area: 'urbanismo', tipo: 'Reunión', lugar: 'Casa de la Cultura' }
      ],

      comunicados: [
        { id: 'com-1', titulo: 'Convocatoria Pleno ordinario', cuerpo: 'Se convoca Pleno ordinario para el próximo jueves a las 19:00 en el Salón de Plenos. Orden del día adjunto.', autor: 'u-alcalde', fecha: horas(6), tipo: 'Convocatoria', urgente: false },
        { id: 'com-2', titulo: 'Corte de agua programado zona centro', cuerpo: 'Mañana de 09:00 a 14:00 por obras en la red. Avisar a comercios afectados.', autor: 'u-serv', fecha: horas(20), tipo: 'Aviso urgente', urgente: true },
        { id: 'com-3', titulo: 'Nuevo protocolo de gestión documental', cuerpo: 'Todos los documentos deben subirse a la Documentoteca con etiqueta de área y versión.', autor: 'u-admin', fecha: horas(52), tipo: 'Circular', urgente: false }
      ],

      salas: [
        { id: 'sala-general', nombre: 'Canal general', tipo: 'general', icono: '📣', miembros: 'Toda la corporación' },
        { id: 'sala-alcaldia', nombre: 'Alcaldía', tipo: 'area', area: 'alcaldia', icono: '🏛️', miembros: 'Equipo de gobierno' },
        { id: 'sala-urbanismo', nombre: 'Urbanismo', tipo: 'area', area: 'urbanismo', icono: '🏗️', miembros: 'Área de Urbanismo' },
        { id: 'sala-cultura', nombre: 'Cultura', tipo: 'area', area: 'cultura', icono: '🎭', miembros: 'Área de Cultura' },
        { id: 'sala-servicios', nombre: 'Servicios', tipo: 'area', area: 'servicios', icono: '🛠️', miembros: 'Área de Servicios' },
        { id: 'sala-pro-1', nombre: 'Proyecto · Paseo Central', tipo: 'proyecto', ref: 'pro-1', icono: '📌', miembros: 'Equipo del proyecto' },
        { id: 'sala-pro-3', nombre: 'Proyecto · Alumbrado LED', tipo: 'proyecto', ref: 'pro-3', icono: '📌', miembros: 'Equipo del proyecto' }
      ],

      mensajes: [
        { id: 'm-1', sala: 'sala-general', autor: 'u-alcalde', texto: 'Buenos días a todos. Recordad que el jueves tenemos Pleno.', fecha: horas(28) },
        { id: 'm-2', sala: 'sala-general', autor: 'u-cultura', texto: 'Anotado. Llevo el punto de la programación cultural del trimestre.', fecha: horas(27) },
        { id: 'm-3', sala: 'sala-general', autor: 'u-serv', texto: 'Yo presento el informe de incidencias del mes, van 42 resueltas.', fecha: horas(26) },
        { id: 'm-4', sala: 'sala-urbanismo', autor: 'u-urb', texto: 'El socavón de C/ Real está vallado. Mañana viene la empresa a valorar.', fecha: horas(20) },
        { id: 'm-5', sala: 'sala-urbanismo', autor: 'u-tec', texto: 'Subo el informe técnico a la Documentoteca esta tarde.', fecha: horas(19) },
        { id: 'm-6', sala: 'sala-pro-1', autor: 'u-urb', texto: 'Avance del 62%. La pavimentación empieza la semana que viene.', fecha: horas(9) },
        { id: 'm-7', sala: 'sala-cultura', autor: 'u-cultura', texto: 'La exposición se inaugura el viernes a las 20:00, ¿venís?', fecha: horas(4) }
      ],

      tareas: [
        { id: 't-1', titulo: 'Revisar pliego del Paseo Central', usuario: 'u-urb', area: 'urbanismo', prioridad: 'Alta', hecha: false, vence: dias(1) },
        { id: 't-2', titulo: 'Preparar orden del día del Pleno', usuario: 'u-alcalde', area: 'alcaldia', prioridad: 'Alta', hecha: false, vence: dias(2) },
        { id: 't-3', titulo: 'Cerrar contrato de sonido de la Feria', usuario: 'u-cultura', area: 'festejos', prioridad: 'Media', hecha: false, vence: dias(5) },
        { id: 't-4', titulo: 'Informe mensual de incidencias', usuario: 'u-serv', area: 'servicios', prioridad: 'Media', hecha: true, vence: dias(-1) },
        { id: 't-5', titulo: 'Actualizar inventario de mobiliario urbano', usuario: 'u-tec', area: 'servicios', prioridad: 'Baja', hecha: false, vence: dias(12) },
        { id: 't-6', titulo: 'Validar facturas de octubre', usuario: 'u-admin', area: 'hacienda', prioridad: 'Alta', hecha: false, vence: dias(3) }
      ],

      notas: [
        { id: 'n-1', usuario: 'u-admin', texto: 'Pedir presupuesto alternativo para el mobiliario del paseo.', fecha: horas(30) }
      ],

      votaciones: [
        { id: 'vot-1', titulo: 'Prioridad de inversión del remanente 2026', opciones: [{ o: 'Alumbrado', v: 3 }, { o: 'Parques infantiles', v: 5 }, { o: 'Caminos rurales', v: 2 }], estado: 'Abierta', cierre: dias(4), votantes: [] }
      ],

      decisiones: [
        { id: 'dec-1', titulo: 'Adjudicación alumbrado LED fase 2', quien: 'u-alcalde', fecha: dias(-45), motivo: 'Mejor oferta técnica y económica (IluminaSur).', doc: 'doc-3' },
        { id: 'dec-2', titulo: 'Aplazamiento de la reforma del mercado', quien: 'u-alcalde', fecha: dias(-70), motivo: 'Falta de financiación en el ejercicio actual.', doc: null }
      ],

      proveedores: [
        { id: 'pv-1', nombre: 'Construcciones Montemayor S.L.', cif: 'B14XXXXXX', contacto: 'obras@construccionesmm.es', tel: '957 00 00 01', contratos: 3, valoracion: 4 },
        { id: 'pv-2', nombre: 'IluminaSur', cif: 'B41XXXXXX', contacto: 'comercial@iluminasur.es', tel: '954 00 00 02', contratos: 2, valoracion: 5 },
        { id: 'pv-3', nombre: 'Eventos Sur', cif: 'B29XXXXXX', contacto: 'produccion@eventossur.com', tel: '952 00 00 03', contratos: 4, valoracion: 3 }
      ],

      alertas: [
        { id: 'al-1', texto: 'Incidencia crítica sin asignar: socavón en C/ Real', tipo: 'err', fecha: horas(5), leida: false },
        { id: 'al-2', texto: 'Plazo de licitación del Paseo Central en 6 días', tipo: 'warn', fecha: horas(12), leida: false },
        { id: 'al-3', texto: 'Nuevo documento en Informes: informe técnico socavón', tipo: 'ok', fecha: horas(22), leida: false }
      ],

      auditoria: []
    };
  }

  global.SEED = seed;
  global.AREAS = AREAS;
})(window);
