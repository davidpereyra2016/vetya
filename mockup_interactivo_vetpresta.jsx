import React, { useState } from 'react';
import { 
  Home, AlertTriangle, Calendar, ClipboardList, User, 
  Settings, LogOut, CheckCircle2, XCircle, Clock, MapPin, 
  Plus, ShieldCheck, DollarSign, Star, ChevronRight, AlertCircle,
  Stethoscope, Activity, FileText, Check
} from 'lucide-react';

// --- MOCK DATA PARA PRESTADORES ---
const MOCK_PROVIDER = {
  name: 'Dr. Carlos Mendoza',
  specialty: 'Cirugía General y Clínica',
  validationStatus: 'Validado',
  rating: 4.8,
  totalAppointments: 342,
  image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80'
};

const MOCK_APPOINTMENTS = [
  { id: 1, patient: 'Max', owner: 'Martín Gómez', type: 'Consulta General', date: 'Hoy, 14:30', status: 'Pendiente', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80' },
  { id: 2, patient: 'Luna', owner: 'Ana Silva', type: 'Vacunación', date: 'Mañana, 10:00', status: 'Confirmada', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=80' },
];

const MOCK_EMERGENCIES = [
  { id: 1, description: 'Atropello en vía pública', patient: 'Perro Mestizo', distance: '1.2 km', urgency: 'Alta', status: 'Activa', time: 'Hace 5 min' },
  { id: 2, description: 'Posible intoxicación', patient: 'Gato', distance: '3.5 km', urgency: 'Media', status: 'Asignada', time: 'Hace 15 min' },
];

const MOCK_SERVICES = [
  { id: 1, name: 'Consulta General', price: '$15.000', modality: 'Clínica', icon: Stethoscope },
  { id: 2, name: 'Vacunación Anual', price: '$25.000', modality: 'Ambos', icon: Activity },
  { id: 3, name: 'Consulta a Domicilio', price: '$22.000', modality: 'Domicilio', icon: MapPin },
];

export default function VetYaProviderApp() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  const [isAvailableEmergency, setIsAvailableEmergency] = useState(false);
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);

  const navigate = (screen, tab = null) => {
    setCurrentScreen(screen);
    if (tab) setActiveTab(tab);
  };

  // --- COMPONENTES UI REUTILIZABLES ---
  const Header = ({ title, rightIcon = null }) => (
    <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-[#2196F3] sticky top-0 z-20">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      {rightIcon && (
        <button className="p-2 rounded-full bg-white/20 text-white transition active:scale-95">
          {rightIcon}
        </button>
      )}
    </div>
  );

  const BottomNav = () => (
    <div className="absolute bottom-0 w-full bg-[#2196F3] flex justify-around items-center pb-6 pt-3 px-2 z-30 rounded-b-[32px] shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      {[
        { id: 'home', icon: Home, label: 'Panel' },
        { id: 'emergencies', icon: AlertTriangle, label: 'Urgencias' },
        { id: 'appointments', icon: Calendar, label: 'Citas' },
        { id: 'services', icon: ClipboardList, label: 'Servicios' },
        { id: 'profile', icon: User, label: 'Perfil' },
      ].map((item) => (
        <button 
          key={item.id} 
          onClick={() => navigate(item.id, item.id)}
          className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${activeTab === item.id ? 'text-white' : 'text-blue-200 hover:text-white'}`}
        >
          <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-white/20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </div>
  );

  const CustomSwitch = ({ enabled, onChange }) => (
    <button 
      onClick={onChange}
      className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out flex ${enabled ? 'bg-green-500 justify-end' : 'bg-slate-300 justify-start'}`}
    >
      <div className="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300"></div>
    </button>
  );

  // --- PANTALLAS ---

  const ScreenHome = () => (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-24">
      <div className="bg-[#2196F3] px-6 pt-12 pb-8 rounded-b-3xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src={MOCK_PROVIDER.image} alt="Provider" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
            <div>
              <p className="text-blue-100 text-sm font-medium">Hola de nuevo,</p>
              <h1 className="text-xl font-bold text-white">Dr. Mendoza</h1>
            </div>
          </div>
          <button className="relative p-2 bg-white/20 rounded-full">
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Validation Status Banner */}
        <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-3 flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-green-300" />
          <div>
            <p className="text-white text-sm font-bold">Identidad Verificada</p>
            <p className="text-blue-100 text-xs">Tu perfil es visible para clientes</p>
          </div>
        </div>

        {/* Emergency Availability Toggle */}
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Atención de Emergencias</h3>
            <p className={`text-xs font-semibold ${isAvailableEmergency ? 'text-green-600' : 'text-slate-500'}`}>
              {isAvailableEmergency ? 'Disponible ahora (Recibiendo alertas)' : 'No disponible en este momento'}
            </p>
          </div>
          <CustomSwitch enabled={isAvailableEmergency} onChange={() => setIsAvailableEmergency(!isAvailableEmergency)} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">Resumen de hoy</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
              <Calendar className="w-8 h-8 text-[#2196F3] mb-2" />
              <span className="text-2xl font-black text-slate-800">4</span>
              <span className="text-xs text-slate-500 font-medium">Citas Hoy</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
              <Star className="w-8 h-8 text-yellow-400 mb-2 fill-yellow-400" />
              <span className="text-2xl font-black text-slate-800">{MOCK_PROVIDER.rating}</span>
              <span className="text-xs text-slate-500 font-medium">Valoración media</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">Acciones rápidas</h2>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {[
              { icon: Clock, label: 'Disponibilidad', action: () => navigate('profile', 'profile') },
              { icon: Plus, label: 'Nuevo Servicio', action: () => navigate('services', 'services') },
              { icon: FileText, label: 'Historial', action: () => navigate('appointments', 'appointments') },
            ].map((action, i) => (
              <button key={i} onClick={action.action} className="flex-none w-28 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm active:bg-slate-50">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-[#2196F3]" />
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ScreenEmergencies = () => (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24">
      <Header title="Emergencias Activas" />
      
      {/* Tabs like EmergencyListScreen.js */}
      <div className="px-6 py-2 bg-[#2196F3] flex gap-4 rounded-b-3xl shadow-sm mb-4">
        <button className="pb-3 border-b-2 border-white text-white font-bold px-2 text-sm">Alertas (2)</button>
        <button className="pb-3 border-b-2 border-transparent text-blue-200 font-semibold px-2 text-sm">Historial</button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto">
        {!isAvailableEmergency && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">No estás marcado como disponible. Activa tu disponibilidad en el Panel para recibir nuevas alertas.</p>
          </div>
        )}

        {MOCK_EMERGENCIES.map(em => (
          <div key={em.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${em.urgency === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                Urgencia {em.urgency}
              </span>
              <span className="text-xs text-slate-400 font-medium">{em.time}</span>
            </div>
            
            <h3 className="font-bold text-slate-800 text-base mb-1">{em.description}</h3>
            
            <div className="space-y-1 mt-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <AlertTriangle className="w-4 h-4 text-slate-400" /> Paciente: {em.patient}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" /> A {em.distance} de distancia
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-bold">Ignorar</button>
              <button className="flex-[2] bg-[#2196F3] text-white py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-200">Aceptar Caso</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ScreenAppointments = () => {
    // Logic from AppointmentsScreen.js for Providers
    const handleAction = (id, newStatus) => {
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
    };

    return (
      <div className="flex-1 flex flex-col bg-slate-50 pb-24">
        <Header title="Gestión de Citas" />
        
        <div className="px-6 py-2 bg-[#2196F3] flex gap-4 rounded-b-3xl shadow-sm mb-4">
          <button className="pb-3 border-b-2 border-white text-white font-bold px-2 text-sm">Pendientes</button>
          <button className="pb-3 border-b-2 border-transparent text-blue-200 font-semibold px-2 text-sm">Confirmadas</button>
          <button className="pb-3 border-b-2 border-transparent text-blue-200 font-semibold px-2 text-sm">Completadas</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {appointments.map(appt => (
            <div key={appt.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm bg-slate-100 px-2 py-1 rounded-lg">
                  <Calendar className="w-4 h-4 text-[#2196F3]" />
                  {appt.date}
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border
                  ${appt.status === 'Pendiente' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                    appt.status === 'Confirmada' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'}
                `}>
                  {appt.status}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <img src={appt.image} alt={appt.patient} className="w-14 h-14 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{appt.patient}</h3>
                  <p className="text-xs text-slate-500">Dueño: {appt.owner}</p>
                  <p className="text-xs font-semibold text-[#2196F3] mt-0.5">{appt.type}</p>
                </div>
              </div>

              {/* Action Buttons based on status */}
              {appt.status === 'Pendiente' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(appt.id, 'Cancelada')} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-100 flex items-center justify-center gap-1">
                    <XCircle className="w-4 h-4" /> Rechazar
                  </button>
                  <button onClick={() => handleAction(appt.id, 'Confirmada')} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#2196F3] text-white shadow-md shadow-blue-200 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Confirmar
                  </button>
                </div>
              )}
              {appt.status === 'Confirmada' && (
                <button onClick={() => handleAction(appt.id, 'Completada')} className="w-full py-2.5 rounded-xl text-sm font-bold bg-green-500 text-white shadow-md shadow-green-200 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> Marcar Completada
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ScreenServices = () => (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24 relative">
      <Header title="Mis Servicios" />
      <div className="bg-[#2196F3] h-6 rounded-b-3xl -mt-2 mb-4"></div>
      
      <div className="px-6 mb-4">
        <p className="text-sm text-slate-500">Gestiona los servicios que ofreces y sus precios de referencia.</p>
      </div>

      <div className="p-6 pt-0 space-y-4 overflow-y-auto">
        {MOCK_SERVICES.map(service => (
          <div key={service.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <service.icon className="w-6 h-6 text-[#2196F3]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">{service.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> {service.price}
                  </span>
                  <span className="text-xs text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                    {service.modality}
                  </span>
                </div>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-[#2196F3] bg-slate-50 rounded-full">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* FAB Add Service */}
      <button className="absolute bottom-28 right-6 w-14 h-14 bg-[#2196F3] rounded-full shadow-lg shadow-blue-300 flex items-center justify-center text-white hover:bg-blue-700 transition">
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );

  const ScreenProfile = () => (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24 overflow-y-auto">
      <Header title="Perfil de Prestador" />
      
      <div className="px-6 py-8 flex flex-col items-center bg-[#2196F3] rounded-b-3xl shadow-sm mb-6 -mt-1">
        <div className="relative">
          <img src={MOCK_PROVIDER.image} alt="User" className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover" />
          <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-sm">
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mt-4">{MOCK_PROVIDER.name}</h2>
        <p className="text-blue-100 font-medium">{MOCK_PROVIDER.specialty}</p>
        
        <div className="flex gap-6 mt-6 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/20">
          <div className="text-center">
            <span className="block text-xl font-black text-white">{MOCK_PROVIDER.rating}</span>
            <span className="text-[10px] text-blue-100 uppercase font-bold tracking-wider">Valoración</span>
          </div>
          <div className="w-px h-full bg-white/30"></div>
          <div className="text-center">
            <span className="block text-xl font-black text-white">{MOCK_PROVIDER.totalAppointments}</span>
            <span className="text-[10px] text-blue-100 uppercase font-bold tracking-wider">Citas Org.</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Mi Clínica / Negocio</h3>
        
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-6">
          {[
            { icon: Clock, label: 'Disponibilidad y Horarios' },
            { icon: MapPin, label: 'Dirección de Atención' },
            { icon: DollarSign, label: 'Datos Bancarios y Pagos' },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-3 ${i !== 2 ? 'border-b border-slate-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#2196F3]">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 mr-2" />
            </div>
          ))}
        </div>

        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Cuenta</h3>

        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-6">
          {[
            { icon: User, label: 'Datos Personales' },
            { icon: Settings, label: 'Configuración' },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-3 ${i !== 1 ? 'border-b border-slate-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#2196F3]">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 mr-2" />
            </div>
          ))}
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-bold mt-4">
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  // --- RENDER MAIN LAYOUT ---
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[400px] h-[800px] bg-white rounded-[40px] shadow-2xl overflow-hidden relative border-[12px] border-slate-800">
        
        {/* Dynamic Screen Rendering */}
        {currentScreen === 'home' && <ScreenHome />}
        {currentScreen === 'emergencies' && <ScreenEmergencies />}
        {currentScreen === 'appointments' && <ScreenAppointments />}
        {currentScreen === 'services' && <ScreenServices />}
        {currentScreen === 'profile' && <ScreenProfile />}

        <BottomNav />

        {/* Safe Area Top Indicator (iOS style) */}
        <div className="absolute top-0 w-full h-6 flex justify-center items-end pb-1 z-50 pointer-events-none">
          <div className="w-32 h-1.5 bg-slate-800 rounded-b-xl"></div>
        </div>
      </div>
    </div>
  );
}