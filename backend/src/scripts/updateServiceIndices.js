import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../lib/db.js';

dotenv.config();

// Función principal para actualizar índices
const updateIndices = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('Conectado a MongoDB para actualización de índices');
    
    // Obtener la colección de servicios directamente (sin el modelo)
    const db = mongoose.connection.db;
    const serviciosCollection = db.collection('servicios');
    
    // Listar índices actuales
    console.log('Índices actuales en la colección servicios:');
    const indices = await serviciosCollection.indexes();
    console.log(JSON.stringify(indices, null, 2));
    
    // Verificar si existe el índice único en nombre
    const nombreIndex = indices.find(idx => 
      idx.key && idx.key.nombre === 1 && idx.unique === true && !idx.key.prestadorId
    );
    
    if (nombreIndex) {
      console.log('Encontrado índice único en campo nombre:', nombreIndex.name);
      
      // Eliminar el índice único en nombre
      console.log('Eliminando índice único en campo nombre...');
      await serviciosCollection.dropIndex(nombreIndex.name);
      console.log('Índice eliminado correctamente');
    } else {
      console.log('No se encontró índice único simple en campo nombre');
    }

    // Verificar si ya existe el índice compuesto
    const compoundIndex = indices.find(idx => 
      idx.key && idx.key.nombre === 1 && idx.key.prestadorId === 1
    );
    
    if (!compoundIndex) {
      // Crear el índice compuesto nombre + prestadorId (sparse para permitir servicios sin prestadorId)
      console.log('Creando índice compuesto nombre + prestadorId...');
      await serviciosCollection.createIndex(
        { nombre: 1, prestadorId: 1 },
        { unique: true, sparse: true }
      );
      console.log('Índice compuesto creado correctamente');
    } else {
      console.log('El índice compuesto nombre + prestadorId ya existe');
    }

    // Verificamos los índices actualizados
    console.log('\nÍndices actualizados:');
    const updatedIndices = await serviciosCollection.indexes();
    console.log(JSON.stringify(updatedIndices, null, 2));

    console.log('\nProceso de actualización de índices completado con éxito');
  } catch (error) {
    console.error('Error al actualizar índices:', error);
  } finally {
    // Cerrar la conexión
    console.log('Cerrando conexión...');
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Ejecutar la función
updateIndices();
