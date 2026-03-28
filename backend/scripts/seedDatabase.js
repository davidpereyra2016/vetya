/**
 * Script para poblar la base de datos con datos de prueba
 * NO elimina datos existentes - solo agrega nuevos registros
 * 
 * EJECUTAR:
 * cd E:\vetya_1.0\backend
 * node scripts/seedDatabase.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importación de Modelos
import User from '../src/models/User.js';
import Prestador from '../src/models/Prestador.js';
import PrestadorValidacion from '../src/models/PrestadorValidacion.js';
import Servicio from '../src/models/Servicio.js';
import Disponibilidad from '../src/models/Disponibilidad.js';
import Cita from '../src/models/Cita.js';
import Emergencia from '../src/models/Emergencia.js';
import Pago from '../src/models/Pago.js';
import Valoracion from '../src/models/Valoracion.js';
import Mascota from '../src/models/Mascota.js';

// Cargar variables de entorno
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vetya');
    console.log('✅ Conectado a MongoDB exitosamente');
    console.log('📊 Base de datos:', mongoose.connection.db.databaseName);

    // Mostrar estadísticas actuales
    console.log('\n📈 Estadísticas actuales:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Prestadores: ${await Prestador.countDocuments()}`);
    console.log(`   Mascotas: ${await Mascota.countDocuments()}`);

    // ═══════════════════════════════════════════════════════════════
    // 1. CREAR USUARIOS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👤 Creando Usuarios...');
    
    const cliente1 = await User.create({
      email: 'juan.perez.seed@vetya.com', username: 'JuanPerezVetya', password: 'password123', role: 'client',
      profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
      ubicacionActual: { coordinates: { lat: -34.6037, lng: -58.3816 }, lastUpdated: new Date() }
    });
    const cliente2 = await User.create({
      email: 'maria.gomez.seed@vetya.com', username: 'MariaGomezVetya', password: 'password123', role: 'client',
      profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg',
      ubicacionActual: { coordinates: { lat: -34.6040, lng: -58.3820 }, lastUpdated: new Date() }
    });
    const cliente3 = await User.create({
      email: 'carlos.ruiz.seed@vetya.com', username: 'CarlosRuizVetya', password: 'password123', role: 'client',
      profilePicture: 'https://randomuser.me/api/portraits/men/67.jpg',
      ubicacionActual: { coordinates: { lat: -34.6100, lng: -58.3900 }, lastUpdated: new Date() }
    });
    const userVet = await User.create({
      email: 'dr.house.seed@vetya.com', username: 'DrHouseVetya', password: 'password123', role: 'provider',
      profilePicture: 'https://randomuser.me/api/portraits/men/75.jpg'
    });
    const userCentro = await User.create({
      email: 'clinica.central.seed@vetya.com', username: 'ClinicaCentralVetya', password: 'password123', role: 'provider'
    });
    const userPaseador = await User.create({
      email: 'paseos.felices.seed@vetya.com', username: 'PaseosFelicesVetya', password: 'password123', role: 'provider'
    });
    console.log('   ✅ 6 usuarios creados');

    // ═══════════════════════════════════════════════════════════════
    // 2. CREAR MASCOTAS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🐾 Creando Mascotas...');
    const mascota1 = await Mascota.create({
      nombre: 'Firulais', tipo: 'Perro', raza: 'Golden Retriever', edad: '5 años', genero: 'Macho',
      color: 'Dorado', peso: '30kg', vacunado: true, necesidadesEspeciales: 'Alergia al pollo',
      imagen: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      fechaNacimiento: new Date('2019-03-15'),
      historialMedico: [{ fecha: new Date('2024-01-15'), descripcion: 'Vacuna antirrábica', tipoVisita: 'Vacunación' }],
      ultimaVisita: new Date('2024-06-20'),
      proximasVacunas: [{ nombre: 'Antirrábica', fecha: new Date('2025-01-15') }],
      propietario: cliente1._id, activo: true
    });
    const mascota2 = await Mascota.create({
      nombre: 'Michi', tipo: 'Gato', raza: 'Siamés', edad: '2 años', genero: 'Hembra',
      color: 'Crema', peso: '4kg', vacunado: true, necesidadesEspeciales: 'Muy asustadiza',
      imagen: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      fechaNacimiento: new Date('2022-07-10'),
      historialMedico: [{ fecha: new Date('2024-02-10'), descripcion: 'Esterilización', tipoVisita: 'Cirugía' }],
      propietario: cliente2._id, activo: true
    });
    const mascota3 = await Mascota.create({
      nombre: 'Rex', tipo: 'Perro', raza: 'Pastor Alemán', edad: '7 años', genero: 'Macho',
      color: 'Negro y Fuego', peso: '35kg', vacunado: false, necesidadesEspeciales: 'Displasia de cadera',
      imagen: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400',
      propietario: cliente3._id, activo: true
    });
    console.log('   ✅ 3 mascotas creadas');

    // ═══════════════════════════════════════════════════════════════
    // 3. CREAR PRESTADORES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🏥 Creando Prestadores...');
    const prestadorVet = await Prestador.create({
      usuario: userVet._id, nombre: 'Dr. Gregory House - Veterinaria', tipo: 'Veterinario',
      especialidades: ['Cirugía General', 'Diagnóstico por Imágenes', 'Medicina Interna'],
      servicios: [
        { nombre: 'Consulta General', precio: 2500, duracion: 30, descripcion: 'Revisión completa' },
        { nombre: 'Cirugía Menor', precio: 8000, duracion: 60, descripcion: 'Procedimientos ambulatorios' }
      ],
      imagen: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
      direccion: { calle: 'Av. Corrientes', numero: '1234', ciudad: 'Buenos Aires', estado: 'CABA', codigoPostal: 'C1043AAZ', coordenadas: { lat: -34.6037, lng: -58.3816 } },
      horarios: [
        { dia: 1, manana: { activo: true, apertura: '08:00', cierre: '12:00' }, tarde: { activo: true, apertura: '14:00', cierre: '20:00' } },
        { dia: 2, manana: { activo: true, apertura: '08:00', cierre: '12:00' }, tarde: { activo: true, apertura: '14:00', cierre: '20:00' } },
        { dia: 3, manana: { activo: true, apertura: '08:00', cierre: '12:00' }, tarde: { activo: true, apertura: '14:00', cierre: '20:00' } }
      ],
      telefono: '+54 11 4567-8901', email: 'dr.house.seed@vetya.com', rating: 4.8,
      disponibleEmergencias: true, precioEmergencia: 5000, radio: 10,
      ubicacionActual: { coordenadas: { lat: -34.6037, lng: -58.3816 }, ultimaActualizacion: new Date() },
      activo: true, verificado: true, estadoValidacion: 'aprobado'
    });

    const prestadorCentro = await Prestador.create({
      usuario: userCentro._id, nombre: 'Clínica Veterinaria Central', tipo: 'Centro Veterinario',
      especialidades: ['Hospitalización', 'Rayos X', 'Laboratorio', 'Cirugía Avanzada'],
      servicios: [
        { nombre: 'Internación', precio: 3500, duracion: 1440, descripcion: 'Hospitalización 24hs' },
        { nombre: 'Radiografía', precio: 3000, duracion: 30, descripcion: 'Estudio radiológico' }
      ],
      direccion: { calle: 'Av. Santa Fe', numero: '2500', ciudad: 'Buenos Aires', estado: 'CABA', codigoPostal: 'C1425BGN', coordenadas: { lat: -34.5875, lng: -58.4000 } },
      horarios: [{ dia: 1, manana: { activo: true }, tarde: { activo: true } }],
      telefono: '+54 11 5555-1234', email: 'clinica.central.seed@vetya.com', rating: 4.9,
      disponibleEmergencias: true, precioEmergencia: 8000, radio: 15,
      activo: true, verificado: true, estadoValidacion: 'aprobado'
    });

    const prestadorOtro = await Prestador.create({
      usuario: userPaseador._id, nombre: 'Paseos y Estética Canina', tipo: 'Otro',
      especialidades: ['Paseo de Mascotas', 'Baño y Corte', 'Peluquería Canina'],
      servicios: [
        { nombre: 'Paseo Individual', precio: 800, duracion: 60, descripcion: 'Paseo de 1 hora' },
        { nombre: 'Baño y Secado', precio: 1500, duracion: 45, descripcion: 'Baño completo' }
      ],
      direccion: { calle: 'Gurruchaga', numero: '1850', ciudad: 'Buenos Aires', estado: 'CABA', coordenadas: { lat: -34.5950, lng: -58.4300 } },
      horarios: [{ dia: 1, manana: { activo: true }, tarde: { activo: true } }],
      telefono: '+54 11 6789-0123', rating: 4.5, disponibleEmergencias: false,
      activo: false, verificado: false, estadoValidacion: 'en_revision'
    });
    console.log('   ✅ 3 prestadores creados');

    // ═══════════════════════════════════════════════════════════════
    // 4. CREAR VALIDACIONES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📋 Creando Validaciones...');
    await PrestadorValidacion.create({
      prestador: prestadorVet._id, estadoValidacion: 'aprobado',
      datosAdicionales: { numeroMatricula: 'MP-12345-CABA', universidad: 'UBA - Veterinaria', fechaGraduacion: new Date('2010-12-15') },
      documentos: {
        diploma: { url: 'https://res.cloudinary.com/demo/diploma.jpg', estado: 'aprobado', fechaSubida: new Date() },
        constanciaConsejo: { url: 'https://res.cloudinary.com/demo/constancia.jpg', estado: 'aprobado', fechaSubida: new Date() },
        cedulaIdentidad: { url: 'https://res.cloudinary.com/demo/dni.jpg', estado: 'aprobado', fechaSubida: new Date() }
      },
      fechaAprobacion: new Date()
    });
    await PrestadorValidacion.create({
      prestador: prestadorCentro._id, estadoValidacion: 'aprobado',
      datosAdicionales: { cuit_cuil: '30-71234567-8', razonSocial: 'Clínica Veterinaria Central S.R.L.', numeroHabilitacion: 'HAB-CABA-2023-0456' },
      documentos: {
        habilitacionMunicipal: { url: 'https://res.cloudinary.com/demo/habilitacion.jpg', estado: 'aprobado', fechaSubida: new Date() },
        cedulaIdentidad: { url: 'https://res.cloudinary.com/demo/dni_centro.jpg', estado: 'aprobado', fechaSubida: new Date() }
      },
      fechaAprobacion: new Date()
    });
    await PrestadorValidacion.create({
      prestador: prestadorOtro._id, estadoValidacion: 'en_revision',
      documentos: { cedulaIdentidad: { url: 'https://res.cloudinary.com/demo/dni_paseador.jpg', estado: 'pendiente', fechaSubida: new Date() } }
    });
    console.log('   ✅ 3 validaciones creadas');

    // ═══════════════════════════════════════════════════════════════
    // 5. CREAR SERVICIOS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🛠️ Creando Servicios...');
    const servicio1 = await Servicio.create({
      nombre: 'Consulta General Veterinaria', descripcion: 'Revisión completa del estado de salud de tu mascota',
      icono: 'medkit-outline', color: '#4CAF50', precio: 2500, duracion: 30,
      categoria: 'Consulta general', tipoPrestador: 'Veterinario',
      disponibleParaTipos: ['Perro', 'Gato', 'Ave', 'Roedor'], activo: true, prestadorId: prestadorVet._id
    });
    const servicio2 = await Servicio.create({
      nombre: 'Ecografía Abdominal', descripcion: 'Ultrasonido abdominal completo para diagnóstico',
      icono: 'pulse-outline', color: '#2196F3', precio: 4500, duracion: 45,
      categoria: 'Ecografía', tipoPrestador: 'Centro Veterinario',
      disponibleParaTipos: ['Perro', 'Gato'], activo: true, prestadorId: prestadorCentro._id
    });
    const servicio3 = await Servicio.create({
      nombre: 'Baño y Corte Completo', descripcion: 'Servicio de estética canina completo',
      icono: 'cut-outline', color: '#FF9800', precio: 3000, duracion: 120,
      categoria: 'Baño y corte', tipoPrestador: 'Otro',
      disponibleParaTipos: ['Perro', 'Gato'], activo: true, prestadorId: prestadorOtro._id
    });
    console.log('   ✅ 3 servicios creados');

    // ═══════════════════════════════════════════════════════════════
    // 6. CREAR DISPONIBILIDAD
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📅 Creando Disponibilidad...');
    await Disponibilidad.create({ prestador: prestadorVet._id, servicio: servicio1._id, horarioEspecifico: { activo: false } });
    await Disponibilidad.create({ prestador: prestadorCentro._id, servicio: servicio2._id, horarioEspecifico: { activo: false } });
    await Disponibilidad.create({ prestador: prestadorOtro._id, servicio: servicio3._id, horarioEspecifico: { activo: false } });
    console.log('   ✅ 3 disponibilidades creadas');

    // ═══════════════════════════════════════════════════════════════
    // 7. CREAR CITAS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔖 Creando Citas...');
    const cita1 = await Cita.create({
      mascota: mascota1._id, prestador: prestadorVet._id, servicio: servicio1._id,
      fecha: new Date(), horaInicio: '09:00', horaFin: '09:30', motivo: 'Control anual de vacunas',
      estado: 'Completada', ubicacion: 'Clínica', notas: 'Mascota en excelente estado',
      usuario: cliente1._id, costoEstimado: 2500, metodoPago: 'Efectivo', pagado: true
    });
    const cita2 = await Cita.create({
      mascota: mascota2._id, prestador: prestadorCentro._id, servicio: servicio2._id,
      fecha: new Date(Date.now() + 86400000), horaInicio: '10:00', horaFin: '10:45', motivo: 'Ecografía de control',
      estado: 'Confirmada', ubicacion: 'Clínica',
      usuario: cliente2._id, costoEstimado: 4500, metodoPago: 'MercadoPago', pagado: false
    });
    const cita3 = await Cita.create({
      mascota: mascota3._id, prestador: prestadorOtro._id, servicio: servicio3._id,
      fecha: new Date(Date.now() + 172800000), horaInicio: '14:00', horaFin: '16:00', motivo: 'Baño mensual',
      estado: 'Pendiente', ubicacion: 'Domicilio', direccion: 'Av. Rivadavia 5000, CABA',
      usuario: cliente3._id, costoEstimado: 3000, metodoPago: 'Efectivo', pagado: false
    });
    console.log('   ✅ 3 citas creadas');

    // ═══════════════════════════════════════════════════════════════
    // 8. CREAR EMERGENCIAS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🚨 Creando Emergencias...');
    const emergencia1 = await Emergencia.create({
      usuario: cliente1._id, mascota: mascota1._id, veterinario: prestadorVet._id,
      descripcion: 'Mi perro ingirió chocolate, está vomitando y temblando',
      tipoEmergencia: 'Envenenamiento', nivelUrgencia: 'Alta', estado: 'Atendida',
      ubicacion: { direccion: 'Av. Corrientes 1500', ciudad: 'Buenos Aires', coordenadas: { lat: -34.6037, lng: -58.3816 } },
      fechaSolicitud: new Date(Date.now() - 86400000), fechaAsignacion: new Date(Date.now() - 86400000 + 300000),
      fechaAtencion: new Date(Date.now() - 86400000 + 1800000),
      costoTotal: 5000, metodoPago: 'MercadoPago', pagado: true
    });
    const emergencia2 = await Emergencia.create({
      usuario: cliente2._id, mascota: mascota2._id, veterinario: prestadorCentro._id,
      descripcion: 'Mi gata se cayó del balcón, no puede caminar',
      tipoEmergencia: 'Accidente', nivelUrgencia: 'Alta', estado: 'En camino',
      ubicacion: { direccion: 'Av. Santa Fe 3000', ciudad: 'Buenos Aires', coordenadas: { lat: -34.5875, lng: -58.4000 } },
      metodoPago: 'Efectivo', pagado: false
    });
    const emergencia3 = await Emergencia.create({
      usuario: cliente3._id, mascota: mascota3._id,
      descripcion: 'Mi perro tiene tos muy fuerte y dificultad para respirar',
      tipoEmergencia: 'Dificultad respiratoria', nivelUrgencia: 'Media', estado: 'Solicitada',
      ubicacion: { direccion: 'Av. Rivadavia 5000', ciudad: 'Buenos Aires', coordenadas: { lat: -34.6100, lng: -58.3900 } }
    });
    console.log('   ✅ 3 emergencias creadas');

    // ═══════════════════════════════════════════════════════════════
    // 9. CREAR PAGOS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n💳 Creando Pagos...');
    await Pago.create({
      usuario: cliente1._id, concepto: 'Cita', referencia: { tipo: 'Cita', id: cita1._id },
      prestador: prestadorVet._id, monto: 2500, metodoPago: 'Efectivo', estado: 'Completado', fechaPago: new Date()
    });
    await Pago.create({
      usuario: cliente1._id, concepto: 'Emergencia', referencia: { tipo: 'Emergencia', id: emergencia1._id },
      prestador: prestadorVet._id, monto: 5000, metodoPago: 'MercadoPago', estado: 'Completado', fechaPago: new Date(),
      mercadoPago: { paymentId: 'MP-SEED-1234567890', status: 'approved', captured: true, captureDate: new Date() }
    });
    await Pago.create({
      usuario: cliente2._id, concepto: 'Cita', referencia: { tipo: 'Cita', id: cita2._id },
      prestador: prestadorCentro._id, monto: 4500, metodoPago: 'MercadoPago', estado: 'Pagado',
      mercadoPago: { paymentId: 'MP-SEED-0987654321', status: 'approved', captured: false }
    });
    console.log('   ✅ 3 pagos creados');

    // ═══════════════════════════════════════════════════════════════
    // 10. CREAR VALORACIONES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n⭐ Creando Valoraciones...');
    await Valoracion.create({
      usuario: cliente1._id, prestador: prestadorVet._id, mascota: mascota1._id, cita: cita1._id,
      calificacion: 5, comentario: 'Excelente atención, muy profesional y cariñoso con mi mascota.',
      fechaAtencion: new Date(), tipoServicio: 'Cita', verificada: true, visible: true
    });
    await Valoracion.create({
      usuario: cliente1._id, prestador: prestadorVet._id, emergencia: emergencia1._id,
      calificacion: 4, comentario: 'Llegó rápido y salvó a mi perro. Un poco caro pero vale la pena.',
      fechaAtencion: new Date(), tipoServicio: 'Emergencia', verificada: true, visible: true
    });
    await Valoracion.create({
      usuario: cliente2._id, prestador: prestadorCentro._id,
      calificacion: 5, comentario: 'Instalaciones impecables, personal muy amable y profesional.',
      tipoServicio: 'Otro', verificada: true, visible: true
    });
    console.log('   ✅ 3 valoraciones creadas');

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('✨ BASE DE DATOS POBLADA EXITOSAMENTE');
    console.log('═'.repeat(60));
    console.log('\n📊 Nuevos registros creados:');
    console.log('   👤 Usuarios: 6 (3 clientes + 3 prestadores)');
    console.log('   🐾 Mascotas: 3');
    console.log('   🏥 Prestadores: 3 (1 Veterinario, 1 Centro, 1 Otro)');
    console.log('   📋 Validaciones: 3');
    console.log('   🛠️ Servicios: 3');
    console.log('   📅 Disponibilidades: 3');
    console.log('   🔖 Citas: 3');
    console.log('   🚨 Emergencias: 3');
    console.log('   💳 Pagos: 3');
    console.log('   ⭐ Valoraciones: 3');
    console.log('\n📧 Credenciales de prueba:');
    console.log('   Cliente 1: juan.perez.seed@vetya.com / password123');
    console.log('   Cliente 2: maria.gomez.seed@vetya.com / password123');
    console.log('   Cliente 3: carlos.ruiz.seed@vetya.com / password123');
    console.log('   Veterinario: dr.house.seed@vetya.com / password123');
    console.log('   Centro: clinica.central.seed@vetya.com / password123');
    console.log('   Paseador: paseos.felices.seed@vetya.com / password123');
    console.log('\n💡 Los datos existentes NO fueron eliminados\n');

  } catch (error) {
    console.error('\n❌ Error al poblar la base de datos:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Algunos registros ya existen (email/username duplicado)');
      console.error('   Ejecuta el script con emails diferentes o limpia los datos de prueba');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

seedDatabase();
