import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import cloudinary from '../../lib/cloudinary.js';
import User from '../../models/User.js';
import Mascota from '../../models/Mascota.js';
import Cita from '../../models/Cita.js';
import Emergencia from '../../models/Emergencia.js';
import Notificacion from '../../models/Notificacion.js';
import Pago from '../../models/Pago.js';
import Valoracion from '../../models/Valoracion.js';
import Prestador from '../../models/Prestador.js';
import Servicio from '../../models/Servicio.js';
import Disponibilidad from '../../models/Disponibilidad.js';
import PrestadorValidacion from '../../models/PrestadorValidacion.js';
import Anunciante from '../../models/Anunciante.js';
import CampanaBanner from '../../models/CampanaBanner.js';
import Suscripcion from '../../models/Suscripcion.js';

// Multer en memoria para uploads del admin (publicidad)
const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const okExt = allowed.test(file.originalname.toLowerCase());
    const okMime = allowed.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, gif, webp)'));
  },
});

const uploadBufferToCloudinary = (buffer, folder = 'vetya/publicidad') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

const router = express.Router();

// Middleware para autenticación del panel administrativo
const isAuthenticated = (req, res, next) => {
  // Verificar si el usuario está autenticado como administrador
  // Para propósitos de desarrollo, esto está simplificado
  // En producción, deberías implementar una autenticación adecuada
  const adminToken = req.cookies?.adminToken;
  
  if (!adminToken) {
    return res.redirect('/admin/login');
  }
  
  // Almacenar token para uso en vistas
  res.locals.adminToken = adminToken;
  next();
};

// Rutas para autenticación
router.get('/login', (req, res) => {
  res.render('login', { error: null, mensaje: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log('=== ADMIN LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password provided:', password ? 'YES' : 'NO');
    
    // Usar la API existente para autenticar
    const loginUrl = `http://localhost:${process.env.PORT || 3000}/api/auth/login`;
    console.log('Calling API at:', loginUrl);
    
    const response = await axios.post(loginUrl, {
      email,
      password,
      appType: 'admin' // Especificar que es una autenticación de administrador
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    
    // Verificar si el usuario es administrador
    if (!response.data.user) {
      console.log('ERROR: No user data in response');
      return res.render('login', { error: 'Error: No se recibieron datos del usuario' });
    }
    
    if (response.data.user.role !== 'admin') {
      console.log('Usuario no es admin:', response.data.user.role);
      return res.render('login', { error: 'Acceso denegado. No tienes permisos de administrador.' });
    }
    
    console.log('Usuario admin verificado, estableciendo cookie...');
    
    // Establecer cookie de autenticación
    res.cookie('adminToken', response.data.token, { 
      httpOnly: false, // Permitir acceso desde JavaScript
      secure: false, // Para desarrollo local
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 día
    });
    
    console.log('Cookie establecida, redirigiendo a dashboard...');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.log('=== ADMIN LOGIN ERROR ===');
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
      console.log('Error Message:', error.message);
      
      // Si el error es por email no verificado, redirigir a verificación
      if (error.response.status === 403 && error.response.data.requiresVerification) {
        console.log('Email no verificado, redirigiendo a pantalla de verificación');
        return res.render('email-verification', { 
          email: error.response.data.email,
          error: null,
          mensaje: null,
          isResending: false
        });
      }
    } else {
      console.log('General Error:', error.message);
    }
    res.render('login', { error: 'Credenciales inválidas' });
  }
});

// Rutas para verificación de email
router.get('/verify-email', (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.redirect('/admin/login');
  }
  res.render('email-verification', { 
    email,
    error: null,
    mensaje: null,
    isResending: false
  });
});

router.post('/verify-email', async (req, res) => {
  const { email, code1, code2, code3, code4, code5, code6 } = req.body;
  const code = code1 + code2 + code3 + code4 + code5 + code6;
  
  try {
    console.log('=== ADMIN EMAIL VERIFICATION ===');
    console.log('Email:', email);
    console.log('Code:', code);
    
    const response = await axios.post(`http://localhost:${process.env.PORT || 3000}/api/auth/verify-email`, {
      email,
      code
    });
    
    console.log('Verification successful:', response.data);
    
    // Si la verificación es exitosa, redirigir al login con mensaje
    res.render('login', { 
      error: null,
      mensaje: '✅ Email verificado exitosamente. Ahora puedes iniciar sesión.'
    });
  } catch (error) {
    console.log('=== ADMIN VERIFICATION ERROR ===');
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    }
    res.render('email-verification', { 
      email,
      error: error.response?.data?.message || 'Código inválido o expirado',
      mensaje: null,
      isResending: false
    });
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  
  try {
    console.log('=== ADMIN RESEND VERIFICATION ===');
    console.log('Email:', email);
    
    await axios.post(`http://localhost:${process.env.PORT || 3000}/api/auth/resend-verification`, {
      email
    });
    
    console.log('Verification code resent successfully');
    
    res.render('email-verification', { 
      email,
      error: null,
      mensaje: '✅ Nuevo código enviado a tu correo electrónico.',
      isResending: false
    });
  } catch (error) {
    console.log('=== ADMIN RESEND ERROR ===');
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    }
    res.render('email-verification', { 
      email,
      error: error.response?.data?.message || 'Error al reenviar el código',
      mensaje: null,
      isResending: false
    });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/admin/login');
});

// Ruta principal - Dashboard
router.get('/', isAuthenticated, (req, res) => {
  res.redirect('/admin/dashboard');
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO DASHBOARD ===');
    console.log('Token:', res.locals.adminToken);
    
    // Obtener datos para el dashboard
    const [usuariosRes, prestadoresRes, mascotasRes, citasRes, emergenciasRes] = await Promise.all([
      axios.get(`http://localhost:${process.env.PORT || 3000}/api/users`, {
        headers: { Authorization: `Bearer ${res.locals.adminToken}` }
      }).catch(err => {
        console.error('Error usuarios:', err.message);
        return { data: [] };
      }),
      axios.get(`http://localhost:${process.env.PORT || 3000}/api/prestadores`, {
        headers: { Authorization: `Bearer ${res.locals.adminToken}` }
      }).catch(err => {
        console.error('Error prestadores:', err.message);
        return { data: [] };
      }),
      axios.get(`http://localhost:${process.env.PORT || 3000}/api/mascotas`, {
        headers: { Authorization: `Bearer ${res.locals.adminToken}` }
      }).catch(err => {
        console.error('Error mascotas:', err.message);
        return { data: [] };
      }),
      axios.get(`http://localhost:${process.env.PORT || 3000}/api/citas`, {
        headers: { Authorization: `Bearer ${res.locals.adminToken}` }
      }).catch(err => {
        console.error('Error citas:', err.message);
        return { data: [] };
      }),
      axios.get(`http://localhost:${process.env.PORT || 3000}/api/emergencias`, {
        headers: { Authorization: `Bearer ${res.locals.adminToken}` }
      }).catch(err => {
        console.error('Error emergencias:', err.message);
        return { data: [] };
      })
    ]);
    
    // Manejar diferentes formatos de respuesta de API
    const usuarios = Array.isArray(usuariosRes.data) ? usuariosRes.data : 
                     usuariosRes.data?.data ? usuariosRes.data.data : [];
    const prestadores = Array.isArray(prestadoresRes.data) ? prestadoresRes.data :
                        prestadoresRes.data?.data ? prestadoresRes.data.data : [];
    const mascotas = Array.isArray(mascotasRes.data) ? mascotasRes.data :
                     mascotasRes.data?.data ? mascotasRes.data.data : [];
    const citas = Array.isArray(citasRes.data) ? citasRes.data :
                  citasRes.data?.data ? citasRes.data.data : [];
    const emergencias = Array.isArray(emergenciasRes.data) ? emergenciasRes.data :
                        emergenciasRes.data?.data ? emergenciasRes.data.data : [];
    
    console.log('Contadores:', {
      usuarios: usuarios.length,
      prestadores: prestadores.length,
      mascotas: mascotas.length,
      citas: citas.length,
      emergencias: emergencias.length
    });
    
    res.render('dashboard', {
      contadores: {
        usuarios: usuarios.length,
        prestadores: prestadores.length,
        mascotas: mascotas.length,
        citas: citas.length,
        emergencias: emergencias.length
      },
      error: null
    });
  } catch (error) {
    console.error('Error general en dashboard:', error.message);
    res.render('dashboard', { 
      error: 'Error al cargar datos del dashboard', 
      contadores: {
        usuarios: 0,
        prestadores: 0,
        mascotas: 0,
        citas: 0,
        emergencias: 0
      }
    });
  }
});

// Rutas para gestión de usuarios
router.get('/usuarios', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO USUARIOS ===');
    const response = await axios.get(`http://localhost:${process.env.PORT || 3000}/api/users`, {
      headers: { Authorization: `Bearer ${res.locals.adminToken}` }
    });
    
    // Manejar diferentes formatos de respuesta
    const usuarios = Array.isArray(response.data) ? response.data :
                     response.data?.data ? response.data.data : [];
    
    console.log('Total usuarios encontrados:', usuarios.length);
    
    res.render('usuarios/index', { 
      usuarios: usuarios,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar usuarios:', error.message);
    res.render('usuarios/index', { 
      error: 'Error al cargar usuarios', 
      usuarios: [] 
    });
  }
});

router.get('/usuarios/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO DETALLE DE USUARIO ===');
    console.log('ID Usuario:', req.params.id);
    
    // Obtener datos del usuario
    const usuario = await User.findById(req.params.id).select('-password');
    
    if (!usuario) {
      return res.redirect('/admin/usuarios');
    }
    
    // Obtener todas las relaciones del usuario en paralelo
    const [mascotas, citas, emergencias, notificaciones, pagos, valoraciones] = await Promise.all([
      // Mascotas del usuario
      Mascota.find({ propietario: req.params.id }).sort({ createdAt: -1 }),
      
      // Citas del usuario
      Cita.find({ usuario: req.params.id })
        .populate('prestador', 'nombre tipo email telefono')
        .populate('servicio', 'nombre categoria')
        .populate('mascota', 'nombre tipo')
        .sort({ fecha: -1 }),
      
      // Emergencias del usuario (usa 'veterinario' no 'prestador')
      Emergencia.find({ usuario: req.params.id })
        .populate('veterinario', 'nombre tipo email telefono')
        .populate('mascota', 'nombre tipo')
        .sort({ createdAt: -1 }),
      
      // Notificaciones del usuario
      Notificacion.find({ usuario: req.params.id })
        .sort({ createdAt: -1 })
        .limit(20),
      
      // Pagos del usuario (tiene referencia polimórfica, no campos directos)
      Pago.find({ usuario: req.params.id })
        .populate('prestador', 'nombre tipo')
        .sort({ createdAt: -1 }),
      
      // Valoraciones realizadas por el usuario
      Valoracion.find({ usuario: req.params.id })
        .populate('prestador', 'nombre tipo')
        .populate('mascota', 'nombre')
        .populate('cita')
        .sort({ createdAt: -1 })
    ]);
    
    // Calcular estadísticas
    const estadisticas = {
      totalMascotas: mascotas.length,
      totalCitas: citas.length,
      citasPendientes: citas.filter(c => c.estado === 'Pendiente').length,
      citasConfirmadas: citas.filter(c => c.estado === 'Confirmada').length,
      citasCompletadas: citas.filter(c => c.estado === 'Completada').length,
      citasCanceladas: citas.filter(c => c.estado === 'Cancelada').length,
      totalEmergencias: emergencias.length,
      emergenciasActivas: emergencias.filter(e => ['Solicitada', 'Asignada', 'En camino', 'En atención'].includes(e.estado)).length,
      emergenciasCompletadas: emergencias.filter(e => e.estado === 'Atendida').length,
      totalPagos: pagos.length,
      totalGastado: pagos.reduce((sum, p) => sum + (p.monto || 0), 0),
      pagosCompletados: pagos.filter(p => p.estado === 'completado').length,
      pagosPendientes: pagos.filter(p => p.estado === 'pendiente').length,
      totalValoraciones: valoraciones.length,
      promedioCalificaciones: valoraciones.length > 0 
        ? (valoraciones.reduce((sum, v) => sum + v.calificacion, 0) / valoraciones.length).toFixed(1)
        : 0
    };
    
    console.log('Estadísticas:', estadisticas);
    console.log('Renderizando vista usuarios/detalle');
    
    res.render('usuarios/detalle', { 
      usuario,
      mascotas,
      citas,
      emergencias,
      notificaciones,
      pagos,
      valoraciones,
      estadisticas,
      adminToken: res.locals.adminToken,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar detalle de usuario:', error);
    console.error('Stack trace:', error.stack);
    res.render('usuarios/index', {
      error: 'Error al cargar detalle de usuario: ' + error.message,
      usuarios: []
    });
  }
});

// Rutas para gestión de prestadores
router.get('/prestadores', isAuthenticated, async (req, res) => {
  try {
    // Obtener prestadores y validaciones en paralelo
    const [prestadoresResponse, validacionesResponse] = await Promise.all([
      axios.get(`http://localhost:${process.env.PORT || 3000}/api/prestadores`, {
        headers: { Authorization: `Bearer ${res.locals.adminToken}` }
      }),
      axios.get(`http://localhost:${process.env.PORT || 3000}/api/validacion/admin/todas?limit=1000`, {
        headers: { Authorization: `Bearer ${res.locals.adminToken}` }
      })
    ]);
    
    const prestadores = prestadoresResponse.data;
    const validaciones = validacionesResponse.data.prestadores || [];
    
    // Crear un mapa de validaciones por prestadorId
    const validacionesMap = {};
    validaciones.forEach(validacion => {
      if (validacion.prestador && validacion.prestador._id) {
        validacionesMap[validacion.prestador._id] = validacion;
      }
    });
    
    // Enriquecer prestadores con información de validación
    const prestadoresConValidacion = prestadores.map(prestador => {
      const validacion = validacionesMap[prestador._id];
      return {
        ...prestador,
        validacion: validacion || null,
        estadoValidacion: validacion ? validacion.estado : 'sin_validacion'
      };
    });
    
    // Debug temporal para verificar datos
    console.log('=== DEBUG PRESTADORES CON VALIDACION ===');
    prestadoresConValidacion.forEach((prestador, index) => {
      if (index < 3) { // Solo mostrar los primeros 3 para no saturar el log
        console.log(`Prestador ${index + 1}:`);
        console.log(`  - ID: ${prestador._id}`);
        console.log(`  - Nombre: ${prestador.nombre}`);
        console.log(`  - Activo: ${prestador.activo}`);
        console.log(`  - EstadoValidacion directo: ${prestador.estadoValidacion}`);
        console.log(`  - Tiene validacion: ${!!prestador.validacion}`);
        if (prestador.validacion) {
          console.log(`  - Estado validacion: ${prestador.validacion.estado}`);
          console.log(`  - Progreso: ${JSON.stringify(prestador.validacion.progreso)}`);
        }
        console.log('---');
      }
    });
    console.log('=== FIN DEBUG ===');
    
    // Renderizamos la vista prestadores/index
    res.render('prestadores/index', { 
      prestadores: prestadoresConValidacion,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar prestadores:', error);
    res.render('prestadores/index', { error: 'Error al cargar prestadores', prestadores: [] });
  }
});

router.get('/prestadores/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO DETALLE DE PRESTADOR ===');
    console.log('ID Prestador:', req.params.id);
    
    // Obtener datos del prestador
    const prestador = await Prestador.findById(req.params.id).populate('usuario', 'username email');
    
    if (!prestador) {
      return res.redirect('/admin/prestadores');
    }
    
    // Obtener todas las relaciones del prestador en paralelo
    const [citas, emergencias, pagos, valoraciones, servicios, disponibilidades, notificaciones, validacion] = await Promise.all([
      // Citas del prestador
      Cita.find({ prestador: req.params.id })
        .populate('usuario', 'username email')
        .populate('servicio', 'nombre categoria')
        .populate('mascota', 'nombre tipo')
        .sort({ fecha: -1 })
        .limit(100),
      
      // Emergencias atendidas (solo si es veterinario)
      prestador.tipo === 'Veterinario' 
        ? Emergencia.find({ veterinario: req.params.id })
            .populate('usuario', 'username email')
            .populate('mascota', 'nombre tipo')
            .sort({ createdAt: -1 })
            .limit(100)
        : Promise.resolve([]),
      
      // Pagos recibidos
      Pago.find({ prestador: req.params.id })
        .populate('usuario', 'username email')
        .sort({ createdAt: -1 })
        .limit(100),
      
      // Valoraciones recibidas
      Valoracion.find({ prestador: req.params.id })
        .populate('usuario', 'username email')
        .populate('mascota', 'nombre')
        .populate('cita')
        .sort({ createdAt: -1 })
        .limit(50),
      
      // Servicios ofrecidos
      Servicio.find({ prestadorId: req.params.id }).sort({ nombre: 1 }),
      
      // Disponibilidad configurada
      Disponibilidad.find({ prestador: req.params.id })
        .populate('servicio', 'nombre')
        .limit(50),
      
      // Notificaciones del prestador
      Notificacion.find({ prestador: req.params.id })
        .sort({ createdAt: -1 })
        .limit(20),
      
      // Validación del prestador
      PrestadorValidacion.findOne({ prestador: req.params.id })
    ]);
    
    // Calcular estadísticas
    const estadisticas = {
      totalCitas: citas.length,
      citasPendientes: citas.filter(c => c.estado === 'Pendiente').length,
      citasConfirmadas: citas.filter(c => c.estado === 'Confirmada').length,
      citasCompletadas: citas.filter(c => c.estado === 'Completada').length,
      citasCanceladas: citas.filter(c => c.estado === 'Cancelada').length,
      totalEmergencias: emergencias.length,
      emergenciasActivas: emergencias.filter(e => ['Solicitada', 'Asignada', 'En camino', 'En atención'].includes(e.estado)).length,
      emergenciasCompletadas: emergencias.filter(e => e.estado === 'Atendida').length,
      totalPagos: pagos.length,
      totalRecibido: pagos.filter(p => p.estado === 'Completado').reduce((sum, p) => sum + (p.monto || 0), 0),
      pagosCompletados: pagos.filter(p => p.estado === 'Completado').length,
      pagosPendientes: pagos.filter(p => p.estado === 'Pendiente').length,
      totalValoraciones: valoraciones.length,
      promedioCalificaciones: valoraciones.length > 0 
        ? (valoraciones.reduce((sum, v) => sum + v.calificacion, 0) / valoraciones.length).toFixed(1)
        : 0,
      totalServicios: servicios.length,
      serviciosActivos: servicios.filter(s => s.activo !== false).length
    };
    
    console.log('Estadísticas:', estadisticas);
    
    res.render('prestadores/detalle', { 
      prestador,
      citas,
      emergencias,
      pagos,
      valoraciones,
      servicios,
      disponibilidades,
      notificaciones,
      validacion,
      estadisticas,
      adminToken: res.locals.adminToken,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar detalle de prestador:', error);
    console.error('Stack trace:', error.stack);
    res.render('prestadores/index', {
      error: 'Error al cargar detalle de prestador: ' + error.message,
      prestadores: []
    });
  }
});

// Rutas para gestión de mascotas
router.get('/mascotas', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO MASCOTAS CON DATOS ENRIQUECIDOS ===');
    
    // Cargar mascotas, citas y emergencias en paralelo
    const [mascotasData, citasData, emergenciasData] = await Promise.all([
      Mascota.find()
        .populate('propietario', 'username email nombre apellido')
        .sort({ createdAt: -1 })
        .lean(),
      Cita.find().lean(),
      Emergencia.find().lean()
    ]);
    
    console.log('Mascotas encontradas:', mascotasData.length);
    console.log('Citas totales:', citasData.length);
    console.log('Emergencias totales:', emergenciasData.length);
    
    // Enriquecer cada mascota con sus estadísticas de citas y emergencias
    const mascotasEnriquecidas = mascotasData.map(mascota => {
      // Contar citas de esta mascota
      const citasMascota = citasData.filter(c => 
        c.mascota && c.mascota.toString() === mascota._id.toString()
      );
      
      // Contar emergencias de esta mascota
      const emergenciasMascota = emergenciasData.filter(e => 
        e.mascota && e.mascota.toString() === mascota._id.toString()
      );
      
      return {
        ...mascota,
        totalCitas: citasMascota.length,
        citasPendientes: citasMascota.filter(c => c.estado === 'Pendiente').length,
        citasCompletadas: citasMascota.filter(c => c.estado === 'Completada').length,
        totalEmergencias: emergenciasMascota.length,
        emergenciasActivas: emergenciasMascota.filter(e => 
          ['Solicitada', 'Asignada', 'En camino', 'En atención'].includes(e.estado)
        ).length
      };
    });
    
    console.log('Mascotas enriquecidas:', mascotasEnriquecidas.length);
    
    res.render('mascotas/index', { 
      mascotas: mascotasEnriquecidas,
      mensaje: null,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar mascotas:', error.message);
    console.error('Stack:', error.stack);
    res.render('mascotas/index', { 
      error: 'Error al cargar mascotas: ' + error.message, 
      mascotas: [],
      mensaje: null
    });
  }
});

// Ruta para detalle de mascota
router.get('/mascotas/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO DETALLE DE MASCOTA ===');
    console.log('Mascota ID:', req.params.id);
    
    // Cargar mascota con propietario, citas y emergencias en paralelo
    const [mascota, citas, emergencias] = await Promise.all([
      Mascota.findById(req.params.id)
        .populate('propietario', 'username email nombre apellido')
        .lean(),
      Cita.find({ mascota: req.params.id })
        .populate('prestador', 'nombre tipo email telefono')
        .populate('servicio', 'nombre categoria precio')
        .sort({ fecha: -1 })
        .lean(),
      Emergencia.find({ mascota: req.params.id })
        .populate('veterinario', 'nombre tipo email telefono')
        .sort({ createdAt: -1 })
        .lean()
    ]);
    
    if (!mascota) {
      return res.render('mascotas/index', {
        error: 'Mascota no encontrada',
        mascotas: [],
        mensaje: null
      });
    }
    
    console.log('Mascota encontrada:', mascota.nombre);
    console.log('Total citas:', citas.length);
    console.log('Total emergencias:', emergencias.length);
    
    // Calcular estadísticas
    const estadisticas = {
      totalCitas: citas.length,
      citasPendientes: citas.filter(c => c.estado === 'Pendiente').length,
      citasConfirmadas: citas.filter(c => c.estado === 'Confirmada').length,
      citasCompletadas: citas.filter(c => c.estado === 'Completada').length,
      citasCanceladas: citas.filter(c => c.estado === 'Cancelada').length,
      totalEmergencias: emergencias.length,
      emergenciasActivas: emergencias.filter(e => 
        ['Solicitada', 'Asignada', 'En camino', 'En atención'].includes(e.estado)
      ).length,
      emergenciasAtendidas: emergencias.filter(e => e.estado === 'Atendida').length,
      emergenciasCanceladas: emergencias.filter(e => e.estado === 'Cancelada').length
    };
    
    res.render('mascotas/detalle', {
      mascota,
      citas,
      emergencias,
      estadisticas,
      adminToken: res.locals.adminToken,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar detalle de mascota:', error);
    console.error('Stack:', error.stack);
    res.render('mascotas/index', {
      error: 'Error al cargar detalle de mascota: ' + error.message,
      mascotas: [],
      mensaje: null
    });
  }
});

// Rutas para gestión de citas
router.get('/citas', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO CITAS ===');
    const response = await axios.get(`http://localhost:${process.env.PORT || 3000}/api/citas`, {
      headers: { Authorization: `Bearer ${res.locals.adminToken}` }
    });
    
    // Manejar diferentes formatos de respuesta
    const citas = Array.isArray(response.data) ? response.data :
                  response.data?.data ? response.data.data : [];
    
    console.log('Total citas encontradas:', citas.length);
    
    res.render('citas/index', { 
      citas: citas,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar citas:', error.message);
    res.render('citas/index', { 
      error: 'Error al cargar citas', 
      citas: [] 
    });
  }
});

// Rutas para gestión de servicios
router.get('/servicios', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO SERVICIOS ===');
    const response = await axios.get(`http://localhost:${process.env.PORT || 3000}/api/servicios`, {
      headers: { Authorization: `Bearer ${res.locals.adminToken}` }
    });
    
    // Manejar diferentes formatos de respuesta
    const servicios = Array.isArray(response.data) ? response.data :
                      response.data?.data ? response.data.data : [];
    
    console.log('Total servicios encontrados:', servicios.length);
    
    res.render('servicios/index', { 
      servicios: servicios,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar servicios:', error.message);
    res.render('servicios/index', { 
      error: 'Error al cargar servicios', 
      servicios: [] 
    });
  }
});

// Rutas para gestión de emergencias
router.get('/emergencias', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO EMERGENCIAS ADMIN ===');
    
    // Obtener TODAS las emergencias directamente del modelo (no filtrar por usuario)
    const emergencias = await Emergencia.find()
      .populate('usuario', 'username email profilePicture telefono')
      .populate('mascota', 'nombre tipo raza imagen edad genero color')
      .populate('veterinario', 'nombre especialidad imagen rating telefono email')
      .sort({ fechaSolicitud: -1 })
      .lean();
    
    console.log('Total emergencias encontradas:', emergencias.length);
    
    // Debug para verificar datos
    if (emergencias.length > 0) {
      console.log('Primera emergencia:', {
        id: emergencias[0]._id,
        estado: emergencias[0].estado,
        tipoEmergencia: emergencias[0].tipoEmergencia,
        usuario: emergencias[0].usuario?.username,
        veterinario: emergencias[0].veterinario?.nombre,
        mascota: emergencias[0].mascota?.nombre,
        otroAnimal: emergencias[0].otroAnimal?.esOtroAnimal
      });
    }
    
    res.render('emergencias/index', { 
      emergencias: emergencias,
      mensaje: null,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar emergencias:', error.message);
    console.error('Stack:', error.stack);
    res.render('emergencias/index', { 
      error: 'Error al cargar emergencias: ' + error.message, 
      emergencias: [],
      mensaje: null
    });
  }
});

// Ruta para detalle de emergencia
router.get('/emergencias/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('=== CARGANDO DETALLE DE EMERGENCIA ===');
    console.log('Emergencia ID:', req.params.id);
    
    // Obtener la emergencia con todos los datos poblados
    const emergencia = await Emergencia.findById(req.params.id)
      .populate('usuario', 'username email profilePicture telefono')
      .populate('mascota', 'nombre tipo raza imagen edad genero color peso')
      .populate('veterinario', 'nombre especialidad imagen rating telefono email experiencia')
      .lean();
    
    if (!emergencia) {
      return res.render('emergencias/index', {
        error: 'Emergencia no encontrada',
        emergencias: [],
        mensaje: null
      });
    }
    
    console.log('Emergencia encontrada:', {
      id: emergencia._id,
      estado: emergencia.estado,
      tipoEmergencia: emergencia.tipoEmergencia,
      usuario: emergencia.usuario?.username
    });
    
    res.render('emergencias/detalle', {
      emergencia,
      adminToken: res.locals.adminToken,
      error: null
    });
  } catch (error) {
    console.error('Error al cargar detalle de emergencia:', error);
    console.error('Stack:', error.stack);
    res.render('emergencias/index', {
      error: 'Error al cargar detalle de emergencia: ' + error.message,
      emergencias: [],
      mensaje: null
    });
  }
});

// Rutas para gestión de validación de prestadores
router.get('/validaciones', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:${process.env.PORT || 3000}/api/validacion/admin/todas?limit=100`, {
      headers: { Authorization: `Bearer ${res.locals.adminToken}` }
    });
    
    // La API devuelve { prestadores: [...], pagination: {...} }
    const validaciones = response.data.prestadores || [];
    
    res.render('validaciones/index', { 
      validaciones: validaciones,
      mensaje: req.query.mensaje || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Error al cargar validaciones:', error);
    res.render('validaciones/index', { 
      error: 'Error al cargar validaciones pendientes', 
      validaciones: [],
      mensaje: null
    });
  }
});

// Detalle de validación específica
router.get('/validaciones/:id', isAuthenticated, async (req, res) => {
  try {
    // El parámetro :id es el prestadorId
    const response = await axios.get(`http://localhost:${process.env.PORT || 3000}/api/validacion/admin/detalle/${req.params.id}`, {
      headers: { Authorization: `Bearer ${res.locals.adminToken}` }
    });
    
    res.render('validaciones/detalle', { 
      validacion: response.data.validacion,
      progreso: response.data.progreso,
      documentosRequeridos: response.data.documentosRequeridos,
      error: req.query.error || null,
      mensaje: req.query.mensaje || null
    });
  } catch (error) {
    console.error('Error al cargar detalle de validación:', error);
    res.redirect('/admin/validaciones');
  }
});

// Revisar documento específico
router.post('/validaciones/:id/revisar-documento', isAuthenticated, async (req, res) => {
  try {
    const { tipoDocumento, estado, observaciones } = req.body;
    
    await axios.put(`http://localhost:${process.env.PORT || 3000}/api/validacion/admin/revisar-documento/${req.params.id}`, {
      tipoDocumento,
      estado,
      observaciones
    }, {
      headers: { Authorization: `Bearer ${res.locals.adminToken}` }
    });
    
    res.redirect(`/admin/validaciones/${req.params.id}?mensaje=Documento revisado correctamente`);
  } catch (error) {
    console.error('Error al revisar documento:', error);
    res.redirect(`/admin/validaciones/${req.params.id}?error=Error al revisar documento`);
  }
});

// Decisión final sobre la validación
router.post('/validaciones/:id/decision', isAuthenticated, async (req, res) => {
  try {
    const { decision, observaciones } = req.body;
    
    await axios.put(`http://localhost:${process.env.PORT || 3000}/api/validacion/admin/decision-final/${req.params.id}`, {
      decision,
      observaciones
    }, {
      headers: { Authorization: `Bearer ${res.locals.adminToken}` }
    });
    
    const mensaje = decision === 'aprobado' ? 'Prestador aprobado correctamente' : 
                   decision === 'rechazado' ? 'Prestador rechazado' : 
                   'Correcciones solicitadas';
    
    res.redirect(`/admin/validaciones?mensaje=${encodeURIComponent(mensaje)}`);
  } catch (error) {
    console.error('Error al tomar decisión:', error);
    res.redirect(`/admin/validaciones/${req.params.id}?error=Error al procesar decisión`);
  }
});

// =====================================================================
// MÓDULO PUBLICIDAD - Anunciantes, Campañas de Banners y Suscripciones
// =====================================================================

// Dashboard del módulo: listado de suscripciones con datos cruzados
router.get('/publicidad', isAuthenticated, async (req, res) => {
  try {
    const [suscripciones, anunciantes, campanas] = await Promise.all([
      Suscripcion.find()
        .populate('anunciante', 'nombre apellido nombreNegocio telefono email')
        .populate('campana', 'titulo limiteBanners banners')
        .sort({ createdAt: -1 })
        .lean(),
      Anunciante.find().lean(),
      CampanaBanner.find().lean(),
    ]);

    const hoy = new Date();
    const estadisticas = {
      totalAnunciantes: anunciantes.length,
      totalCampanas: campanas.length,
      totalSuscripciones: suscripciones.length,
      suscripcionesActivas: suscripciones.filter(
        (s) =>
          s.estado === 'activa' &&
          new Date(s.fechaInicio) <= hoy &&
          new Date(s.fechaFin) >= hoy
      ).length,
      ingresoMensual: suscripciones
        .filter(
          (s) =>
            s.estado === 'activa' &&
            new Date(s.fechaInicio) <= hoy &&
            new Date(s.fechaFin) >= hoy
        )
        .reduce((sum, s) => sum + (s.cuotaMensual || 0), 0),
    };

    res.render('publicidad/index', {
      suscripciones,
      estadisticas,
      adminToken: res.locals.adminToken,
      mensaje: req.query.mensaje || null,
      error: req.query.error || null,
    });
  } catch (error) {
    console.error('Error al cargar módulo publicidad:', error);
    res.render('publicidad/index', {
      suscripciones: [],
      estadisticas: { totalAnunciantes: 0, totalCampanas: 0, totalSuscripciones: 0, suscripcionesActivas: 0, ingresoMensual: 0 },
      mensaje: null,
      error: 'Error al cargar datos de publicidad: ' + error.message,
    });
  }
});

// Formulario para crear nueva suscripción + campaña con banners
router.get('/publicidad/nueva', isAuthenticated, async (req, res) => {
  try {
    const anunciantes = await Anunciante.find({ activo: true }).sort({ nombreNegocio: 1 }).lean();
    res.render('publicidad/form', {
      anunciantes,
      suscripcion: null,
      error: req.query.error || null,
    });
  } catch (error) {
    res.redirect('/admin/publicidad?error=' + encodeURIComponent(error.message));
  }
});

// Crear suscripción (con posibilidad de crear anunciante y campaña en el mismo flujo)
router.post(
  '/publicidad/nueva',
  isAuthenticated,
  uploadMem.array('imagenes', 10),
  async (req, res) => {
    try {
      const {
        anuncianteId,
        nombre,
        apellido,
        telefono,
        nombreNegocio,
        email,
        titulo,
        descripcion,
        limiteBanners,
        enlace,
        cuotaMensual,
        fechaInicio,
        fechaFin,
        estado,
        notas,
      } = req.body;

      // 1. Resolver anunciante (existente o nuevo)
      let anunciante;
      if (anuncianteId && anuncianteId !== '__nuevo__') {
        anunciante = await Anunciante.findById(anuncianteId);
        if (!anunciante) throw new Error('Anunciante no encontrado');
      } else {
        if (!nombre || !apellido || !telefono || !nombreNegocio) {
          throw new Error('Faltan datos del anunciante');
        }
        anunciante = await Anunciante.create({
          nombre,
          apellido,
          telefono,
          nombreNegocio,
          email: email || '',
        });
      }

      // 2. Crear la campaña con banners (si hay imágenes)
      const banners = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const up = await uploadBufferToCloudinary(file.buffer);
          banners.push({
            urlImagen: up.secure_url,
            publicId: up.public_id,
            enlace: enlace || '',
            activo: true,
          });
        }
      }

      const campana = await CampanaBanner.create({
        anunciante: anunciante._id,
        titulo: titulo || '',
        descripcion: descripcion || '',
        limiteBanners: Number(limiteBanners) || Math.max(banners.length, 1),
        banners,
      });

      // 3. Crear la suscripción
      if (!cuotaMensual || !fechaInicio || !fechaFin) {
        throw new Error('Faltan datos de la suscripción');
      }

      await Suscripcion.create({
        anunciante: anunciante._id,
        campana: campana._id,
        cuotaMensual: Number(cuotaMensual),
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        estado: estado || 'activa',
        notas: notas || '',
      });

      res.redirect('/admin/publicidad?mensaje=' + encodeURIComponent('Suscripción creada correctamente'));
    } catch (error) {
      console.error('Error al crear publicidad:', error);
      res.redirect('/admin/publicidad/nueva?error=' + encodeURIComponent(error.message));
    }
  }
);

// Ver detalle de una suscripción + su campaña
router.get('/publicidad/:id', isAuthenticated, async (req, res) => {
  try {
    const suscripcion = await Suscripcion.findById(req.params.id)
      .populate('anunciante')
      .populate('campana')
      .lean();

    if (!suscripcion) return res.redirect('/admin/publicidad?error=Suscripci%C3%B3n no encontrada');

    res.render('publicidad/detalle', {
      suscripcion,
      mensaje: req.query.mensaje || null,
      error: req.query.error || null,
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/publicidad?error=' + encodeURIComponent(error.message));
  }
});

// Formulario de edición
router.get('/publicidad/:id/editar', isAuthenticated, async (req, res) => {
  try {
    const suscripcion = await Suscripcion.findById(req.params.id)
      .populate('anunciante')
      .populate('campana')
      .lean();
    if (!suscripcion) return res.redirect('/admin/publicidad');

    const anunciantes = await Anunciante.find().sort({ nombreNegocio: 1 }).lean();
    res.render('publicidad/form', {
      suscripcion,
      anunciantes,
      error: req.query.error || null,
    });
  } catch (error) {
    res.redirect('/admin/publicidad?error=' + encodeURIComponent(error.message));
  }
});

// Actualizar suscripción + campaña (y subir nuevos banners opcionales)
router.post(
  '/publicidad/:id/editar',
  isAuthenticated,
  uploadMem.array('imagenes', 10),
  async (req, res) => {
    try {
      const suscripcion = await Suscripcion.findById(req.params.id);
      if (!suscripcion) throw new Error('Suscripción no encontrada');

      const {
        titulo,
        descripcion,
        limiteBanners,
        enlace,
        cuotaMensual,
        fechaInicio,
        fechaFin,
        estado,
        notas,
      } = req.body;

      // Actualizar suscripción
      if (cuotaMensual !== undefined) suscripcion.cuotaMensual = Number(cuotaMensual);
      if (fechaInicio) suscripcion.fechaInicio = new Date(fechaInicio);
      if (fechaFin) suscripcion.fechaFin = new Date(fechaFin);
      if (estado) suscripcion.estado = estado;
      if (notas !== undefined) suscripcion.notas = notas;
      await suscripcion.save();

      // Actualizar campaña asociada
      if (suscripcion.campana) {
        const campana = await CampanaBanner.findById(suscripcion.campana);
        if (campana) {
          if (titulo !== undefined) campana.titulo = titulo;
          if (descripcion !== undefined) campana.descripcion = descripcion;
          if (limiteBanners !== undefined) campana.limiteBanners = Number(limiteBanners);

          if (req.files && req.files.length > 0) {
            for (const file of req.files) {
              const up = await uploadBufferToCloudinary(file.buffer);
              campana.banners.push({
                urlImagen: up.secure_url,
                publicId: up.public_id,
                enlace: enlace || '',
                activo: true,
              });
            }
          }
          await campana.save();
        }
      }

      res.redirect('/admin/publicidad/' + req.params.id + '?mensaje=' + encodeURIComponent('Actualizado correctamente'));
    } catch (error) {
      console.error(error);
      res.redirect('/admin/publicidad/' + req.params.id + '/editar?error=' + encodeURIComponent(error.message));
    }
  }
);

// Eliminar banner individual
router.post('/publicidad/:id/banner/:bannerId/eliminar', isAuthenticated, async (req, res) => {
  try {
    const suscripcion = await Suscripcion.findById(req.params.id);
    if (!suscripcion || !suscripcion.campana) throw new Error('No encontrada');

    const campana = await CampanaBanner.findById(suscripcion.campana);
    if (!campana) throw new Error('Campaña no encontrada');

    const banner = campana.banners.id(req.params.bannerId);
    if (banner) {
      if (banner.publicId) {
        try {
          await cloudinary.uploader.destroy(banner.publicId);
        } catch (err) {
          console.warn('Cloudinary delete error:', err.message);
        }
      }
      banner.deleteOne();
      await campana.save();
    }

    res.redirect('/admin/publicidad/' + req.params.id + '?mensaje=' + encodeURIComponent('Banner eliminado'));
  } catch (error) {
    res.redirect('/admin/publicidad/' + req.params.id + '?error=' + encodeURIComponent(error.message));
  }
});

// Eliminar suscripción completa (incluye campaña y sus imágenes)
router.post('/publicidad/:id/eliminar', isAuthenticated, async (req, res) => {
  try {
    const suscripcion = await Suscripcion.findById(req.params.id);
    if (!suscripcion) throw new Error('No encontrada');

    if (suscripcion.campana) {
      const campana = await CampanaBanner.findById(suscripcion.campana);
      if (campana) {
        for (const b of campana.banners || []) {
          if (b.publicId) {
            try {
              await cloudinary.uploader.destroy(b.publicId);
            } catch (err) {
              console.warn('Cloudinary delete error:', err.message);
            }
          }
        }
        await campana.deleteOne();
      }
    }

    await suscripcion.deleteOne();
    res.redirect('/admin/publicidad?mensaje=' + encodeURIComponent('Suscripción eliminada'));
  } catch (error) {
    console.error(error);
    res.redirect('/admin/publicidad?error=' + encodeURIComponent(error.message));
  }
});

export default router;
