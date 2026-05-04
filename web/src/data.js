import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  FileCheck,
  HeartPulse,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  UserCheck,
  WalletCards,
} from 'lucide-react';

export const navItems = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'vetya', label: 'VetYa' },
  { id: 'vetpresta', label: 'Vetpresta' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'contacto', label: 'Contacto' },
];

export const vetyaFeatures = [
  {
    icon: AlertTriangle,
    title: 'Emergencias 24/7',
    text: 'Solicitud inmediata con ubicación GPS, prioridad por gravedad y seguimiento del caso.',
  },
  {
    icon: CalendarCheck,
    title: 'Citas programadas',
    text: 'Búsqueda por especialidad, disponibilidad, cercanía y valoraciones de otros usuarios.',
  },
  {
    icon: PawPrint,
    title: 'Historial de mascotas',
    text: 'Perfiles con datos básicos, antecedentes, citas, emergencias y cuidados relevantes.',
  },
  {
    icon: Stethoscope,
    title: 'Consulta general',
    text: 'Canal para resolver dudas y recibir orientación profesional sin demoras innecesarias.',
  },
];

export const vetprestaFeatures = [
  {
    icon: ShieldCheck,
    title: 'Validación profesional',
    text: 'Carga de documentación, datos fiscales y revisión administrativa antes de operar.',
  },
  {
    icon: Clock,
    title: 'Disponibilidad',
    text: 'Horarios, modalidad de atención, días no disponibles y recepción de urgencias.',
  },
  {
    icon: FileCheck,
    title: 'Gestión de casos',
    text: 'Confirmación de citas, emergencias activas, detalles del paciente y estados del servicio.',
  },
  {
    icon: WalletCards,
    title: 'Servicios e ingresos',
    text: 'Catálogo de prestaciones, precios de referencia, valoraciones y resumen operativo.',
  },
];

export const populationProblems = [
  'Reduce la espera ante una urgencia veterinaria.',
  'Ordena la oferta de prestadores confiables y cercanos.',
  'Da visibilidad a veterinarios y centros validados.',
  'Centraliza turnos, mascotas, seguimiento y valoraciones.',
];

export const vetyaScreens = [
  {
    id: 'home',
    label: 'Inicio',
    icon: HeartPulse,
    title: 'Hola, Martin',
    subtitle: 'Cuidemos a Max y Luna hoy',
  },
  {
    id: 'search',
    label: 'Buscar',
    icon: Search,
    title: 'Prestadores cercanos',
    subtitle: 'Especialistas disponibles por zona',
  },
  {
    id: 'appointments',
    label: 'Citas',
    icon: CalendarCheck,
    title: 'Mis citas',
    subtitle: 'Próximas y finalizadas',
  },
  {
    id: 'pets',
    label: 'Mascotas',
    icon: PawPrint,
    title: 'Mis mascotas',
    subtitle: 'Perfiles e historial médico',
  },
];

export const vetprestaScreens = [
  {
    id: 'panel',
    label: 'Panel',
    icon: Stethoscope,
    title: 'Panel profesional',
    subtitle: 'Citas, urgencias y disponibilidad',
  },
  {
    id: 'emergencies',
    label: 'Urgencias',
    icon: AlertTriangle,
    title: 'Emergencias activas',
    subtitle: 'Alertas cercanas en tiempo real',
  },
  {
    id: 'agenda',
    label: 'Citas',
    icon: CalendarCheck,
    title: 'Gestion de citas',
    subtitle: 'Confirmar, rechazar o completar',
  },
  {
    id: 'profile',
    label: 'Perfil',
    icon: UserCheck,
    title: 'Perfil validado',
    subtitle: 'Servicios, horarios y reputacion',
  },
];

export const vetCards = [
  {
    name: 'Dra. Ana Silva',
    type: 'Dermatologia',
    distance: '1.2 km',
    score: '4.9',
  },
  {
    name: 'Centro Vet San Roque',
    type: 'Clinica integral',
    distance: '4.0 km',
    score: '4.7',
  },
];

export const emergencyCards = [
  {
    title: 'Atropello en via publica',
    meta: 'Perro mestizo - 1.2 km',
    level: 'Alta',
  },
  {
    title: 'Posible intoxicacion',
    meta: 'Gato adulto - 3.5 km',
    level: 'Media',
  },
];

export const sharedStats = [
  { value: 'GPS', label: 'Ubicación para urgencias', icon: MapPin },
  { value: 'JWT', label: 'Sesión segura', icon: ShieldCheck },
  { value: '4.8', label: 'Valoración promedio demo', icon: Star },
];
