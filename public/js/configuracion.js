
const CFG={
  name:'Academia Decam',
  apiUrl:'http://localhost:3000',
  groups:['A1','B1','A2','B2','A3','B3','A4','B4','A5','B5','A6','B6'],
  directorio:[
    {label:'Direccion',val:'Ext. 100',icon:'ti-phone'},
    {label:'Orientacion',val:'Ext. 205',icon:'ti-phone'},
    {label:'Enfermeria',val:'Ext. 110',icon:'ti-phone'},
    {label:'Contacto',val:'info@miescuela.edu.mx',icon:'ti-mail'}
  ]
};
// ══════════════════════
// USUARIOS REGISTRADOS
// Para agregar usuarios: copia una linea y cambia los datos
// ══════════════════════
const USUARIOS=[
  // MAESTROS
  {email:'prof@acadecam.edu.pe',pass:'decam2024',name:'Profesor Demo',initials:'PD',role:'teacher',roleLabel:'Maestro'},
  // ALUMNOS
  {email:'alumno@acadecam.edu.pe',pass:'alumno2024',name:'Alumno Demo',initials:'AD',role:'student',roleLabel:'Alumno - A1',group:'A1'},
  // JEFE ACADEMICO
  {email:'jefe@acadecam.edu.pe',pass:'jefe2024',name:'Jefe Academico',initials:'JA',role:'jefe',roleLabel:'Jefe Academico'},
  // REGISTRADOR
  {email:'registrador@acadecam.edu.pe',pass:'reg2024',name:'Registrador',initials:'RG',role:'registrador',roleLabel:'Registrador'},
];
// Mantener DEMO por compatibilidad interna
const DEMO={
  teacher:USUARIOS.find(u=>u.role==='teacher')||{},
  student:USUARIOS.find(u=>u.role==='student')||{}
};
