import React, { useState } from 'react';
import { 
  Home, Search, Calendar, User, PawPrint, Bell, 
  ChevronRight, Star, Clock, MapPin, Phone, MessageCircle, 
  Settings, LogOut, HeartPulse, Stethoscope, Scissors, 
  ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Plus
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_VETS = [
  { id: 1, name: 'Dr. Carlos Mendoza', specialty: 'Cirugía General', rating: 4.8, reviews: 124, patients: 350, distance: '2.5 km', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80', about: 'Especialista en cirugía de tejidos blandos con más de 10 años de experiencia. Apasionado por el bienestar animal.' },
  { id: 2, name: 'Dra. Ana Silva', specialty: 'Dermatología', rating: 4.9, reviews: 89, patients: 420, distance: '1.2 km', image: 'https://images.unsplash.com/photo-1594824436998-d50d6ff71da2?auto=format&fit=crop&w=200&q=80', about: 'Dedicada a resolver problemas complejos de la piel. Atención amable y detallista.' },
  { id: 3, name: 'Centro Vet San Roque', specialty: 'Clínica Integral', rating: 4.6, reviews: 310, patients: 1200, distance: '4.0 km', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=200&q=80', about: 'Centro integral con servicios de rayos X, ecografía y laboratorio propio 24/7.' },
];

const MOCK_PETS = [
  { id: 1, name: 'Max', type: 'Perro', breed: 'Golden Retriever', age: '3 años', weight: '28 kg', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80', vaccinated: true },
  { id: 2, name: 'Luna', type: 'Gato', breed: 'Siamés', age: '1 año', weight: '4.5 kg', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=80', vaccinated: true },
];

const MOCK_APPOINTMENTS = [
  { id: 1, vet: MOCK_VETS[0], pet: MOCK_PETS[0], date: 'Mañana, 10:00 AM', status: 'upcoming', type: 'Consulta General' },
  { id: 2, vet: MOCK_VETS[1], pet: MOCK_PETS[1], date: '15 Oct, 14:30 PM', status: 'past', type: 'Revisión Piel' },
];

export default function VetYaApp() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedItem, setSelectedItem] = useState(null); // For detail screens
  const [bookingData, setBookingData] = useState({});

  // Navigation Helper
  const navigate = (screen, tab = null, item = null) => {
    setCurrentScreen(screen);
    if (tab) setActiveTab(tab);
    if (item !== undefined) setSelectedItem(item);
  };

  // --- COMPONENTES UI REUTILIZABLES ---
  const Header = ({ title, showBack = false, rightIcon = null }) => (
    <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-[#2196F3] sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={() => navigate(activeTab)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
        )}
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      </div>
      {rightIcon && (
        <button className="p-2 rounded-full bg-slate-100 text-slate-600">
          {rightIcon}
        </button>
      )}
    </div>
  );

  const BottomNav = () => (
    <div className="absolute bottom-0 w-full bg-[#2196F3] border-t border-slate-200 flex justify-around items-center pb-6 pt-3 px-2 z-30 rounded-b-[32px]">
      {[
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'vets', icon: Search, label: 'Buscar' },
        { id: 'appointments', icon: Calendar, label: 'Citas' },
        { id: 'pets', icon: PawPrint, label: 'Mascotas' },
        { id: 'profile', icon: User, label: 'Perfil' },
      ].map((item) => (
        <button 
          key={item.id} 
          onClick={() => navigate(item.id, item.id)}
          className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-blue-50/50' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </div>
  );

  // --- PANTALLAS ---

  const ScreenHome = () => (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-24">
      {/* Header Home */}
      <div className="px-6 pt-12 pb-6 bg-[#2196F3] rounded-b-3xl shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-slate-500 text-sm font-medium">Buenos días,</p>
            <h1 className="text-2xl font-bold text-slate-800">Martín</h1>
          </div>
          <button className="relative p-3 bg-slate-100 rounded-full">
            <Bell className="w-6 h-6 text-slate-600" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* Emergency Banner */}
        <button className="w-full bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-red-200 transform transition active:scale-95">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-lg">Emergencia 24/7</h3>
              <p className="text-red-100 text-sm">Encuentra ayuda inmediata</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70" />
        </button>
      </div>

      {/* Services Grid */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">¿Qué necesitas hoy?</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Stethoscope, label: 'Consulta', color: 'bg-blue-100 text-blue-600' },
            { icon: ShieldCheck, label: 'Vacunas', color: 'bg-green-100 text-green-600' },
            { icon: Scissors, label: 'Estética', color: 'bg-purple-100 text-purple-600' },
            { icon: HeartPulse, label: 'Cirugía', color: 'bg-orange-100 text-orange-600' },
          ].map((srv, idx) => (
            <button key={idx} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${srv.color} shadow-sm`}>
                <srv.icon className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold text-slate-600">{srv.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Vets */}
      <div className="pl-6 mb-8">
        <div className="flex justify-between items-center pr-6 mb-4">
          <h2 className="text-lg font-bold text-slate-800">Prestadores Destacados</h2>
          <button onClick={() => navigate('vets', 'vets')} className="text-sm font-semibold text-blue-600">Ver todos</button>
        </div>
        <div className="flex overflow-x-auto pb-4 gap-4 pr-6 snap-x" style={{ scrollbarWidth: 'none' }}>
          {MOCK_VETS.map(vet => (
            <div key={vet.id} onClick={() => navigate('vet_detail', 'home', vet)} className="snap-start shrink-0 w-60 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer">
              <div className="relative h-32">
                <img src={vet.image} alt={vet.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-white">{vet.rating}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 truncate">{vet.name}</h3>
                <p className="text-xs text-blue-600 font-semibold mb-2">{vet.specialty}</p>
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>A {vet.distance} de ti</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ScreenVets = () => (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24">
      <Header title="Buscar Veterinarios" />
      
      {/* Search & Filters */}
      <div className="px-6 py-4 bg-[#2196F3] border-b border-slate-100">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, especialidad..." 
            className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {['Todos', 'Clínicas', 'Especialistas', 'A domicilio'].map((filter, i) => (
            <button key={i} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold border ${i === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {MOCK_VETS.map(vet => (
          <div key={vet.id} onClick={() => navigate('vet_detail', 'vets', vet)} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition">
            <img src={vet.image} alt={vet.name} className="w-24 h-24 rounded-xl object-cover" />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-base leading-tight">{vet.name}</h3>
                  <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-700">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold">{vet.rating}</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-blue-600 mt-1">{vet.specialty}</p>
              </div>
              <div className="flex justify-between items-end mt-2">
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {vet.distance}</div>
                  <div className="flex items-center gap-1"><User className="w-3 h-3"/> +{vet.patients} pac.</div>
                </div>
                <button className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold">
                  Ver Perfil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ScreenVetDetail = () => {
    const vet = selectedItem;
    if(!vet) return null;

    return (
      <div className="flex-1 flex flex-col bg-slate-50 pb-24 overflow-y-auto relative">
        {/* Top Image with Back Button */}
        <div className="relative h-64 w-full">
          <img src={vet.image} alt={vet.name} className="w-full h-full object-cover" />
          <div className="absolute top-0 left-0 w-full p-6 pt-12 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
            <button onClick={() => navigate(activeTab)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
              <HeartPulse className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Details */}
        <div className="bg-slate-50 -mt-6 rounded-t-3xl px-6 pt-6 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 leading-tight">{vet.name}</h1>
              <p className="text-blue-600 font-bold text-sm mt-1">{vet.specialty}</p>
            </div>
          </div>

          {/* Stats Boxes (From PrestaDetailsScreen.js) */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
              <div className="flex items-center gap-1 text-yellow-500 mb-1">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <span className="text-lg font-black text-slate-800">{vet.rating}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{vet.reviews} Reseñas</span>
            </div>
            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
              <div className="flex items-center gap-1 text-blue-500 mb-1">
                <User className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-slate-800">+{vet.patients}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pacientes</span>
            </div>
            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
              <div className="flex items-center gap-1 text-green-500 mb-1">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-slate-800">10+</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Años Exp.</span>
            </div>
          </div>

          {/* About */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-2">Sobre {vet.name}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{vet.about}</p>
          </div>

          {/* Location details */}
          <div className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4 mb-20 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Av. Siempre Viva 123</p>
              <p className="text-xs text-slate-500">A {vet.distance} de tu ubicación</p>
            </div>
          </div>
        </div>

        {/* Floating Action Button for Booking */}
        <div className="fixed bottom-24 left-0 w-full px-6 max-w-md mx-auto">
          <button 
            onClick={() => {
              setBookingData({ vet });
              navigate('book', activeTab);
            }}
            className="w-full bg-blue-600 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transform transition active:scale-95"
          >
            <Calendar className="w-5 h-5" />
            Agendar Cita
          </button>
        </div>
      </div>
    );
  };

  const ScreenBook = () => {
    const [step, setStep] = useState(2); // Start at pet selection assuming vet is chosen
    const steps = ['Prestador', 'Mascota', 'Fecha', 'Confirmar'];
    const progressPercentage = ((step - 1) / (steps.length - 1)) * 100;

    return (
      <div className="flex-1 flex flex-col bg-slate-50 pb-24">
        <Header title="Agendar Cita" showBack />
        
        {/* Stepper (From AgendarCitaScreen.js) */}
        <div className="px-6 py-6 bg-[#2196F3] shadow-sm mb-4">
          <div className="relative h-1 bg-slate-200 rounded-full mb-6">
            <div 
              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
            <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 flex justify-between px-1">
              {steps.map((s, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < step ? 'bg-blue-600' : 'bg-slate-200 border-2 border-white'}`}></div>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {steps.map((s, i) => <span key={i} className={i + 1 === step ? 'text-blue-600' : ''}>{s}</span>)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-4">¿Para quién es la cita?</h2>
              <div className="space-y-3">
                {MOCK_PETS.map(pet => (
                  <button 
                    key={pet.id}
                    onClick={() => setBookingData({...bookingData, pet})}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${bookingData.pet?.id === pet.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white'}`}
                  >
                    <img src={pet.image} alt={pet.name} className="w-14 h-14 rounded-full object-cover" />
                    <div className="flex-1 text-left">
                      <h3 className="font-bold text-slate-800">{pet.name}</h3>
                      <p className="text-xs text-slate-500">{pet.type} - {pet.breed}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${bookingData.pet?.id === pet.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                      {bookingData.pet?.id === pet.id && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
              <button 
                disabled={!bookingData.pet}
                onClick={() => setStep(3)}
                className={`w-full mt-8 py-4 rounded-xl font-bold transition-colors ${bookingData.pet ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-400'}`}
              >
                Continuar
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Selecciona Fecha y Hora</h2>
              
              {/* Fake Calendar View */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Octubre 2023</h3>
                  <div className="flex gap-2">
                    <button className="p-1 rounded-full bg-slate-100 text-slate-500"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                    <button className="p-1 rounded-full bg-slate-100 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex justify-between gap-2 overflow-x-auto pb-2">
                  {[14, 15, 16, 17, 18].map(day => (
                    <button 
                      key={day}
                      onClick={() => setBookingData({...bookingData, date: `${day} Oct`})}
                      className={`flex flex-col items-center justify-center w-14 h-16 rounded-2xl border ${bookingData.date === `${day} Oct` ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border-slate-100 text-slate-600'}`}
                    >
                      <span className="text-[10px] font-bold uppercase opacity-80">Mar</span>
                      <span className="text-lg font-black">{day}</span>
                    </button>
                  ))}
                </div>
              </div>

              <h3 className="font-bold text-slate-800 mb-3">Horarios disponibles</h3>
              <div className="grid grid-cols-3 gap-3">
                {['09:00 AM', '10:30 AM', '14:00 PM', '15:30 PM', '17:00 PM'].map(time => (
                  <button 
                    key={time}
                    onClick={() => setBookingData({...bookingData, time})}
                    className={`py-3 rounded-xl text-sm font-bold border transition-colors ${bookingData.time === time ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-xl font-bold bg-slate-100 text-slate-600">Atrás</button>
                <button 
                  disabled={!bookingData.date || !bookingData.time}
                  onClick={() => setStep(4)}
                  className={`flex-1 py-4 rounded-xl font-bold transition-colors ${bookingData.date && bookingData.time ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-400'}`}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Confirmar Resumen</h2>
              
              {/* Resumen Card (styled exactly as AgendarCitaScreen.js snippet) */}
              <div className="bg-blue-600 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-blue-300 mb-8 text-white">
                <div className="absolute -right-6 -bottom-6 opacity-10">
                  <PawPrint className="w-32 h-32" />
                </div>
                
                <h3 className="text-xs font-black text-blue-200 tracking-widest uppercase mb-4">Resumen de Cita</h3>
                
                <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-100">Prestador</p>
                      <p className="font-bold">{bookingData.vet?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <PawPrint className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-100">Paciente</p>
                      <p className="font-bold">{bookingData.pet?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-100">Fecha y Hora</p>
                      <p className="font-bold">{bookingData.date} a las {bookingData.time}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(3)} className="flex-1 py-4 rounded-xl font-bold bg-slate-100 text-slate-600">Atrás</button>
                <button 
                  onClick={() => {
                    alert("¡Cita agendada con éxito!");
                    navigate('appointments', 'appointments');
                  }}
                  className="flex-[2] py-4 rounded-xl font-bold bg-green-500 text-white shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ScreenPets = () => (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24 relative">
      <Header title="Mis Mascotas" rightIcon={<Bell className="w-5 h-5" />} />
      
      <div className="p-6 space-y-4">
        {MOCK_PETS.map(pet => (
          <div key={pet.id} onClick={() => navigate('pet_detail', 'pets', pet)} className="bg-[#2196F3] rounded-2xl p-4 flex gap-4 shadow-sm border border-slate-100 cursor-pointer items-center">
            <img src={pet.image} alt={pet.name} className="w-20 h-20 rounded-2xl object-cover" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-800">{pet.name}</h3>
                {pet.vaccinated && (
                  <div className="bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[10px] font-bold text-green-600 uppercase">Vacunado</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium">{pet.type} • {pet.breed}</p>
              <div className="flex gap-3 mt-2 text-xs font-semibold text-slate-400">
                <span>{pet.age}</span>
                <span>•</span>
                <span>{pet.weight}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB Add Pet */}
      <button className="absolute bottom-28 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-300 flex items-center justify-center text-white hover:bg-blue-700 transition">
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );

  const ScreenAppointments = () => (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24">
      <Header title="Mis Citas" />
      
      {/* Tabs */}
      <div className="px-6 py-2 bg-[#2196F3] flex gap-4 border-b border-slate-100">
        <button className="pb-3 border-b-2 border-blue-600 text-blue-600 font-bold px-2 text-sm">Próximas</button>
        <button className="pb-3 border-b-2 border-transparent text-slate-400 font-semibold px-2 text-sm">Pasadas</button>
      </div>

      <div className="p-6 space-y-4">
        {MOCK_APPOINTMENTS.map(appt => (
          <div key={appt.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${appt.status === 'upcoming' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
            
            <div className="flex justify-between items-start mb-3 pl-2">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-2 py-1 rounded-lg">
                <Calendar className="w-4 h-4" />
                {appt.date}
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${appt.status === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {appt.status === 'upcoming' ? 'Confirmada' : 'Finalizada'}
              </span>
            </div>

            <div className="flex items-center gap-4 pl-2">
              <img src={appt.vet.image} alt={appt.vet.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-50" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-base">{appt.vet.name}</h3>
                <p className="text-xs text-slate-500">{appt.type}</p>
                <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-blue-600">
                  <PawPrint className="w-3 h-3" /> Paciente: {appt.pet.name}
                </div>
              </div>
            </div>
            
            {appt.status === 'upcoming' && (
              <div className="mt-4 flex gap-2 pl-2">
                <button className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600">Reprogramar</button>
                <button className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-600">Ver Detalles</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const ScreenProfile = () => (
    <div className="flex-1 flex flex-col bg-slate-50 pb-24 overflow-y-auto">
      <Header title="Mi Perfil" />
      
      <div className="px-6 py-8 flex flex-col items-center bg-[#2196F3] shadow-sm border-b border-slate-100">
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80" alt="User" className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover" />
          <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white border-2 border-white">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mt-4">Martín Gómez</h2>
        <p className="text-slate-500 font-medium">martin.gomez@email.com</p>
      </div>

      <div className="p-6">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Configuración</h3>
        
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-6">
          {[
            { icon: User, label: 'Datos Personales' },
            { icon: MapPin, label: 'Mis Direcciones' },
            { icon: Bell, label: 'Notificaciones', toggle: true },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-3 ${i !== 2 ? 'border-b border-slate-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{item.label}</span>
              </div>
              {item.toggle ? (
                <div className="w-12 h-6 bg-blue-600 rounded-full relative mr-2">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-[#2196F3] rounded-full"></div>
                </div>
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-300 mr-2" />
              )}
            </div>
          ))}
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-bold mt-8">
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
        {currentScreen === 'vets' && <ScreenVets />}
        {currentScreen === 'vet_detail' && <ScreenVetDetail />}
        {currentScreen === 'book' && <ScreenBook />}
        {currentScreen === 'pets' && <ScreenPets />}
        {currentScreen === 'appointments' && <ScreenAppointments />}
        {currentScreen === 'profile' && <ScreenProfile />}

        {/* Bottom Navigation is hidden on some specific deep screens */}
        {!['vet_detail', 'book'].includes(currentScreen) && <BottomNav />}

        {/* Safe Area Top Indicator (iOS style) */}
        <div className="absolute top-0 w-full h-6 flex justify-center items-end pb-1 z-50 pointer-events-none">
          <div className="w-32 h-1.5 bg-slate-800 rounded-b-xl"></div>
        </div>
      </div>
    </div>
  );
}