const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const PORT = Number(process.env.API_PORT || 3000);
const DIRECTORIO = __dirname;
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'sistema_academico',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

const tablas = new Set([
  'alumno', 'docente', 'curso', 'seccion', 'matricula', 'calificacion',
  'asistencia', 'reclamo', 'respuesta_reclamo', 'pago', 'constancia', 'usuario', 'tarea'
]);
const claves = {
  alumno: 'idAlumno', docente: 'idDocente', curso: 'nrcCurso', seccion: 'idSeccion',
  matricula: 'idMatricula', calificacion: 'idCalificacion', asistencia: 'idAsistencia',
  reclamo: 'idReclamo', respuesta_reclamo: 'idRespuesta', pago: 'idPago', constancia: 'idConstancia',
  usuario: 'idUsuario', tarea: 'idTarea'
};

async function obtenerDatosDashboard() {
  const [alumnos] = await pool.query(`
    SELECT a.*,
      COALESCE(cal.promedio, 0) AS promedio,
      COALESCE(asi.asistencia, 100) AS asistencia
    FROM alumno a
    LEFT JOIN (
      SELECT idAlumno, ROUND(AVG(nota), 1) AS promedio
      FROM calificacion GROUP BY idAlumno
    ) cal ON cal.idAlumno = a.idAlumno
    LEFT JOIN (
      SELECT idAlumno,
        ROUND(100 * SUM(CASE WHEN estado IN ('presente', 'tardanza') THEN 1 ELSE 0 END) / COUNT(*), 0) AS asistencia
      FROM asistencia GROUP BY idAlumno
    ) asi ON asi.idAlumno = a.idAlumno
    ORDER BY a.idAlumno
  `);
  const [docentes] = await pool.query('SELECT * FROM docente ORDER BY idDocente');
  const [calificaciones] = await pool.query(`
    SELECT cal.*, a.nombre, a.apellido, c.nombreCurso
    FROM calificacion cal
    INNER JOIN alumno a ON a.idAlumno = cal.idAlumno
    INNER JOIN curso c ON c.nrcCurso = cal.nrcCurso
    ORDER BY cal.idAlumno, cal.fecha, cal.idCalificacion
  `);
  const [asistencias] = await pool.query('SELECT * FROM asistencia ORDER BY fecha DESC, idAsistencia DESC');
  const [matriculas] = await pool.query(`
    SELECT m.*, a.grupo, CONCAT(a.nombre, ' ', a.apellido) AS nombreAlumno, s.nombreSeccion
    FROM matricula m INNER JOIN alumno a ON a.idAlumno = m.idAlumno
    LEFT JOIN seccion s ON s.idSeccion = m.idSeccion ORDER BY m.idMatricula DESC
  `);
  const [reclamos] = await pool.query(`
    SELECT r.*, CONCAT(a.nombre, ' ', a.apellido) AS nombreAlumno
    FROM reclamo r INNER JOIN alumno a ON a.idAlumno = r.idAlumno ORDER BY r.idReclamo DESC
  `);
  const grupoPorAlumno = new Map(matriculas.map(m => [m.idAlumno, m.nombreSeccion || 'Sin grupo']));
  let tareas = [];
  try { [tareas] = await pool.query('SELECT * FROM tarea ORDER BY fechaEntrega, idTarea'); } catch (error) {
    if (!['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'].includes(error.code)) throw error;
  }

  const porAlumno = new Map();
  calificaciones.forEach(cal => {
    if (!porAlumno.has(cal.idAlumno)) porAlumno.set(cal.idAlumno, []);
    porAlumno.get(cal.idAlumno).push(cal);
  });
  const gradesTeacher = alumnos.map(alumno => {
    const notas = porAlumno.get(alumno.idAlumno) || [];
    return {
      id: alumno.idAlumno, name: `${alumno.nombre} ${alumno.apellido}`,
      initials: `${alumno.nombre[0]}${alumno.apellido[0]}`.toUpperCase(),
      group: alumno.grupo || grupoPorAlumno.get(alumno.idAlumno) || 'Sin grupo',
      e1: notas[0]?.nota ?? null, e2: notas[1]?.nota ?? null,
      tarea: notas[2]?.nota ?? null, proyecto: notas[3]?.nota ?? null
    };
  });
  const gradesStudent = calificaciones.filter(cal => cal.idAlumno === 1).map(cal => ({
    id: cal.idCalificacion, subject: cal.nombreCurso, teacher: 'Docente asignado',
    e1: cal.nota, e2: null, tarea: null, proyecto: null
  }));
  const students = alumnos.map(alumno => {
    const promedio = Number(alumno.promedio) || 0;
    const asistencia = Number(alumno.asistencia) || 0;
    return {
      ...gradesTeacher.find(item => item.id === alumno.idAlumno),
      avg: promedio, att: asistencia,
      pending: tareas.filter(tarea => tarea.estado === 'pendiente').length,
      status: promedio >= 18 ? 'Excelente' : promedio >= 16 ? 'Bien' : promedio >= 12 ? 'Regular' : 'En riesgo',
      parentPhone: alumno.telefono || ''
    };
  });
  const tareasPendientes = tareas.filter(tarea => tarea.estado === 'pendiente' || tarea.estado === 'atrasada').length;
  const asistenciaPromedio = alumnos.length ? Math.round(alumnos.reduce((total, alumno) => total + Number(alumno.asistencia || 0), 0) / alumnos.length) : 0;

  return {
    students, gradesTeacher, gradesStudent, tasks: tareas,
    stats: { alumnos: alumnos.length, asistencia: asistenciaPromedio, tareas: tareasPendientes, riesgo: students.filter(s => s.status === 'En riesgo').length },
    matriculas, reclamos, asistencias, alumnos, docentes
  };
}

function json(res, status, body) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'});
  res.end(JSON.stringify(body));
}
function serveDashboard(res) {
  const archivo = path.join(DIRECTORIO, 'dashboard.html');
  fs.readFile(archivo, (error, contenido) => {
    if (error) return json(res, 500, {error: 'No se pudo cargar el dashboard'});
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(contenido);
  });
}
function serveAsset(res, pathname) {
  const relativePath = pathname.replace(/^\/+/, '');
  const directorioPublico = path.join(DIRECTORIO, 'public');
  const archivo = path.normalize(path.join(directorioPublico, relativePath));
  if (!archivo.startsWith(directorioPublico + path.sep)) return json(res, 403, {error: 'Archivo no permitido'});
  const tipos = {'.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8'};
  const tipo = tipos[path.extname(archivo).toLowerCase()];
  if (!tipo) return json(res, 404, {error: 'Recurso no encontrado'});
  fs.readFile(archivo, (error, contenido) => {
    if (error) return json(res, 404, {error: 'Recurso no encontrado'});
    res.writeHead(200, {'Content-Type': tipo, 'Cache-Control': 'no-cache'});
    res.end(contenido);
  });
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); } });
    req.on('error', reject);
  });
}
function tableFrom(pathname) {
  const value = pathname.replace(/^\/api\//, '').replace(/\/$/, '').replace(/-/g, '_');
  return tablas.has(value) ? value : null;
}

function mysqlUnavailable(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  const codes = new Set([
    'ecconnrefused', 'er_bad_db_error', 'er_access_denied_error',
    'protocol_connection_lost', 'connection_lost', 'econnreset'
  ]);
  return codes.has(String(error.code || '').toLowerCase()) || /connect|mysql|database/i.test(message);
}

async function request(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'});
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if ((url.pathname === '/' || url.pathname === '/dashboard.html') && req.method === 'GET') {
      return serveDashboard(res);
    }
    if ((url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) && req.method === 'GET') {
      return serveAsset(res, url.pathname);
    }
    if (url.pathname === '/api/salud' && req.method === 'GET') {
      try {
        const [rows] = await pool.query('SELECT 1 AS conectado');
        return json(res, 200, {ok: true, mysql: rows[0].conectado === 1, baseDatos: process.env.MYSQL_DATABASE || 'sistema_academico'});
      } catch (error) {
        return json(res, 200, {
          ok: true,
          mysql: false,
          baseDatos: process.env.MYSQL_DATABASE || 'sistema_academico',
          fallback: true,
          mensaje: 'MySQL no disponible; el dashboard continua en modo local.'
        });
      }
    }
    if (url.pathname === '/api/dashboard' && req.method === 'GET') {
      return json(res, 200, await obtenerDatosDashboard());
    }
    const tabla = tableFrom(url.pathname);
    if (!tabla) return json(res, 404, {error: 'Ruta no encontrada'});

    if (req.method === 'GET') {
      try {
        const limite = Math.min(Number(url.searchParams.get('limite') || 100), 500);
        const [rows] = await pool.query(`SELECT * FROM \`${tabla}\` ORDER BY \`${claves[tabla]}\` DESC LIMIT ?`, [limite]);
        return json(res, 200, rows);
      } catch (error) {
        if (mysqlUnavailable(error)) return json(res, 200, []);
        throw error;
      }
    }
    if (req.method === 'POST') {
      try {
        const data = await body(req);
        const columnas = Object.keys(data).filter(key => key !== claves[tabla] && /^[A-Za-z][A-Za-z0-9]*$/.test(key));
        if (!columnas.length) return json(res, 400, {error: 'No hay campos para insertar'});
        const valores = columnas.map(key => data[key]);
        const marcas = columnas.map(() => '?').join(', ');
        const [result] = await pool.query(`INSERT INTO \`${tabla}\` (${columnas.map(key => `\`${key}\``).join(', ')}) VALUES (${marcas})`, valores);
        return json(res, 201, {id: result.insertId, mensaje: 'Registro creado'});
      } catch (error) {
        if (mysqlUnavailable(error)) return json(res, 200, {ok: false, fallback: true, mensaje: 'MySQL no disponible; la operación se guardó solo en modo local.'});
        throw error;
      }
    }
    return json(res, 405, {error: 'Metodo no permitido'});
  } catch (error) {
    if (mysqlUnavailable(error)) {
      return json(res, 200, {ok: false, fallback: true, mensaje: 'MySQL no disponible; el dashboard sigue funcionando en local.'});
    }
    console.error(error.message);
    return json(res, 500, {error: 'Error de base de datos', detalle: error.message});
  }
}

http.createServer(request).listen(PORT, () => {
  console.log(`API academica disponible en http://localhost:${PORT}`);
});
