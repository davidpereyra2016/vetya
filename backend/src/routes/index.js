import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import mascotaRoutes from "./mascotaRoutes.js";
import citaRoutes from "./citaRoutes.js";
import servicioRoutes from "./servicioRoutes.js";
import emergenciaRoutes from "./emergenciaRoutes.js";
import valoracionRoutes from "./valoracionRoutes.js";
import consejoDeSaludRoutes from "./consejoDeSaludRoutes.js";
import notificacionRoutes from "./notificacionRoutes.js";
import pagoRoutes from "./pagoRoutes.js";
import prestadorRoutes from "./prestadorRoutes.js";
import catalogoRoutes from "./catalogoRoutes.js";
import disponibilidadRoutes from "./disponibilidadRoutes.js";
import clientRoutes from "./clientRoutes.js"; // Importar las nuevas rutas de clientes
import countPacientesRoutes from "./countPacientes.js"; // Importar rutas para conteo de pacientes
import validacionRoutes from "./validacionRoutes.js"; // Importar rutas para validación de prestadores

const router = express.Router();

// Configuración de todas las rutas de la API
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
// Eliminada ruta /veterinarios - Ahora se usa /prestadores para acceder a todos los veterinarios
router.use("/mascotas", mascotaRoutes);
router.use("/citas", citaRoutes);
router.use("/servicios", servicioRoutes);
router.use("/emergencias", emergenciaRoutes);
router.use("/valoraciones", valoracionRoutes);
router.use("/consejos-salud", consejoDeSaludRoutes);
router.use("/notificaciones", notificacionRoutes);
router.use("/pagos", pagoRoutes);
router.use("/prestadores", prestadorRoutes);
router.use("/clients", clientRoutes); // Añadir ruta para clientes
router.use("/catalogo", catalogoRoutes);
router.use("/disponibilidad", disponibilidadRoutes);
router.use("/pacientes", countPacientesRoutes); // Añadir ruta para conteo de pacientes
router.use("/validacion", validacionRoutes); // Añadir rutas para validación de prestadores

// Ruta para verificar si la API está funcionando
router.get("/", (req, res) => {
  res.json({ message: "API de Vetya funcionando correctamente" });
});

export default router;
