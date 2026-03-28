import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

/**
 * Middleware para proteger rutas que requieren autenticación
 * Verifica el token JWT y añade los datos del usuario a req.user
 */
const protectRoute = async(req, res, next) => {
    try {
        console.log('=== MIDDLEWARE AUTH DEBUG ===');
        console.log('Headers:', req.headers);
        
        // Verificar si existe el encabezado Authorization
        const authHeader = req.header("Authorization");
        console.log('Auth header:', authHeader);
        
        if (!authHeader) {
            console.log('No auth header found');
            return res.status(401).json({message: "No se proporcionó un token"});
        }
        
        // Extraer el token
        const token = authHeader.startsWith("Bearer ") ? 
            authHeader.replace("Bearer ", "") : authHeader;
        
        console.log('Token extraído:', token ? 'Token presente' : 'Token vacío');
        console.log('Token length:', token?.length);
        
        if(!token){
            console.log('Token vacío después de extracción');
            return res.status(401).json({message: "No se proporcionó un token válido"});
        }
        
        // Verificar y decodificar el token
        console.log('Intentando verificar JWT...');
        console.log('JWT_SECRET disponible:', !!process.env.JWT_SECRET);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado exitosamente:', decoded);
        
        // Buscar al usuario en la base de datos
        console.log('Buscando usuario con ID:', decoded.userId);
        const user = await User.findById(decoded.userId).select("-password");
        
        if(!user){
            console.log('Usuario no encontrado en la base de datos');
            return res.status(401).json({message: "Token inválido o usuario no encontrado"});
        }
        
        console.log('Usuario encontrado:', user.email, 'Rol:', user.role);
        
        // Añadir datos del usuario a la solicitud
        req.user = user;
        console.log('Autenticación exitosa, continuando...');
        next();
    } catch (error) {
        console.error('Error de autenticación:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({message: "Token inválido"});
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({message: "Sesión expirada, por favor inicie sesión nuevamente"});
        }
        
        return res.status(401).json({message: "Por favor autentíquese"});
    }
};

/**
 * Middleware para verificar roles de usuario
 * Permite acceso solo a usuarios con los roles especificados
 * @param {Array} roles - Array de roles permitidos (ej: ['client', 'provider', 'admin'])
 * @returns {Function} Middleware
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        // Verificar que existe el usuario (deberia ser añadido por protectRoute)
        if (!req.user) {
            return res.status(401).json({message: "No autorizado"});
        }
        
        // Verificar si el rol del usuario está en la lista de roles permitidos
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Acceso denegado: no tiene los permisos necesarios"
            });
        }
        
        // Si el rol es permitido, continuar
        next();
    };
};

// Exportar middlewares
export { protectRoute, checkRole };
// Exportación predeterminada para compatibilidad con código existente
export default protectRoute;