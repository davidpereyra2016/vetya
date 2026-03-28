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

async function debugAdminVerification() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a MongoDB');

        // Buscar el admin
        const admin = await User.findOne({ email: 'vetyaoficial@gmail.com' });

        if (admin) {
            console.log('✅ Admin encontrado:');
            console.log('- Email:', admin.email);
            console.log('- isEmailVerified:', admin.isEmailVerified);
            console.log('- emailVerificationToken:', admin.emailVerificationToken);
            console.log('- emailVerificationExpires:', admin.emailVerificationExpires);
            
            if (admin.emailVerificationExpires) {
                const now = new Date();
                const expires = new Date(admin.emailVerificationExpires);
                console.log('- Fecha actual:', now.toISOString());
                console.log('- Fecha expiración:', expires.toISOString());
                console.log('- ¿Expirado?:', now > expires);
            }
            
            // Resetear verificación para probar
            console.log('\n🔧 Reseteando verificación...');
            await User.findByIdAndUpdate(admin._id, { 
                isEmailVerified: false,
                emailVerificationToken: null,
                emailVerificationExpires: null
            });
            console.log('✅ Verificación reseteada');
        } else {
            console.log('❌ No se encontró el admin');
        }
        
        // Desconectar de MongoDB
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Ejecutar la función
debugAdminVerification();
