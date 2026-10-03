const mysql = require('mysql2/promise');
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

function mysqlUnavailable(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  const codes = new Set([
    'ecconnrefused', 'er_bad_db_error', 'er_access_denied_error',
    'protocol_connection_lost', 'connection_lost', 'econnreset'
  ]);
  return codes.has(String(error.code || '').toLowerCase()) || /connect|mysql|database/i.test(message);
}

module.exports = { pool, obtenerDatosDashboard, mysqlUnavailable };
