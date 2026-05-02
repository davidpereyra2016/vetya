import express from "express";
import User from "../models/User.js";
import Prestador from "../models/Prestador.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService.js";
import { authLimiter, authRecoveryLimiter, normalizeEmail } from "../utils/routePerformance.js";
const router = express.Router();

/**
 * Genera un token JWT para un usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Token JWT
 */
const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"});
};

const normalizeUsername = (username = "") => username.trim().replace(/\s+/g, " ");
const findUserByEmail = (email) => {
    const normalizedEmail = normalizeEmail(email);
    return User.findOne({ email: normalizedEmail })
        .collation({ locale: "en", strength: 2 });
};
const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createUniqueClientUsername = async (username) => {
    const normalizedUsername = normalizeUsername(username);
    const existingUser = await User.findOne({ username: normalizedUsername }).select("_id").lean();

    if (!existingUser) return normalizedUsername;

    const similarUsernames = await User.find({
        username: new RegExp(`^${escapeRegExp(normalizedUsername)}( [0-9]{4})?$`, "i")
    }).select("username").lean();
    const usedUsernames = new Set(similarUsernames.map(user => user.username.toLowerCase()));

    for (let index = 1; index <= 9999; index += 1) {
        const candidate = `${normalizedUsername} ${String(index).padStart(4, "0")}`;
        if (!usedUsernames.has(candidate.toLowerCase())) return candidate;
    }

    return `${normalizedUsername} ${Date.now()}`;
};

const createPendingVerificationResponse = async (res, user, displayName) => {
    const verificationCode = generateVerificationCode();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.emailVerified = false;
    await user.save();

    const emailResult = await sendVerificationEmail(user.email, verificationCode, displayName || user.username);
    if (!emailResult.success) {
        console.error('Error al enviar email de verificacion:', emailResult.error);
    }

    return res.status(200).json({
        message: emailResult.success
            ? "Ya tenias un registro pendiente. Te enviamos un nuevo codigo de verificacion a tu correo."
            : "Ya tenias un registro pendiente, pero no pudimos enviar el codigo. Intenta reenviarlo desde la siguiente pantalla.",
        requiresVerification: true,
        email: user.email,
        emailSent: emailResult.success
    });
};

/**
 * Ruta para registrar clientes
 * Solo crea usuarios con role="client"
 */
router.post("/register/client", authLimiter, async (req, res) => {
    try {
        const {password, confirmPassword} = req.body;
        const email = normalizeEmail(req.body.email);
        const username = normalizeUsername(req.body.username);
        
        // Validaciones básicas
        if(!email || !username || !password || !confirmPassword){
            return res.status(400).json({message: "Todos los campos son obligatorios"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "La contraseña debe tener al menos 6 caracteres"});
        }
        if(password !== confirmPassword){
            return res.status(400).json({message: "Las contraseñas no coinciden"});
        }
        if(username.length < 3){
            return res.status(400).json({message: "El nombre de usuario debe tener al menos 3 caracteres"});
        }
        
        // Verificar email; el nombre visible puede repetirse entre clientes.
        const existingEmail = await findUserByEmail(email);
        if(existingEmail){
            if (existingEmail.role === "client" && !existingEmail.emailVerified) {
                return createPendingVerificationResponse(res, existingEmail, username);
            }

            if (existingEmail.role !== "client") {
                return res.status(409).json({
                    message: "Este correo ya esta registrado en otra aplicacion de VetYa.",
                    code: "EMAIL_REGISTERED_WITH_DIFFERENT_ROLE"
                });
            }

            return res.status(409).json({
                message: "Este correo ya esta registrado. Inicia sesion o usa 'Olvide mi contrasena'.",
                code: "EMAIL_ALREADY_REGISTERED",
                canRecoverPassword: true,
                email: existingEmail.email
            });
        }
        const uniqueUsername = await createUniqueClientUsername(username);
        
        // Crear foto de perfil aleatoria
        const profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueUsername}`;
        
        // Crear usuario con role=client
        const newUser = new User({
            email, 
            username: uniqueUsername,
            password, 
            profilePicture,
            role: 'client' // Asignar rol de cliente
        });
        
        // Generar código de verificación
        const verificationCode = generateVerificationCode();
        newUser.emailVerificationCode = verificationCode;
        newUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        newUser.emailVerified = false;
        
        await newUser.save();
        
        // Enviar código por email
        const emailResult = await sendVerificationEmail(email, verificationCode, username);
        if (!emailResult.success) {
            console.error('Error al enviar email de verificación:', emailResult.error);
        }
        
        res.status(201).json({
            message: emailResult.success
                ? "Registro exitoso. Se ha enviado un código de verificación a tu correo."
                : "Registro exitoso, pero no pudimos enviar el código de verificación. Intenta reenviarlo desde la siguiente pantalla.",
            requiresVerification: true,
            email: newUser.email,
            emailSent: emailResult.success
        });
    } catch (error) {
        console.error("Error en registro de cliente:", error);
        res.status(500).json({message: "Error al registrar el usuario"});
    }
});

/**
 * Ruta para registrar prestadores de servicios
 * Crea usuario con role="provider" y su documento asociado en la colección Prestador
 */
router.post("/register/provider", authLimiter, async (req, res) => {
    try {
        const {
            password, 
            confirmPassword, 
            nombre,
            especialidad,
            telefono
        } = req.body;
        const email = normalizeEmail(req.body.email);
        const username = normalizeUsername(req.body.username);
        const normalizedNombre = normalizeUsername(nombre);
        
        // Validaciones básicas
        if(!email || !username || !password || !confirmPassword || !nombre || !especialidad){
            return res.status(400).json({message: "Todos los campos son obligatorios"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "La contraseña debe tener al menos 6 caracteres"});
        }
        if(password !== confirmPassword){
            return res.status(400).json({message: "Las contraseñas no coinciden"});
        }
        if(username.length < 3){
            return res.status(400).json({message: "El nombre de usuario debe tener al menos 3 caracteres"});
        }
        
        // Verificar email y username únicos
        const existingEmail = await findUserByEmail(email);
        if(existingEmail){
            return res.status(400).json({message: "El correo ya está registrado"});
        }
        const existingUsername = await User.findOne({ username }).select("_id").lean();
        if(existingUsername){
            return res.status(400).json({message: "El nombre de usuario ya está registrado"});
        }
        
        // Crear foto de perfil aleatoria
        const profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        
        // Crear usuario con role=provider
        const newUser = new User({
            email, 
            username, 
            password, 
            profilePicture,
            role: 'provider' // Asignar rol de prestador
        });
        
        await newUser.save();
        
        // Crear prestador asociado
        const newPrestador = new Prestador({
            usuario: newUser._id,
            nombre: normalizedNombre,
            especialidad,
            telefono,
            email,
            disponibleEmergencias: false, // Por defecto no disponible para emergencias
            activo: true
        });
        
        await newPrestador.save();
        
        // Generar código de verificación
        const verificationCode = generateVerificationCode();
        newUser.emailVerificationCode = verificationCode;
        newUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        newUser.emailVerified = false;
        await newUser.save();
        
        // Enviar código por email
        const emailResult = await sendVerificationEmail(email, verificationCode, normalizedNombre);
        if (!emailResult.success) {
            console.error('Error al enviar email de verificación:', emailResult.error);
        }
        
        res.status(201).json({
            message: emailResult.success
                ? "Registro exitoso. Se ha enviado un código de verificación a tu correo."
                : "Registro exitoso, pero no pudimos enviar el código de verificación. Intenta reenviarlo desde la siguiente pantalla.",
            requiresVerification: true,
            email: newUser.email,
            emailSent: emailResult.success
        });
    } catch (error) {
        console.error("Error en registro de prestador:", error);
        res.status(500).json({message: "Error al registrar el prestador"});
    }
});

/**
 * Mantener la ruta original para compatibilidad, pero registrando como cliente
 */
router.post("/register", authLimiter, async (req, res) => {
    try {
        const {password, confirmPassword} = req.body;
        const email = normalizeEmail(req.body.email);
        const username = normalizeUsername(req.body.username);
        
        // Validaciones básicas
        if(!email || !username || !password || !confirmPassword){
            return res.status(400).json({message: "Todos los campos son obligatorios"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "La contraseña debe tener al menos 6 caracteres"});
        }
        if(password !== confirmPassword){
            return res.status(400).json({message: "Las contraseñas no coinciden"});
        }
        if(username.length < 3){
            return res.status(400).json({message: "El nombre de usuario debe tener al menos 3 caracteres"});
        }
        
        // Verificar email y username únicos
        const existingEmail = await findUserByEmail(email);
        if(existingEmail){
            return res.status(400).json({message: "El correo ya está registrado"});
        }
        const existingUsername = await User.findOne({ username }).select("_id").lean();
        if(existingUsername){
            return res.status(400).json({message: "El nombre de usuario ya está registrado"});
        }
        
        // Crear foto de perfil aleatoria
        const profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        
        // Crear usuario con role=client por defecto
        const newUser = new User({
            email, 
            username, 
            password, 
            profilePicture,
            role: 'client' // Por defecto, es un cliente
        });
        
        // Generar código de verificación
        const verificationCode = generateVerificationCode();
        newUser.emailVerificationCode = verificationCode;
        newUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        newUser.emailVerified = false;
        
        await newUser.save();
        
        // Enviar código por email
        const emailResult = await sendVerificationEmail(email, verificationCode, username);
        if (!emailResult.success) {
            console.error('Error al enviar email de verificación:', emailResult.error);
        }
        
        res.status(201).json({
            message: emailResult.success
                ? "Registro exitoso. Se ha enviado un código de verificación a tu correo."
                : "Registro exitoso, pero no pudimos enviar el código de verificación. Intenta reenviarlo desde la siguiente pantalla.",
            requiresVerification: true,
            email: newUser.email,
            emailSent: emailResult.success
        });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({message: "Error al registrar el usuario"});
    }
});

/**
 * Ruta de login compartida que verifica el tipo de aplicación
 * y asegura que solo los usuarios del rol correcto puedan iniciar sesión
 */
router.post("/login", authLimiter, async (req, res) => {
    try {
        const {password, appType} = req.body;
        const email = normalizeEmail(req.body.email);
        
        // Validar campos obligatorios
        if(!email || !password){
            return res.status(400).json({message: "Email y contraseña son obligatorios"});
        }
        
        // Añadir validación de appType - solo es necesario para aplicaciones cliente y proveedor
        // Para el panel admin no se requiere appType
        if(appType && !['client', 'provider', 'admin'].includes(appType)){
            return res.status(400).json({message: "Tipo de aplicación inválido"});
        }
        
        // Buscar usuario por email
        const user = await findUserByEmail(email);
        if(!user){
            return res.status(400).json({message: "Credenciales inválidas"});
        }
        
        // Verificar contraseña
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message: "Credenciales inválidas"});
        }
        
        // Verificar que el email esté verificado
        if (!user.emailVerified) {
            return res.status(403).json({
                message: "Debes verificar tu correo electrónico antes de iniciar sesión.",
                requiresVerification: true,
                email: user.email
            });
        }
        
        // Verificar que el rol del usuario coincida con el tipo de aplicación
        // Esta es la clave para prevenir acceso no autorizado entre apps
        // Pero permitimos acceso a administradores desde el panel admin
        if (appType && 
            ((appType === 'client' && user.role !== 'client') || 
             (appType === 'provider' && user.role !== 'provider') ||
             (appType === 'admin' && user.role !== 'admin'))) {
            return res.status(403).json({
                message: `No tiene permiso para acceder como ${appType === 'client' ? 'cliente' : (appType === 'provider' ? 'prestador' : 'administrador')}`
            });
        }
        
        // Si todo está correcto, generar token
        const token = generateToken(user._id);
        
        // Datos básicos de usuario para la respuesta
        const userData = {
            id: user._id, 
            email: user.email, 
            username: user.username, 
            profilePicture: user.profilePicture,
            role: user.role
        };
        
        // Si es un prestador, obtener datos adicionales
        if (user.role === 'provider') {
            const prestador = await Prestador.findOne({ usuario: user._id })
                .select("_id nombre especialidad especialidades disponibleEmergencias")
                .lean();
            if (prestador) {
                return res.status(200).json({
                    token, 
                    user: userData,
                    prestador: {
                        id: prestador._id,
                        nombre: prestador.nombre,
                        especialidad: prestador.especialidad,
                        disponibleEmergencias: prestador.disponibleEmergencias
                    }
                });
            }
        }
        
        // Respuesta para clientes o si no se encuentra el prestador
        res.status(200).json({ token, user: userData });
        
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({message: "Error al iniciar sesión"});
    }
});

/**
 * Ruta para solicitar recuperación de contraseña
 * Genera un token de recuperación y envía email
 */
router.post("/forgot-password", authRecoveryLimiter, async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        
        if (!email) {
            return res.status(400).json({ message: "El correo electrónico es obligatorio" });
        }
        
        const user = await findUserByEmail(email);
        if (!user) {
            // Por seguridad, no revelar si el email existe o no
            return res.status(200).json({ 
                message: "Si el correo existe en nuestro sistema, recibirás un código de recuperación" 
            });
        }
        
        // Generar código de 6 dígitos
        const resetCode = generateVerificationCode();
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        await user.save();
        
        // Enviar código por email
        const emailResult = await sendPasswordResetEmail(email, resetCode, user.username);
        if (!emailResult.success) {
            console.error('Error al enviar email de recuperación:', emailResult.error);
        }
        
        res.status(200).json({
            message: emailResult.success
                ? "Se ha enviado un código de recuperación a tu correo electrónico"
                : "No pudimos enviar el código de recuperación en este momento. Inténtalo nuevamente en unos minutos.",
            emailSent: emailResult.success
        });
        
    } catch (error) {
        console.error("Error en forgot-password:", error);
        res.status(500).json({ message: "Error al procesar la solicitud" });
    }
});

/**
 * Ruta para restablecer contraseña con token
 */
router.post("/reset-password", authRecoveryLimiter, async (req, res) => {
    try {
        const { code, newPassword } = req.body;
        const email = normalizeEmail(req.body.email);
        
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: "Email, código y nueva contraseña son obligatorios" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
        }
        
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: "Usuario no encontrado" });
        }
        
        // Verificar que el código coincida
        if (!user.resetPasswordToken || user.resetPasswordToken !== code) {
            return res.status(400).json({ message: "Código de recuperación incorrecto" });
        }
        
        // Verificar que el código no haya expirado
        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: "El código ha expirado. Solicita uno nuevo." });
        }
        
        // Actualizar contraseña
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        console.log(`Contraseña actualizada para usuario: ${user.email}`);
        
        res.status(200).json({ 
            message: "Contraseña actualizada exitosamente" 
        });
        
    } catch (error) {
        console.error("Error en reset-password:", error);
        res.status(500).json({ message: "Error al restablecer la contraseña" });
    }
});

/**
 * Ruta para verificar el código de email
 */
router.post("/verify-email", authRecoveryLimiter, async (req, res) => {
    try {
        const { code } = req.body;
        const email = normalizeEmail(req.body.email);
        
        if (!email || !code) {
            return res.status(400).json({ message: "Email y código son obligatorios" });
        }
        
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        if (user.emailVerified) {
            return res.status(400).json({ message: "El email ya está verificado" });
        }
        
        // Verificar que el código no haya expirado
        if (!user.emailVerificationCode || !user.emailVerificationExpires) {
            return res.status(400).json({ message: "No hay un código de verificación pendiente. Solicita uno nuevo." });
        }
        
        if (user.emailVerificationExpires < new Date()) {
            return res.status(400).json({ message: "El código ha expirado. Solicita uno nuevo." });
        }
        
        // Verificar el código
        if (user.emailVerificationCode !== code) {
            return res.status(400).json({ message: "Código de verificación incorrecto" });
        }
        
        // Marcar email como verificado
        user.emailVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        
        // Generar token y responder con login automático
        const token = generateToken(user._id);
        
        const userData = {
            id: user._id,
            email: user.email,
            username: user.username,
            profilePicture: user.profilePicture,
            role: user.role,
            emailVerified: true
        };
        
        // Si es prestador, incluir datos del prestador
        if (user.role === 'provider') {
            const prestador = await Prestador.findOne({ usuario: user._id })
                .select("_id nombre especialidad especialidades")
                .lean();
            if (prestador) {
                return res.status(200).json({
                    message: "Email verificado exitosamente",
                    token,
                    user: userData,
                    prestador: {
                        id: prestador._id,
                        nombre: prestador.nombre,
                        especialidad: prestador.especialidad
                    }
                });
            }
        }
        
        res.status(200).json({
            message: "Email verificado exitosamente",
            token,
            user: userData
        });
        
    } catch (error) {
        console.error("Error en verify-email:", error);
        res.status(500).json({ message: "Error al verificar el email" });
    }
});

/**
 * Ruta para reenviar código de verificación
 */
router.post("/resend-verification", authRecoveryLimiter, async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        
        if (!email) {
            return res.status(400).json({ message: "El email es obligatorio" });
        }
        
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        if (user.emailVerified) {
            return res.status(400).json({ message: "El email ya está verificado" });
        }
        
        // Generar nuevo código
        const verificationCode = generateVerificationCode();
        user.emailVerificationCode = verificationCode;
        user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        await user.save();
        
        // Enviar código
        const emailResult = await sendVerificationEmail(email, verificationCode, user.username);
        
        res.status(200).json({ 
            message: emailResult.success
                ? "Se ha reenviado el código de verificación a tu correo"
                : "No pudimos reenviar el código de verificación en este momento. Inténtalo nuevamente en unos minutos.",
            emailSent: emailResult.success
        });
        
    } catch (error) {
        console.error("Error en resend-verification:", error);
        res.status(500).json({ message: "Error al reenviar el código" });
    }
});

export default router;
