import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { userWriteLimiter } from "../utils/routePerformance.js";

dotenv.config();

/**
 * Middleware de autenticacion JWT.
 * Usa proyeccion + lean para no hidratar documentos completos en cada request.
 */
const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "No se proporciono un token" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: "No se proporciono un token valido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select("_id email username role profilePicture emailVerified deviceToken ubicacionActual")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "Token invalido o usuario no encontrado" });
    }

    req.user = {
      ...user,
      id: user._id,
      userId: user._id,
    };
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return userWriteLimiter(req, res, next);
    }
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalido" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Sesion expirada, por favor inicie sesion nuevamente" });
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Error de autenticacion:", error.message);
    }
    return res.status(401).json({ message: "Por favor autentiquese" });
  }
};

/**
 * Middleware para verificar roles de usuario.
 */
const checkRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autorizado" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Acceso denegado: no tiene los permisos necesarios",
    });
  }

  return next();
};

export { protectRoute, checkRole };
export default protectRoute;
