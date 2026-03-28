/**
 * Script para eliminar el índice TTL de la colección emergencias
 * Este índice causaba que las emergencias se eliminaran automáticamente
 * 
 * EJECUTAR UNA SOLA VEZ:
 * node scripts/removeEmergencyTTLIndex.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Emergencia from '../src/models/Emergencia.js';

// Cargar variables de entorno
dotenv.config();

const removeExpiraEnIndex = async () => {
  try {
    console.log('🔗 Conectando a MongoDB...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vetya', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado a MongoDB exitosamente');
    console.log('📊 Base de datos:', mongoose.connection.db.databaseName);
    
    // Listar índices existentes antes de eliminar
    console.log('\n📋 Índices existentes en la colección emergencias:');
    const indexesBefore = await Emergencia.collection.getIndexes();
    console.log(JSON.stringify(indexesBefore, null, 2));
    
    // Verificar si existe el índice expiraEn_1
    if (indexesBefore.expiraEn_1) {
      console.log('\n🎯 Índice TTL "expiraEn_1" encontrado. Procediendo a eliminar...');
      
      try {
        // Eliminar el índice TTL
        await Emergencia.collection.dropIndex('expiraEn_1');
        console.log('✅ Índice TTL "expiraEn_1" eliminado exitosamente');
      } catch (dropError) {
        if (dropError.code === 27) {
          console.log('ℹ️  El índice "expiraEn_1" no existe o ya fue eliminado');
        } else {
          throw dropError;
        }
      }
    } else {
      console.log('\nℹ️  El índice TTL "expiraEn_1" no existe en la colección');
      console.log('   Esto significa que ya fue eliminado o nunca existió');
    }
    
    // Listar índices después de eliminar
    console.log('\n📋 Índices después de la eliminación:');
    const indexesAfter = await Emergencia.collection.getIndexes();
    console.log(JSON.stringify(indexesAfter, null, 2));
    
    // Contar emergencias existentes
    const count = await Emergencia.countDocuments();
    console.log(`\n📊 Total de emergencias en la base de datos: ${count}`);
    
    // Mostrar algunas emergencias de ejemplo
    if (count > 0) {
      console.log('\n📄 Primeras 3 emergencias (ejemplo):');
      const samples = await Emergencia.find()
        .limit(3)
        .select('estado fechaSolicitud expiraEn expirada')
        .lean();
      
      samples.forEach((em, index) => {
        console.log(`\n  Emergencia ${index + 1}:`);
        console.log(`    Estado: ${em.estado}`);
        console.log(`    Fecha solicitud: ${em.fechaSolicitud}`);
        console.log(`    ExpiraEn: ${em.expiraEn || 'No definido'}`);
        console.log(`    Expirada: ${em.expirada}`);
      });
    }
    
    console.log('\n✅ Proceso completado exitosamente');
    console.log('💡 Las emergencias ahora permanecerán en la base de datos indefinidamente');
    console.log('💡 El historial de emergencias estará disponible para los clientes\n');
    
  } catch (error) {
    console.error('\n❌ Error al eliminar el índice:', error);
    console.error('Detalles del error:', error.message);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar el script
removeExpiraEnIndex();
