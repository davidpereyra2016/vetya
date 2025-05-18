/**
 * Catálogo de servicios predefinidos para cada tipo de prestador
 * Los prestadores seleccionarán de este catálogo en lugar de crear servicios personalizados
 */

// Servicios para veterinarias
const serviciosVeterinario = [
  {
    id: 'vet-1',
    nombre: 'Consulta general',
    descripcion: 'Evaluación general del estado de salud de la mascota',
    categoria: 'Consulta general',
    precio: 35,
    duracion: 30,
    icono: 'medkit-outline',
    color: '#1E88E5',
  },
  {
    id: 'vet-2',
    nombre: 'Vacunación',
    descripcion: 'Aplicación de vacunas según el calendario de vacunación',
    categoria: 'Vacunación',
    precio: 25,
    duracion: 15,
    icono: 'fitness-outline',
    color: '#4CAF50',
  },
  {
    id: 'vet-3',
    nombre: 'Desparasitación',
    descripcion: 'Tratamiento para eliminar parásitos internos y externos',
    categoria: 'Desparasitación',
    precio: 20,
    duracion: 15,
    icono: 'bug-outline',
    color: '#FF9800',
  },
  {
    id: 'vet-4',
    nombre: 'Cirugía general',
    descripcion: 'Procedimientos quirúrgicos generales',
    categoria: 'Cirugía',
    precio: 200,
    duracion: 120,
    icono: 'cut-outline',
    color: '#F44336',
  },
  {
    id: 'vet-5',
    nombre: 'Radiografía',
    descripcion: 'Estudio de imagen por rayos X',
    categoria: 'Radiografía',
    precio: 80,
    duracion: 30,
    icono: 'scan-outline',
    color: '#9C27B0',
  },
  {
    id: 'vet-6',
    nombre: 'Ecografía',
    descripcion: 'Estudio de imagen por ultrasonido',
    categoria: 'Ecografía',
    precio: 70,
    duracion: 30,
    icono: 'pulse-outline',
    color: '#3F51B5',
  },
  {
    id: 'vet-7',
    nombre: 'Análisis clínicos',
    descripcion: 'Estudios de laboratorio (sangre, orina, etc.)',
    categoria: 'Análisis clínicos',
    precio: 45,
    duracion: 15,
    icono: 'flask-outline',
    color: '#00BCD4',
  },
  {
    id: 'vet-8',
    nombre: 'Atención de emergencias',
    descripcion: 'Atención inmediata para casos urgentes',
    categoria: 'Urgencias',
    precio: 60,
    duracion: 60,
    icono: 'alert-circle-outline',
    color: '#F44336',
  },
  {
    id: 'vet-9',
    nombre: 'Limpieza dental',
    descripcion: 'Limpieza y cuidado de la salud bucal',
    categoria: 'Dental',
    precio: 90,
    duracion: 60,
    icono: 'brush-outline',
    color: '#2196F3',
  },
  {
    id: 'vet-10',
    nombre: 'Consulta dermatológica',
    descripcion: 'Atención especializada para problemas de piel',
    categoria: 'Dermatología',
    precio: 50,
    duracion: 30,
    icono: 'bandage-outline',
    color: '#8BC34A',
  },
  {
    id: 'vet-11',
    nombre: 'Consulta cardiológica',
    descripcion: 'Atención especializada de problemas cardíacos',
    categoria: 'Cardiología',
    precio: 60,
    duracion: 45,
    icono: 'heart-outline',
    color: '#E91E63',
  },
  {
    id: 'vet-12',
    nombre: 'Consulta oftalmológica',
    descripcion: 'Atención especializada para problemas oculares',
    categoria: 'Oftalmología',
    precio: 55,
    duracion: 30,
    icono: 'eye-outline',
    color: '#3F51B5',
  },
  {
    id: 'vet-13',
    nombre: 'Consulta ortopédica',
    descripcion: 'Atención especializada para problemas óseos y articulares',
    categoria: 'Ortopedia',
    precio: 65,
    duracion: 45,
    icono: 'body-outline',
    color: '#607D8B',
  },
  {
    id: 'vet-14',
    nombre: 'Hospitalización',
    descripcion: 'Internación con monitoreo veterinario',
    categoria: 'Hospitalización',
    precio: 80,
    duracion: 1440, // 24 horas
    icono: 'bed-outline',
    color: '#009688',
  },
  {
    id: 'vet-15',
    nombre: 'Consulta a domicilio',
    descripcion: 'Atención veterinaria en el domicilio del cliente',
    categoria: 'Servicios a domicilio',
    precio: 70,
    duracion: 60,
    icono: 'home-outline',
    color: '#795548',
  },
];

// Servicios para peluquerías
const serviciosPeluqueria = [
  {
    id: 'pel-1',
    nombre: 'Baño y corte completo',
    descripcion: 'Baño, secado, corte de pelo y uñas, limpieza de oídos',
    categoria: 'Baño y corte',
    precio: 40,
    duracion: 90,
    icono: 'cut-outline',
    color: '#9C27B0',
  },
  {
    id: 'pel-2',
    nombre: 'Baño sanitario',
    descripcion: 'Baño con productos específicos para control de parásitos',
    categoria: 'Baño sanitario',
    precio: 35,
    duracion: 60,
    icono: 'water-outline',
    color: '#00BCD4',
  },
  {
    id: 'pel-3',
    nombre: 'Corte de pelo',
    descripcion: 'Servicio de corte y estilizado según raza',
    categoria: 'Corte de pelo',
    precio: 30,
    duracion: 60,
    icono: 'cut-outline',
    color: '#FF9800',
  },
  {
    id: 'pel-4',
    nombre: 'Corte de uñas',
    descripcion: 'Recorte y limado de uñas',
    categoria: 'Corte de uñas',
    precio: 12,
    duracion: 15,
    icono: 'resize-outline',
    color: '#607D8B',
  },
  {
    id: 'pel-5',
    nombre: 'Limpieza de oídos',
    descripcion: 'Limpieza profunda del canal auditivo',
    categoria: 'Limpieza de oídos',
    precio: 15,
    duracion: 20,
    icono: 'ear-outline',
    color: '#3F51B5',
  },
  {
    id: 'pel-6',
    nombre: 'Limpieza de glándulas anales',
    descripcion: 'Vaciado de glándulas anales para evitar problemas',
    categoria: 'Limpieza de glándulas anales',
    precio: 20,
    duracion: 15,
    icono: 'medical-outline',
    color: '#795548',
  },
  {
    id: 'pel-7',
    nombre: 'Spa canino',
    descripcion: 'Tratamiento relajante con masajes, aromaterapia y más',
    categoria: 'Spa canino',
    precio: 55,
    duracion: 120,
    icono: 'flower-outline',
    color: '#E91E63',
  },
  {
    id: 'pel-8',
    nombre: 'Tratamiento antipulgas',
    descripcion: 'Aplicación de productos para control y eliminación de pulgas',
    categoria: 'Tratamiento antipulgas',
    precio: 25,
    duracion: 30,
    icono: 'bug-outline',
    color: '#FFC107',
  },
  {
    id: 'pel-9',
    nombre: 'Tratamiento hidratante',
    descripcion: 'Hidratación profunda para piel y pelaje',
    categoria: 'Tratamiento dermatológico',
    precio: 30,
    duracion: 45,
    icono: 'water-outline',
    color: '#2196F3',
  },
  {
    id: 'pel-10',
    nombre: 'Perfumado y accesorios',
    descripcion: 'Perfume especial para mascotas y colocación de accesorios',
    categoria: 'Perfumería',
    precio: 10,
    duracion: 15,
    icono: 'happy-outline',
    color: '#9C27B0',
  },
];

// Servicios para pet shops
const serviciosPetShop = [
  {
    id: 'pet-1',
    nombre: 'Alimentos premium',
    descripcion: 'Venta de alimentos de alta gama para mascotas',
    categoria: 'Alimentos premium',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'nutrition-outline',
    color: '#4CAF50',
  },
  {
    id: 'pet-2',
    nombre: 'Alimentos medicados',
    descripcion: 'Venta de alimentos especiales para mascotas con condiciones médicas',
    categoria: 'Alimentos medicados',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'medical-outline',
    color: '#F44336',
  },
  {
    id: 'pet-3',
    nombre: 'Accesorios varios',
    descripcion: 'Venta de collares, correas, platos y más',
    categoria: 'Accesorios',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'pricetag-outline',
    color: '#FF9800',
  },
  {
    id: 'pet-4',
    nombre: 'Juguetes para mascotas',
    descripcion: 'Juguetes de diferentes tipos para entretenimiento',
    categoria: 'Juguetes',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'basketball-outline',
    color: '#9C27B0',
  },
  {
    id: 'pet-5',
    nombre: 'Camas y cuchas',
    descripcion: 'Espacios confortables para descanso de mascotas',
    categoria: 'Camas y cuchas',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'bed-outline',
    color: '#3F51B5',
  },
  {
    id: 'pet-6',
    nombre: 'Transportadoras',
    descripcion: 'Jaulas y bolsos para transportar mascotas',
    categoria: 'Transportadoras',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'briefcase-outline',
    color: '#607D8B',
  },
  {
    id: 'pet-7',
    nombre: 'Ropa para mascotas',
    descripcion: 'Prendas de diferentes tipos para mascotas',
    categoria: 'Ropa para mascotas',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'shirt-outline',
    color: '#E91E63',
  },
  {
    id: 'pet-8',
    nombre: 'Suplementos alimenticios',
    descripcion: 'Vitaminas y complementos para la alimentación',
    categoria: 'Suplementos alimenticios',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'flask-outline',
    color: '#00BCD4',
  },
  {
    id: 'pet-9',
    nombre: 'Productos de higiene',
    descripcion: 'Champús, cepillos, toallitas y más',
    categoria: 'Productos de higiene',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'water-outline',
    color: '#2196F3',
  },
  {
    id: 'pet-10',
    nombre: 'Farmacia veterinaria',
    descripcion: 'Medicamentos y productos veterinarios básicos',
    categoria: 'Farmacia veterinaria',
    precio: 0, // Precio variable
    duracion: 0, // No aplica
    icono: 'bandage-outline',
    color: '#F44336',
  },
];

// Servicios para centros veterinarios
const serviciosCentroVeterinario = [
  {
    id: 'cv-1',
    nombre: 'Internación 24hs',
    descripcion: 'Servicio completo de hospitalización con monitoreo',
    categoria: 'Internación',
    precio: 120,
    duracion: 1440, // 24 horas
    icono: 'bed-outline',
    color: '#F44336',
  },
  {
    id: 'cv-2',
    nombre: 'Rehabilitación',
    descripcion: 'Terapias de rehabilitación para recuperación de lesiones',
    categoria: 'Rehabilitación',
    precio: 65,
    duracion: 60,
    icono: 'fitness-outline',
    color: '#4CAF50',
  },
  {
    id: 'cv-3',
    nombre: 'Fisioterapia',
    descripcion: 'Tratamientos físicos para recuperación y bienestar',
    categoria: 'Fisioterapia',
    precio: 60,
    duracion: 45,
    icono: 'body-outline',
    color: '#3F51B5',
  },
  {
    id: 'cv-4',
    nombre: 'Terapia acuática',
    descripcion: 'Rehabilitación mediante ejercicios en agua',
    categoria: 'Terapia acuática',
    precio: 80,
    duracion: 60,
    icono: 'water-outline',
    color: '#00BCD4',
  },
  {
    id: 'cv-5',
    nombre: 'Atención a domicilio',
    descripcion: 'Servicio de atención veterinaria en el domicilio',
    categoria: 'Servicios a domicilio',
    precio: 75,
    duracion: 60,
    icono: 'home-outline',
    color: '#9C27B0',
  },
];

// Otros servicios (adiestramiento, guardería, etc.)
const serviciosOtros = [
  {
    id: 'ot-1',
    nombre: 'Adiestramiento básico',
    descripcion: 'Enseñanza de comandos básicos y socialización',
    categoria: 'Adiestramiento',
    precio: 50,
    duracion: 60,
    icono: 'school-outline',
    color: '#795548',
  },
  {
    id: 'ot-2',
    nombre: 'Guardería canina',
    descripcion: 'Cuidado de mascotas por día o jornada',
    categoria: 'Guardería',
    precio: 35,
    duracion: 480, // 8 horas
    icono: 'people-outline',
    color: '#FF9800',
  },
  {
    id: 'ot-3',
    nombre: 'Servicio de adopción',
    descripcion: 'Apoyo y gestión para adopción de mascotas',
    categoria: 'Adopción',
    precio: 0,
    duracion: 60,
    icono: 'heart-outline',
    color: '#E91E63',
  },
  {
    id: 'ot-4',
    nombre: 'Trámites de exportación',
    descripcion: 'Gestión de documentos para viajes internacionales',
    categoria: 'Trámites de exportación',
    precio: 150,
    duracion: 0, // Variable
    icono: 'airplane-outline',
    color: '#607D8B',
  },
  {
    id: 'ot-5',
    nombre: 'Fotografía de mascotas',
    descripcion: 'Sesión fotográfica profesional para mascotas',
    categoria: 'Otros',
    precio: 75,
    duracion: 60,
    icono: 'camera-outline',
    color: '#9E9E9E',
  },
];

// Agrupar todos los servicios por tipo de prestador
const serviciosPorTipo = {
  Veterinario: serviciosVeterinario,
  Peluquería: serviciosPeluqueria,
  PetShop: serviciosPetShop,
  'Centro Veterinario': serviciosCentroVeterinario,
  Otro: serviciosOtros,
};

// Todos los servicios en una sola lista (para búsquedas globales)
const todosLosServicios = [
  ...serviciosVeterinario,
  ...serviciosPeluqueria,
  ...serviciosPetShop,
  ...serviciosCentroVeterinario,
  ...serviciosOtros,
];

export { serviciosPorTipo, todosLosServicios };
