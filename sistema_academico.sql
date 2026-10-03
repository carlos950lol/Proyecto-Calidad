-- =============================================================
-- SISTEMA DE GESTION DE PROCESOS ACADEMICOS
-- MySQL 8.0 - Modelo normalizado para MySQL Workbench
-- =============================================================

CREATE DATABASE IF NOT EXISTS sistema_academico
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE sistema_academico;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS tarea;
DROP TABLE IF EXISTS respuesta_reclamo;
DROP TABLE IF EXISTS constancia;
DROP TABLE IF EXISTS pago;
DROP TABLE IF EXISTS reclamo;
DROP TABLE IF EXISTS asistencia;
DROP TABLE IF EXISTS calificacion;
DROP TABLE IF EXISTS matricula;
DROP TABLE IF EXISTS seccion;
DROP TABLE IF EXISTS curso;
DROP TABLE IF EXISTS docente;
DROP TABLE IF EXISTS alumno;
SET FOREIGN_KEY_CHECKS = 1;

-- Alumnos del instituto.
CREATE TABLE alumno (
    idAlumno INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    grupo ENUM('A1','B1','A2','B2','A3','B3','A4','B4','A5','B5','A6','B6') NOT NULL,
    dni VARCHAR(15) NOT NULL,
    correo VARCHAR(150) NULL,
    telefono VARCHAR(20) NULL,
    fechaNacimiento DATE NULL,
    estado VARCHAR(20) NULL DEFAULT 'activo',
    PRIMARY KEY (idAlumno),
    UNIQUE KEY uq_alumno_dni (dni),
    UNIQUE KEY uq_alumno_correo (correo)
) ENGINE=InnoDB;

-- Docentes responsables de las secciones.
CREATE TABLE docente (
    idDocente INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100) NULL,
    correo VARCHAR(150) NULL,
    telefono VARCHAR(20) NULL,
    estado VARCHAR(20) NULL DEFAULT 'activo',
    PRIMARY KEY (idDocente),
    UNIQUE KEY uq_docente_correo (correo)
) ENGINE=InnoDB;

-- Cursos academicos disponibles.
CREATE TABLE curso (
    nrcCurso INT NOT NULL,
    nombreCurso VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NULL,
    creditos INT NULL,
    horasSemanal INT NULL,
    estado VARCHAR(20) NULL DEFAULT 'activo',
    PRIMARY KEY (nrcCurso)
) ENGINE=InnoDB;

-- Secciones de cada curso y docente responsable.
CREATE TABLE seccion (
    idSeccion INT NOT NULL AUTO_INCREMENT,
    nrcCurso INT NOT NULL,
    idDocente INT NOT NULL,
    nombreSeccion VARCHAR(50) NOT NULL,
    horario VARCHAR(100) NULL,
    aula VARCHAR(50) NULL,
    capacidad INT NULL,
    turno VARCHAR(30) NULL,
    estado VARCHAR(20) NULL DEFAULT 'activa',
    PRIMARY KEY (idSeccion),
    KEY idx_seccion_curso (nrcCurso),
    KEY idx_seccion_docente (idDocente),
    CONSTRAINT fk_seccion_curso FOREIGN KEY (nrcCurso)
        REFERENCES curso (nrcCurso)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_seccion_docente FOREIGN KEY (idDocente)
        REFERENCES docente (idDocente)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Matricula: entidad asociativa entre alumno, curso y seccion.
CREATE TABLE matricula (
    idMatricula INT NOT NULL AUTO_INCREMENT,
    idAlumno INT NOT NULL,
    nrcCurso INT NOT NULL,
    idSeccion INT NULL,
    fecha DATE NOT NULL,
    periodoAcademico VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NULL DEFAULT 'activa',
    modalidad VARCHAR(30) NULL,
    fechaRegistro DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idMatricula),
    UNIQUE KEY uq_matricula_alumno_curso_periodo (idAlumno, nrcCurso, periodoAcademico),
    KEY idx_matricula_curso (nrcCurso),
    KEY idx_matricula_seccion (idSeccion),
    CONSTRAINT fk_matricula_alumno FOREIGN KEY (idAlumno)
        REFERENCES alumno (idAlumno)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_matricula_curso FOREIGN KEY (nrcCurso)
        REFERENCES curso (nrcCurso)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_matricula_seccion FOREIGN KEY (idSeccion)
        REFERENCES seccion (idSeccion)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Calificaciones por alumno y curso.
CREATE TABLE calificacion (
    idCalificacion INT NOT NULL AUTO_INCREMENT,
    idAlumno INT NOT NULL,
    nrcCurso INT NOT NULL,
    tipoEvaluacion VARCHAR(50) NOT NULL,
    nota DECIMAL(5,2) NOT NULL,
    fecha DATE NOT NULL,
    porcentaje DECIMAL(5,2) NULL,
    observacion VARCHAR(255) NULL,
    estado VARCHAR(20) NULL DEFAULT 'registrada',
    PRIMARY KEY (idCalificacion),
    KEY idx_calificacion_alumno (idAlumno),
    KEY idx_calificacion_curso (nrcCurso),
    CONSTRAINT fk_calificacion_alumno FOREIGN KEY (idAlumno)
        REFERENCES alumno (idAlumno)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_calificacion_curso FOREIGN KEY (nrcCurso)
        REFERENCES curso (nrcCurso)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_calificacion_nota CHECK (nota >= 0 AND nota <= 20),
    CONSTRAINT chk_calificacion_porcentaje CHECK (porcentaje IS NULL OR (porcentaje >= 0 AND porcentaje <= 100))
) ENGINE=InnoDB;

-- Asistencias por alumno y curso.
CREATE TABLE asistencia (
    idAsistencia INT NOT NULL AUTO_INCREMENT,
    idAlumno INT NOT NULL,
    nrcCurso INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NULL,
    estado VARCHAR(20) NOT NULL,
    observacion VARCHAR(255) NULL,
    tipoSesion VARCHAR(50) NULL,
    PRIMARY KEY (idAsistencia),
    UNIQUE KEY uq_asistencia_alumno_curso_fecha (idAlumno, nrcCurso, fecha),
    KEY idx_asistencia_curso (nrcCurso),
    CONSTRAINT fk_asistencia_alumno FOREIGN KEY (idAlumno)
        REFERENCES alumno (idAlumno)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_asistencia_curso FOREIGN KEY (nrcCurso)
        REFERENCES curso (nrcCurso)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Reclamos registrados por alumnos.
CREATE TABLE reclamo (
    idReclamo INT NOT NULL AUTO_INCREMENT,
    idAlumno INT NOT NULL,
    fecha DATE NOT NULL,
    motivo VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    fechaAtencion DATE NULL,
    prioridad VARCHAR(20) NULL DEFAULT 'normal',
    PRIMARY KEY (idReclamo),
    KEY idx_reclamo_alumno (idAlumno),
    CONSTRAINT fk_reclamo_alumno FOREIGN KEY (idAlumno)
        REFERENCES alumno (idAlumno)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Respuestas emitidas para atender reclamos.
CREATE TABLE respuesta_reclamo (
    idRespuesta INT NOT NULL AUTO_INCREMENT,
    idReclamo INT NOT NULL,
    fecha DATE NOT NULL,
    respuesta VARCHAR(500) NOT NULL,
    estado VARCHAR(30) NULL,
    observacion VARCHAR(255) NULL,
    responsable VARCHAR(100) NULL,
    PRIMARY KEY (idRespuesta),
    KEY idx_respuesta_reclamo (idReclamo),
    CONSTRAINT fk_respuesta_reclamo FOREIGN KEY (idReclamo)
        REFERENCES reclamo (idReclamo)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Pagos realizados por alumnos.
CREATE TABLE pago (
    idPago INT NOT NULL AUTO_INCREMENT,
    idAlumno INT NOT NULL,
    fechaPago DATE NULL,
    monto DECIMAL(10,2) NOT NULL,
    concepto VARCHAR(150) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    metodoPago VARCHAR(50) NULL,
    numeroOperacion VARCHAR(100) NULL,
    fechaVencimiento DATE NULL,
    comprobante VARCHAR(255) NULL,
    PRIMARY KEY (idPago),
    KEY idx_pago_alumno (idAlumno),
    CONSTRAINT fk_pago_alumno FOREIGN KEY (idAlumno)
        REFERENCES alumno (idAlumno)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Constancias academicas solicitadas por alumnos.
CREATE TABLE constancia (
    idConstancia INT NOT NULL AUTO_INCREMENT,
    idAlumno INT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    fechaEmision DATE NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'solicitada',
    numeroConstancia VARCHAR(100) NULL,
    fechaSolicitud DATE NULL,
    observacion VARCHAR(255) NULL,
    formato VARCHAR(20) NULL,
    PRIMARY KEY (idConstancia),
    UNIQUE KEY uq_constancia_numero (numeroConstancia),
    KEY idx_constancia_alumno (idAlumno),
    CONSTRAINT fk_constancia_alumno FOREIGN KEY (idAlumno)
        REFERENCES alumno (idAlumno)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Cuentas de acceso de los usuarios de prueba y usuarios institucionales.
CREATE TABLE usuario (
    idUsuario INT NOT NULL AUTO_INCREMENT,
    correo VARCHAR(150) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    rol ENUM('teacher', 'student', 'jefe', 'registrador') NOT NULL,
    idAlumno INT NULL,
    idDocente INT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    PRIMARY KEY (idUsuario),
    UNIQUE KEY uq_usuario_correo (correo),
    CONSTRAINT fk_usuario_alumno FOREIGN KEY (idAlumno) REFERENCES alumno (idAlumno)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_usuario_docente FOREIGN KEY (idDocente) REFERENCES docente (idDocente)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Actividades que se muestran en Tareas y en el resumen de cada rol.
CREATE TABLE tarea (
    idTarea INT NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(180) NOT NULL,
    nrcCurso INT NULL,
    fechaAsignacion DATE NOT NULL,
    fechaEntrega DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'Tarea',
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    color VARCHAR(20) NULL DEFAULT '#4F46E5',
    PRIMARY KEY (idTarea),
    KEY idx_tarea_curso (nrcCurso),
    CONSTRAINT fk_tarea_curso FOREIGN KEY (nrcCurso) REFERENCES curso (nrcCurso)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- El modelo queda listo para Database > Reverse Engineer en Workbench.

-- =============================================================
-- DATOS DEMO PARA EL DASHBOARD
-- Periodo de referencia: 2026-II
-- =============================================================

INSERT INTO alumno (idAlumno, nombre, apellido, grupo, dni, correo, telefono, fechaNacimiento, estado) VALUES
(1, 'Valeria', 'Castillo Rojas', 'A1', '74125896', 'valeria.castillo@academiadecam.edu.pe', '987654321', '2004-03-18', 'activo'),
(2, 'Diego', 'Mendoza Salazar', 'B1', '72841653', 'diego.mendoza@academiadecam.edu.pe', '986321450', '2003-11-07', 'activo'),
(3, 'Camila', 'Torres Huaman', 'A2', '75630981', 'camila.torres@academiadecam.edu.pe', '985147236', '2005-01-25', 'activo'),
(4, 'Mateo', 'Quispe Navarro', 'B2', '71984562', 'mateo.quispe@academiadecam.edu.pe', '984236517', '2002-08-12', 'activo'),
(5, 'Luciana', 'Paredes Flores', 'A3', '76851420', 'luciana.paredes@academiadecam.edu.pe', '983741526', '2004-06-30', 'activo'),
(6, 'Sebastian', 'Vargas Leon', 'B3', '73419685', 'sebastian.vargas@academiadecam.edu.pe', '982654713', '2003-04-16', 'activo'),
(7, 'Andrea', 'Salinas Vega', 'A4', '78204519', 'andrea.salinas@academiadecam.edu.pe', '981563742', '2005-09-21', 'activo'),
(8, 'Nicolas', 'Fernandez Ruiz', 'B4', '70541863', 'nicolas.fernandez@academiadecam.edu.pe', '980472631', '2002-12-03', 'suspendido'),
(9, 'Renata', 'Flores Medina', 'A5', '71620384', 'renata.flores@academiadecam.edu.pe', '979851264', '2004-10-11', 'activo'),
(10, 'Gabriel', 'Cruz Paredes', 'B5', '74851629', 'gabriel.cruz@academiadecam.edu.pe', '978642315', '2003-02-27', 'activo'),
(11, 'Sofia', 'Mamani Rios', 'A6', '76984512', 'sofia.mamani@academiadecam.edu.pe', '977531426', '2005-07-19', 'activo'),
(12, 'Bruno', 'Herrera Luna', 'B6', '78310456', 'bruno.herrera@academiadecam.edu.pe', '976420531', '2004-01-09', 'activo');

INSERT INTO docente (idDocente, nombre, apellido, especialidad, correo, telefono, estado) VALUES
(1, 'Mariana', 'Soto Delgado', 'Programacion y bases de datos', 'mariana.soto@academiadecam.edu.pe', '976123450', 'activo'),
(2, 'Jorge', 'Ramirez Ponce', 'Matematicas aplicadas', 'jorge.ramirez@academiadecam.edu.pe', '975234601', 'activo'),
(3, 'Patricia', 'Nunez Cabrera', 'Gestion de proyectos', 'patricia.nunez@academiadecam.edu.pe', '974345612', 'activo'),
(4, 'Ricardo', 'Vega Molina', 'Comunicacion profesional', 'ricardo.vega@academiadecam.edu.pe', '973456123', 'activo'),
(5, 'Elena', 'Campos Ruiz', 'Analisis de datos', 'elena.campos@academiadecam.edu.pe', '972345614', 'activo'),
(6, 'Oscar', 'Paredes Silva', 'Ingenieria de software', 'oscar.paredes@academiadecam.edu.pe', '971234605', 'activo');

INSERT INTO curso (nrcCurso, nombreCurso, descripcion, creditos, horasSemanal, estado) VALUES
(1101, 'Fundamentos de Programacion', 'Algoritmos, estructuras de control y buenas practicas.', 4, 6, 'activo'),
(1102, 'Bases de Datos', 'Modelado relacional, SQL y consultas sobre datos academicos.', 4, 6, 'activo'),
(1103, 'Matematica Aplicada', 'Herramientas matematicas para resolver problemas tecnicos.', 3, 4, 'activo'),
(1104, 'Gestion de Proyectos', 'Planificacion, seguimiento y entrega de proyectos.', 3, 4, 'activo'),
(1105, 'Comunicacion Profesional', 'Redaccion, presentaciones y comunicacion en equipos.', 2, 3, 'activo'),
(1106, 'Analisis de Datos', 'Indicadores, limpieza y visualizacion de informacion.', 4, 5, 'activo'),
(1107, 'Ingenieria de Software', 'Requisitos, arquitectura y pruebas de aplicaciones.', 4, 6, 'activo'),
(1108, 'Seguridad Informatica', 'Principios de seguridad, riesgos y controles basicos.', 3, 4, 'activo');

INSERT INTO seccion (idSeccion, nrcCurso, idDocente, nombreSeccion, horario, aula, capacidad, turno, estado) VALUES
(1, 1101, 1, 'A', 'Lun y Mie 08:00-11:00', 'Lab 201', 30, 'manana', 'activa'),
(2, 1102, 1, 'A', 'Mar y Jue 08:00-11:00', 'Lab 202', 28, 'manana', 'activa'),
(3, 1103, 2, 'A', 'Lun y Mie 11:00-13:00', 'Aula 105', 35, 'manana', 'activa'),
(4, 1104, 3, 'A', 'Mar y Jue 14:00-16:00', 'Aula 301', 30, 'tarde', 'activa'),
(5, 1105, 4, 'A', 'Viernes 08:00-11:00', 'Aula 204', 35, 'manana', 'activa'),
(6, 1106, 1, 'A', 'Viernes 14:00-19:00', 'Lab 202', 25, 'tarde', 'activa'),
(7, 1107, 5, 'A', 'Lun y Mie 16:00-19:00', 'Lab 203', 28, 'tarde', 'activa'),
(8, 1108, 6, 'A', 'Mar y Jue 16:00-18:00', 'Aula 302', 30, 'tarde', 'activa');

INSERT INTO matricula (idMatricula, idAlumno, nrcCurso, idSeccion, fecha, periodoAcademico, estado, modalidad, fechaRegistro) VALUES
(1, 1, 1101, 1, '2026-08-10', '2026-II', 'activa', 'presencial', '2026-08-08 09:15:00'),
(2, 1, 1102, 2, '2026-08-10', '2026-II', 'activa', 'presencial', '2026-08-08 09:18:00'),
(3, 1, 1103, 3, '2026-08-10', '2026-II', 'activa', 'presencial', '2026-08-08 09:21:00'),
(4, 2, 1101, 1, '2026-08-11', '2026-II', 'activa', 'presencial', '2026-08-11 10:02:00'),
(5, 2, 1104, 4, '2026-08-11', '2026-II', 'activa', 'hibrida', '2026-08-11 10:06:00'),
(6, 3, 1102, 2, '2026-08-11', '2026-II', 'activa', 'presencial', '2026-08-11 11:30:00'),
(7, 3, 1105, 5, '2026-08-11', '2026-II', 'activa', 'presencial', '2026-08-11 11:34:00'),
(8, 4, 1103, 3, '2026-08-12', '2026-II', 'activa', 'presencial', '2026-08-12 08:45:00'),
(9, 5, 1101, 1, '2026-08-12', '2026-II', 'activa', 'hibrida', '2026-08-12 14:10:00'),
(10, 5, 1106, 6, '2026-08-12', '2026-II', 'activa', 'presencial', '2026-08-12 14:14:00'),
(11, 6, 1104, 4, '2026-08-13', '2026-II', 'activa', 'presencial', '2026-08-13 09:20:00'),
(12, 7, 1105, 5, '2026-08-13', '2026-II', 'activa', 'presencial', '2026-08-13 09:25:00'),
(13, 8, 1102, 2, '2026-08-13', '2026-II', 'retirada', 'presencial', '2026-08-13 09:40:00'),
(14, 9, 1107, 7, '2026-08-14', '2026-II', 'activa', 'hibrida', '2026-08-14 08:15:00'),
(15, 9, 1108, 8, '2026-08-14', '2026-II', 'activa', 'presencial', '2026-08-14 08:19:00'),
(16, 10, 1107, 7, '2026-08-15', '2026-II', 'activa', 'presencial', '2026-08-15 10:25:00'),
(17, 11, 1108, 8, '2026-08-15', '2026-II', 'activa', 'presencial', '2026-08-15 10:28:00'),
(18, 12, 1106, 6, '2026-08-16', '2026-II', 'activa', 'presencial', '2026-08-16 11:10:00');

INSERT INTO calificacion (idCalificacion, idAlumno, nrcCurso, tipoEvaluacion, nota, fecha, porcentaje, observacion, estado) VALUES
(1, 1, 1101, 'Practica 1', 18.00, '2026-08-28', 20.00, 'Buen manejo de algoritmos.', 'registrada'),
(2, 1, 1101, 'Parcial', 16.50, '2026-09-12', 30.00, 'Debe reforzar modularidad.', 'registrada'),
(3, 1, 1102, 'Practica 1', 17.00, '2026-09-02', 20.00, 'Consultas correctamente planteadas.', 'registrada'),
(4, 2, 1101, 'Practica 1', 14.00, '2026-08-28', 20.00, 'Revisar ciclos anidados.', 'registrada'),
(5, 2, 1104, 'Avance de proyecto', 17.50, '2026-09-10', 30.00, 'Entrega completa y puntual.', 'registrada'),
(6, 3, 1102, 'Practica 1', 19.00, '2026-09-02', 20.00, 'Excelente modelado relacional.', 'registrada'),
(7, 3, 1105, 'Exposicion', 18.00, '2026-09-05', 25.00, 'Comunicacion clara.', 'registrada'),
(8, 4, 1103, 'Practica 1', 13.50, '2026-08-31', 20.00, 'Requiere asesoria adicional.', 'registrada'),
(9, 5, 1101, 'Parcial', 15.00, '2026-09-12', 30.00, NULL, 'registrada'),
(10, 5, 1106, 'Practica 1', 16.00, '2026-09-09', 20.00, 'Buen uso de indicadores.', 'registrada'),
(11, 6, 1104, 'Control de lectura', 18.50, '2026-08-29', 15.00, NULL, 'registrada'),
(12, 7, 1105, 'Practica de redaccion', 16.50, '2026-09-04', 25.00, NULL, 'registrada'),
(13, 9, 1107, 'Arquitectura', 17.00, '2026-09-06', 20.00, 'Buen diseño de componentes.', 'registrada'),
(14, 9, 1108, 'Control de seguridad', 18.50, '2026-09-08', 25.00, NULL, 'registrada'),
(15, 10, 1107, 'Requisitos', 14.00, '2026-09-07', 20.00, 'Debe completar los casos de uso.', 'registrada'),
(16, 11, 1108, 'Practica de riesgos', 19.00, '2026-09-09', 25.00, 'Excelente identificacion de riesgos.', 'registrada'),
(17, 12, 1106, 'Visualizacion', 15.50, '2026-09-10', 20.00, NULL, 'registrada'),
(18, 12, 1106, 'Limpieza de datos', 16.00, '2026-09-15', 25.00, NULL, 'registrada');

INSERT INTO asistencia (idAsistencia, idAlumno, nrcCurso, fecha, hora, estado, observacion, tipoSesion) VALUES
(1, 1, 1101, '2026-09-14', '08:03:00', 'presente', NULL, 'clase'),
(2, 1, 1102, '2026-09-15', '08:01:00', 'presente', NULL, 'clase'),
(3, 1, 1103, '2026-09-16', '11:12:00', 'tardanza', 'Ingreso 12 minutos tarde.', 'clase'),
(4, 2, 1101, '2026-09-14', '08:00:00', 'presente', NULL, 'clase'),
(5, 2, 1104, '2026-09-15', NULL, 'falta', 'Inasistencia sin justificativo.', 'clase'),
(6, 3, 1102, '2026-09-15', '07:58:00', 'presente', NULL, 'clase'),
(7, 3, 1105, '2026-09-18', '08:04:00', 'presente', NULL, 'exposicion'),
(8, 4, 1103, '2026-09-16', '11:00:00', 'presente', NULL, 'clase'),
(9, 5, 1101, '2026-09-14', '08:10:00', 'tardanza', NULL, 'clase'),
(10, 5, 1106, '2026-09-18', '14:00:00', 'presente', NULL, 'laboratorio'),
(11, 6, 1104, '2026-09-15', '14:02:00', 'presente', NULL, 'clase'),
(12, 7, 1105, '2026-09-18', NULL, 'falta', 'Presento justificativo pendiente.', 'clase'),
(13, 9, 1107, '2026-09-17', '16:02:00', 'presente', NULL, 'clase'),
(14, 9, 1108, '2026-09-18', '16:10:00', 'tardanza', NULL, 'clase'),
(15, 10, 1107, '2026-09-17', NULL, 'falta', 'Justificativo pendiente.', 'clase'),
(16, 11, 1108, '2026-09-18', '16:00:00', 'presente', NULL, 'clase'),
(17, 12, 1106, '2026-09-18', '14:02:00', 'presente', NULL, 'laboratorio'),
(18, 12, 1106, '2026-09-19', '14:01:00', 'presente', NULL, 'laboratorio');

INSERT INTO reclamo (idReclamo, idAlumno, fecha, motivo, descripcion, estado, fechaAtencion, prioridad) VALUES
(1, 1, '2026-09-03', 'Actualizacion de nota', 'La nota de la practica 1 aun no aparece en el portal.', 'atendido', '2026-09-04', 'normal'),
(2, 3, '2026-09-08', 'Cambio de horario', 'Solicita revisar el cruce con una actividad institucional.', 'en_revision', NULL, 'alta'),
(3, 5, '2026-09-15', 'Constancia de estudios', 'Requiere la constancia para postular a una practica.', 'pendiente', NULL, 'normal'),
(4, 9, '2026-09-17', 'Cambio de grupo', 'Solicita cambiar de horario por practicas profesionales.', 'pendiente', NULL, 'alta'),
(5, 10, '2026-09-18', 'Revision de asistencia', 'Solicita revisar una falta registrada durante una clase virtual.', 'en_revision', NULL, 'normal');

INSERT INTO respuesta_reclamo (idRespuesta, idReclamo, fecha, respuesta, estado, observacion, responsable) VALUES
(1, 1, '2026-09-04', 'La calificacion fue verificada y ya se encuentra registrada.', 'resuelta', 'Se notifico al alumno por correo.', 'Mesa de ayuda academica'),
(2, 2, '2026-09-10', 'El cambio de horario fue derivado a coordinacion.', 'en_proceso', NULL, 'Coordinacion academica'),
(3, 5, '2026-09-19', 'La asistencia sera revisada con el docente del curso.', 'en_proceso', NULL, 'Mesa de ayuda academica');

INSERT INTO pago (idPago, idAlumno, fechaPago, monto, concepto, estado, metodoPago, numeroOperacion, fechaVencimiento, comprobante) VALUES
(1, 1, '2026-08-09', 420.00, 'Matricula 2026-II', 'pagado', 'transferencia', 'TRX-20260809-001', '2026-08-12', 'COMP-0001'),
(2, 2, '2026-08-11', 420.00, 'Matricula 2026-II', 'pagado', 'tarjeta', 'POS-20260811-014', '2026-08-12', 'COMP-0002'),
(3, 3, NULL, 180.00, 'Cuota septiembre 2026', 'pendiente', NULL, NULL, '2026-09-20', NULL),
(4, 4, '2026-08-12', 420.00, 'Matricula 2026-II', 'pagado', 'yape', 'YAP-20260812-882', '2026-08-12', 'COMP-0003'),
(5, 5, '2026-08-13', 420.00, 'Matricula 2026-II', 'pagado', 'transferencia', 'TRX-20260813-027', '2026-08-14', 'COMP-0004'),
(6, 6, NULL, 180.00, 'Cuota septiembre 2026', 'vencido', NULL, NULL, '2026-09-10', NULL),
(7, 7, '2026-08-14', 420.00, 'Matricula 2026-II', 'pagado', 'tarjeta', 'POS-20260814-031', '2026-08-15', 'COMP-0005'),
(8, 9, '2026-08-15', 420.00, 'Matricula 2026-II', 'pagado', 'transferencia', 'TRX-20260815-043', '2026-08-16', 'COMP-0006'),
(9, 10, NULL, 180.00, 'Cuota septiembre 2026', 'pendiente', NULL, NULL, '2026-09-20', NULL),
(10, 11, '2026-08-16', 420.00, 'Matricula 2026-II', 'pagado', 'yape', 'YAP-20260816-125', '2026-08-17', 'COMP-0007');

INSERT INTO constancia (idConstancia, idAlumno, tipo, fechaEmision, estado, numeroConstancia, fechaSolicitud, observacion, formato) VALUES
(1, 1, 'Constancia de estudios', '2026-09-05', 'emitida', 'CE-2026-0001', '2026-09-03', 'Disponible para descarga.', 'PDF'),
(2, 3, 'Constancia de matricula', NULL, 'en_proceso', NULL, '2026-09-08', 'Pendiente de validacion administrativa.', 'PDF'),
(3, 5, 'Constancia de estudios', NULL, 'solicitada', NULL, '2026-09-15', NULL, 'PDF'),
(4, 7, 'Record academico', '2026-09-02', 'emitida', 'RA-2026-0004', '2026-08-30', NULL, 'PDF'),
(5, 9, 'Constancia de estudios', NULL, 'solicitada', NULL, '2026-09-17', 'Pendiente de validacion.', 'PDF'),
(6, 10, 'Constancia de matricula', '2026-09-20', 'emitida', 'CM-2026-0006', '2026-09-18', NULL, 'PDF');

INSERT INTO usuario (idUsuario, correo, contrasena, nombre, rol, idAlumno, idDocente, estado) VALUES
(1, 'prof@acadecam.edu.pe', 'decam2024', 'Profesor Demo', 'teacher', NULL, 1, 'activo'),
(2, 'alumno@acadecam.edu.pe', 'alumno2024', 'Alumno Demo', 'student', 1, NULL, 'activo'),
(3, 'jefe@acadecam.edu.pe', 'jefe2024', 'Jefe Academico', 'jefe', NULL, NULL, 'activo'),
(4, 'registrador@acadecam.edu.pe', 'reg2024', 'Registrador', 'registrador', NULL, NULL, 'activo');

INSERT INTO tarea (idTarea, titulo, nrcCurso, fechaAsignacion, fechaEntrega, tipo, estado, color) VALUES
(1, 'Modelo entidad-relacion del proyecto', 1102, '2026-09-10', '2026-09-25', 'Proyecto', 'pendiente', '#4F46E5'),
(2, 'Practica de consultas SQL', 1102, '2026-09-05', '2026-09-18', 'Tarea', 'atrasada', '#F59E0B'),
(3, 'Informe de algoritmos', 1101, '2026-09-01', '2026-09-12', 'Informe', 'entregada', '#10B981'),
(4, 'Ejercicios de matematica aplicada', 1103, '2026-09-16', '2026-09-29', 'Practica', 'pendiente', '#14B8A6');
