import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  MapPin,
  PawPrint,
  Plus,
  ShieldCheck,
  Star,
  Stethoscope,
} from 'lucide-react';
import { emergencyCards, vetCards, vetprestaScreens, vetyaScreens } from '../data.js';

function PhoneHeader({ logo, title, subtitle, dark = false }) {
  return (
    <div className={`phone-header ${dark ? 'phone-header-dark' : ''}`}>
      <div className="phone-brand-row">
        <img src={logo} alt="" className="phone-logo" />
        <div>
          <p>{title}</p>
          <span>{subtitle}</span>
        </div>
      </div>
      <button className="icon-button" aria-label="Notificaciones">
        <Bell size={17} />
      </button>
    </div>
  );
}

function VetYaScreen({ active }) {
  if (active === 'search') {
    return (
      <div className="phone-content">
        <div className="search-field">Buscar especialidad o prestador</div>
        <div className="filter-row">
          <span>Todos</span>
          <span>A domicilio</span>
          <span>Clínicas</span>
        </div>
        {vetCards.map((vet) => (
          <article className="phone-list-card" key={vet.name}>
            <div className="avatar-gradient">
              <Stethoscope size={22} />
            </div>
            <div>
              <strong>{vet.name}</strong>
              <p>{vet.type}</p>
              <small>{vet.distance} de distancia</small>
            </div>
            <span className="score">
              <Star size={12} fill="currentColor" /> {vet.score}
            </span>
          </article>
        ))}
      </div>
    );
  }

  if (active === 'appointments') {
    return (
      <div className="phone-content">
        <div className="date-strip">
          <span>Hoy</span>
          <span className="selected">Mar 05</span>
          <span>Mie 06</span>
        </div>
        <article className="appointment-card">
          <CalendarCheck size={20} />
          <div>
            <strong>Consulta general</strong>
            <p>Max con Dra. Ana Silva</p>
            <small>Mañana, 10:30 hs</small>
          </div>
          <CheckCircle2 size={18} />
        </article>
        <article className="appointment-card soft">
          <Clock size={20} />
          <div>
            <strong>Vacunación anual</strong>
            <p>Luna en Centro Vet San Roque</p>
            <small>Viernes, 15:00 hs</small>
          </div>
        </article>
      </div>
    );
  }

  if (active === 'pets') {
    return (
      <div className="phone-content">
        {['Max - Golden Retriever', 'Luna - Siames'].map((pet) => (
          <article className="pet-card" key={pet}>
            <div className="pet-avatar">
              <PawPrint size={24} />
            </div>
            <div>
              <strong>{pet}</strong>
              <p>Vacunas al día</p>
              <small>Historial disponible</small>
            </div>
          </article>
        ))}
        <button className="phone-primary">
          <Plus size={17} /> Agregar mascota
        </button>
      </div>
    );
  }

  return (
    <div className="phone-content">
      <button className="emergency-button">
        <AlertTriangle size={24} />
        <span>
          <strong>Emergencia 24/7</strong>
          <small>Enviar ubicación y síntomas</small>
        </span>
      </button>
      <div className="quick-grid">
        <span>
          <Stethoscope size={20} /> Consulta
        </span>
        <span>
          <CalendarCheck size={20} /> Cita
        </span>
        <span>
          <PawPrint size={20} /> Mascotas
        </span>
        <span>
          <MapPin size={20} /> Cercanos
        </span>
      </div>
      <h4>Prestadores destacados</h4>
      {vetCards.slice(0, 1).map((vet) => (
        <article className="featured-card" key={vet.name}>
          <div>
            <strong>{vet.name}</strong>
            <p>{vet.type} - {vet.distance}</p>
          </div>
          <span>Agendar</span>
        </article>
      ))}
    </div>
  );
}

function VetprestaScreen({ active, available, onToggle }) {
  if (active === 'emergencies') {
    return (
      <div className="phone-content">
        <div className="availability-note">
          <AlertTriangle size={17} />
          {available ? 'Recibiendo alertas cercanas' : 'Activa disponibilidad para recibir casos'}
        </div>
        {emergencyCards.map((emergency) => (
          <article className="emergency-case" key={emergency.title}>
            <span>{emergency.level}</span>
            <strong>{emergency.title}</strong>
            <p>{emergency.meta}</p>
            <div>
              <button>Ignorar</button>
              <button>Aceptar</button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (active === 'agenda') {
    return (
      <div className="phone-content">
        {['Max - Consulta general', 'Luna - Vacunacion'].map((item, index) => (
          <article className="provider-appointment" key={item}>
            <CalendarCheck size={20} />
            <div>
              <strong>{item}</strong>
              <p>{index === 0 ? 'Hoy, 14:30 hs' : 'Manana, 10:00 hs'}</p>
            </div>
            <button>{index === 0 ? 'Confirmar' : 'Ver'}</button>
          </article>
        ))}
      </div>
    );
  }

  if (active === 'profile') {
    return (
      <div className="phone-content">
        <div className="profile-card">
          <ShieldCheck size={28} />
          <strong>Dr. Carlos Mendoza</strong>
          <p>Cirugía general y clínica</p>
          <span>Perfil verificado</span>
        </div>
        {['Disponibilidad y horarios', 'Servicios ofrecidos', 'Reseñas y valoraciones'].map((item) => (
          <div className="profile-row" key={item}>
            <FileCheck size={18} />
            {item}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="phone-content">
      <div className="provider-switch">
        <div>
          <strong>Atención de emergencias</strong>
          <p>{available ? 'Disponible ahora' : 'No disponible'}</p>
        </div>
        <button className={available ? 'switch active' : 'switch'} onClick={onToggle} aria-label="Cambiar disponibilidad">
          <span />
        </button>
      </div>
      <div className="metric-grid">
        <span>
          <CalendarCheck size={19} />
          <strong>4</strong>
          Citas hoy
        </span>
        <span>
          <Star size={19} fill="currentColor" />
          <strong>4.8</strong>
          Valoracion
        </span>
      </div>
      <article className="validation-card">
        <ShieldCheck size={22} />
        <div>
          <strong>Identidad validada</strong>
          <p>Perfil visible para clientes</p>
        </div>
      </article>
    </div>
  );
}

export default function PhoneMockup({ type = 'vetya', compact = false }) {
  const isVetpresta = type === 'vetpresta';
  const screens = isVetpresta ? vetprestaScreens : vetyaScreens;
  const [active, setActive] = useState(screens[0].id);
  const [available, setAvailable] = useState(false);
  const current = useMemo(() => screens.find((screen) => screen.id === active), [active, screens]);

  return (
    <div className={`phone-shell ${compact ? 'phone-shell-compact' : ''}`}>
      <div className="phone-notch" />
      <PhoneHeader
        logo={isVetpresta ? '/assets/vetpresta-logo.png' : '/assets/vetya-logo.png'}
        title={current.title}
        subtitle={current.subtitle}
        dark={isVetpresta}
      />
      {isVetpresta ? (
        <VetprestaScreen active={active} available={available} onToggle={() => setAvailable((value) => !value)} />
      ) : (
        <VetYaScreen active={active} />
      )}
      <nav className={`phone-tabs ${isVetpresta ? 'provider-tabs' : ''}`} aria-label={`Mockup ${type}`}>
        {screens.map((screen) => {
          const Icon = screen.icon;
          return (
            <button
              type="button"
              key={screen.id}
              className={active === screen.id ? 'active' : ''}
              onClick={() => setActive(screen.id)}
            >
              <Icon size={18} />
              <span>{screen.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
