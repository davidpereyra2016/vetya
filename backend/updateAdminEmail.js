import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuración del entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Importar el modelo User
import User from './src/models/User.js';

async function updateAdminEmail() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a MongoDB');

        // Buscar y actualizar el admin
        const admin = await User.findOneAndUpdate(
            { email: 'admin@vetya.com' },
            { 
                email: 'vetyaoficial@gmail.com',
                isEmailVerified: false, // Resetear verificación para forzar nuevo envío
                emailVerificationToken: null,
                emailVerificationExpires: null
            },
            { new: true }
        );

        if (admin) {
            console.log('✅ Email de admin actualizado exitosamente:');
            console.log('- Nuevo Email: vetyaoficial@gmail.com');
            console.log('- Verificación de email reseteada');
            console.log('- Ahora puede solicitar verificación de email');
        } else {
            console.log('❌ No se encontró el usuario admin con email admin@vetya.com');
        }
        
        // Desconectar de MongoDB
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB');
    } catch (error) {
        console.error('Error al actualizar email del admin:', error);
    }
}

// Ejecutar la función
updateAdminEmail();
