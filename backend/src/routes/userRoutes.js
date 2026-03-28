import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads/';
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

const router = express.Router();

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = decoded; // Aquí decoded contiene la información del usuario (el ID)
        next();
    });
};

// Obtener todos los usuarios (para panel admin) - Filtrar solo clientes
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('=== OBTENIENDO USUARIOS ===');
        
        // Filtro para obtener solo usuarios de tipo 'client'
        const filtro = { role: 'client' };
        
        // Si se proporciona un filtro de rol específico en query params
        if (req.query.role) {
            filtro.role = req.query.role;
        }
        
        console.log('Filtro aplicado:', filtro);
        
        const usuarios = await User.find(filtro)
            .select('-password') // Excluir contraseña
            .sort({ createdAt: -1 }); // Más recientes primero
        
        console.log(`Total de usuarios encontrados: ${usuarios.length}`);
        
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
});

// Obtener perfil del usuario - DEBE IR ANTES de /:id para evitar conflictos
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Asegúrate de que estamos usando correctamente el ID del token decodificado
        console.log('Token decodificado:', req.user);
        const userId = req.user.userId; // El token contiene { userId } no { id }
        console.log('ID de usuario desde token:', userId);
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Obtener direcciones del usuario (basadas en emergencias pasadas) - DEBE IR ANTES de /:id
router.get('/addresses', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Importar modelo de Emergencia
        const Emergencia = (await import('../models/Emergencia.js')).default;
        
        // Obtener emergencias del usuario con ubicación
        const emergencias = await Emergencia.find({ 
            usuario: userId,
            'ubicacion.coordenadas.lat': { $exists: true, $ne: null }
        })
        .select('ubicacion fechaSolicitud estado')
        .sort({ fechaSolicitud: -1 })
        .limit(10);
        
        // Extraer direcciones únicas
        const direccionesMap = new Map();
        
        emergencias.forEach(emergencia => {
            if (emergencia.ubicacion && emergencia.ubicacion.coordenadas) {
                // Crear una clave única basada en coordenadas (redondeadas para agrupar ubicaciones cercanas)
                const lat = Math.round(emergencia.ubicacion.coordenadas.lat * 1000) / 1000;
                const lng = Math.round(emergencia.ubicacion.coordenadas.lng * 1000) / 1000;
                const key = `${lat},${lng}`;
                
                if (!direccionesMap.has(key)) {
                    direccionesMap.set(key, {
                        _id: emergencia._id,
                        direccion: emergencia.ubicacion.direccion,
                        ciudad: emergencia.ubicacion.ciudad,
                        coordenadas: {
                            lat: emergencia.ubicacion.coordenadas.lat,
                            lng: emergencia.ubicacion.coordenadas.lng
                        },
                        ultimoUso: emergencia.fechaSolicitud,
                        tipo: 'emergencia'
                    });
                }
            }
        });
        
        // Convertir Map a array
        const direcciones = Array.from(direccionesMap.values());
        
        // Obtener también la ubicación actual del usuario si existe
        const user = await User.findById(userId).select('ubicacionActual');
        
        let ubicacionActual = null;
        if (user?.ubicacionActual?.coordinates?.lat && user?.ubicacionActual?.coordinates?.lng) {
            ubicacionActual = {
                lat: user.ubicacionActual.coordinates.lat,
                lng: user.ubicacionActual.coordinates.lng,
                lastUpdated: user.ubicacionActual.lastUpdated
            };
        }
        
        res.json({
            direcciones,
            ubicacionActual,
            total: direcciones.length
        });
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        res.status(500).json({ message: 'Error al obtener direcciones', error: error.message });
    }
});

// Actualizar ubicación actual del usuario - DEBE IR ANTES de /:id
router.put('/location', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { lat, lng } = req.body;
        
        if (lat === undefined || lat === null || lng === undefined || lng === null) {
            return res.status(400).json({ message: 'Latitud y longitud son requeridas' });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                ubicacionActual: {
                    coordinates: { lat, lng },
                    lastUpdated: new Date()
                }
            },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json({
            message: 'Ubicación actualizada',
            ubicacionActual: updatedUser.ubicacionActual
        });
    } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        res.status(500).json({ message: 'Error al actualizar ubicación' });
    }
});

// Obtener usuario por ID (para panel admin)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        console.log('=== OBTENIENDO USUARIO POR ID ===');
        console.log('ID solicitado:', req.params.id);
        
        const usuario = await User.findById(req.params.id).select('-password');
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json(usuario);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
});

// Actualizar información de perfil
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        // Extraer solo los campos que son enviados para actualizar
        const updateData = {};
        
        if (req.body.username) updateData.username = req.body.username;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.profilePicture) updateData.profilePicture = req.body.profilePicture;
        
        console.log('Datos a actualizar:', updateData);
        const userId = req.user.userId; // El token contiene { userId } no { id }
        console.log('ID de usuario a actualizar:', userId);
        
        // Verificar si estamos actualizando el email y si ya está en uso
        if (updateData.email) {
            const existingEmail = await User.findOne({ 
                email: updateData.email, 
                _id: { $ne: userId } 
            });
            
            if (existingEmail) {
                return res.status(400).json({ message: 'El correo ya está registrado' });
            }
        }
        
        // Verificar si estamos actualizando el username y si ya está en uso
        if (updateData.username) {
            const existingUsername = await User.findOne({ 
                username: updateData.username, 
                _id: { $ne: userId } 
            });
            
            if (existingUsername) {
                return res.status(400).json({ message: 'El nombre de usuario ya está registrado' });
            }
        }
        
        // Actualizar solo los campos que se enviaron en la solicitud
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        console.log('Usuario actualizado correctamente:', updatedUser);
        res.json(updatedUser);
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Cambiar contraseña
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validar la nueva contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }
        
        const userId = req.user.userId; // El token contiene { userId } no { id }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Verificar la contraseña actual
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        }
        
        // Actualizar la contraseña
        user.password = newPassword;
        await user.save();
        
        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Registrar token de dispositivo para notificaciones push
router.post('/device-token', authenticateToken, async (req, res) => {
    try {
        const { deviceToken } = req.body;
        const userId = req.user.userId;
        
        if (!deviceToken) {
            return res.status(400).json({ message: 'Token de dispositivo requerido' });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { deviceToken },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        console.log(`📱 Token de dispositivo registrado para usuario ${userId}`);
        res.json({ 
            message: 'Token de dispositivo registrado correctamente',
            deviceToken: updatedUser.deviceToken 
        });
    } catch (error) {
        console.error('Error al registrar token de dispositivo:', error);
        res.status(500).json({ message: 'Error al registrar token de dispositivo' });
    }
});

// Eliminar token de dispositivo (logout)
router.delete('/device-token', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        await User.findByIdAndUpdate(userId, { deviceToken: null });
        
        console.log(`📱 Token de dispositivo eliminado para usuario ${userId}`);
        res.json({ message: 'Token de dispositivo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar token de dispositivo:', error);
        res.status(500).json({ message: 'Error al eliminar token de dispositivo' });
    }
});

// Subir imagen de perfil
router.post('/profile-picture', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
        }
        
        // Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'profile_pictures',
            transformation: [
                { width: 500, height: 500, crop: 'limit' }
            ]
        });
        
        // Actualizar la URL de la imagen en el usuario
        const userId = req.user.userId; // El token contiene { userId } no { id }
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: result.secure_url },
            { new: true }
        ).select('-password');
        
        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al subir la imagen' });
    }
});

export default router;
