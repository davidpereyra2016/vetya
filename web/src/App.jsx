import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import PhoneMockup from './components/PhoneMockup.jsx';
import {
  navItems,
  populationProblems,
  sharedStats,
  vetprestaFeatures,
  vetyaFeatures,
} from './data.js';

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('inicio');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -55% 0px' },
    );

    navItems.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id) => {
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <header className="site-header">
      <a className="brand" href="#inicio" onClick={(event) => event.preventDefault()}>
        <img src="/assets/vetya-logo.png" alt="VetYa" />
        <span>VetYa</span>
      </a>

      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <nav className={open ? 'main-nav open' : 'main-nav'} aria-label="Navegacion principal">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={active === item.id ? 'active' : ''}
            onClick={() => handleClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

function FeatureCard({ feature }) {
  const Icon = feature.icon;
  return (
    <article className="feature-card">
      <div className="feature-icon">
        <Icon size={23} />
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.text}</p>
    </article>
  );
}

function SectionTitle({ title, text, align = 'left' }) {
  return (
    <div className={`section-title ${align === 'center' ? 'center' : ''}`}>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function Hero() {
  return (
    <section id="inicio" className="hero section">
      <div className="hero-copy">
        <h1>VetYa conecta familias y prestadores veterinarios cuando el tiempo importa.</h1>
        <p>
          Una plataforma móvil pensada para pedir emergencias, reservar turnos, gestionar mascotas y dar a los
          profesionales una herramienta clara para responder, organizar su agenda y validar sus servicios.
        </p>
        <div className="hero-actions">
          <button type="button" onClick={() => scrollToSection('vetya')}>
            Ver app VetYa <ArrowRight size={18} />
          </button>
          <button type="button" className="secondary" onClick={() => scrollToSection('vetpresta')}>
            Ver Vetpresta
          </button>
        </div>
        <div className="hero-domain">
          <ShieldCheck size={18} />
          Sitio preparado para publicar en www.vetya.com.ar
        </div>
      </div>
      <div className="hero-preview" aria-label="Vista previa de las aplicaciones">
        <PhoneMockup type="vetya" compact />
        <PhoneMockup type="vetpresta" compact />
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="problem-band">
      <div className="problem-copy">
        <h2>Que resuelve para la población</h2>
        <p>
          VetYa ayuda a que la atención veterinaria sea más rápida, ordenada y transparente, especialmente cuando
          una mascota necesita asistencia urgente o cuando una familia no sabe qué prestador elegir.
        </p>
      </div>
      <div className="problem-list">
        {populationProblems.map((item) => (
          <div key={item}>
            <CheckCircle2 size={20} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function VetYaSection() {
  return (
    <section id="vetya" className="section app-section">
      <div className="section-grid">
        <div>
          <img className="app-logo" src="/assets/vetya-logo.png" alt="Logo VetYa" />
          <SectionTitle
            title="VetYa para usuarios"
            text="La app para personas que necesitan solicitar servicios veterinarios, buscar prestadores, agendar citas y mantener el historial de sus mascotas."
          />
          <div className="feature-grid">
            {vetyaFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
        <div className="mockup-column">
          <PhoneMockup type="vetya" />
        </div>
      </div>
    </section>
  );
}

function VetprestaSection() {
  return (
    <section id="vetpresta" className="section app-section provider-section">
      <div className="section-grid reverse">
        <div className="mockup-column">
          <PhoneMockup type="vetpresta" />
        </div>
        <div>
          <img className="app-logo provider-logo" src="/assets/vetpresta-logo.png" alt="Logo Vetpresta" />
          <SectionTitle
            title="Vetpresta para prestadores"
            text="La app operativa para veterinarios y centros: recibe emergencias, confirma citas, configura horarios, valida documentación y administra servicios."
          />
          <div className="feature-grid">
            {vetprestaFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="nosotros" className="section about-section">
      <SectionTitle
        align="center"
        title="Un ecosistema para cuidar mejor"
        text="VetYa nace como puente entre familias, mascotas y profesionales. El sistema une dos aplicaciones móviles con un backend común para que cada solicitud tenga trazabilidad."
      />
      <div className="stats-grid">
        {sharedStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label}>
              <Icon size={24} />
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contacto" className="section contact-section">
      <div>
        <SectionTitle
          title="Contacto"
          text="Espacio preparado para convertir esta web en la puerta de entrada pública del proyecto."
        />
        <div className="contact-list">
          <a href="mailto:contacto@vetya.com.ar">
            <Mail size={20} /> contacto@vetya.com.ar
          </a>
          <a href="tel:+543704858458">
            <Phone size={20} /> +54 370 4858458
          </a>
          <span>
            <MapPin size={20} /> Argentina
          </span>
        </div>
      </div>
      <form className="contact-form">
        <label>
          Nombre
          <input type="text" placeholder="Tu nombre" />
        </label>
        <label>
          Email
          <input type="email" placeholder="tu@email.com" />
        </label>
        <label>
          Mensaje
          <textarea rows="4" placeholder="Contanos en qué podemos ayudarte" />
        </label>
        <button type="button">Enviar mensaje</button>
      </form>
    </section>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <VetYaSection />
        <VetprestaSection />
        <AboutSection />
        <ContactSection />
      </main>
      <footer>
        <span>VetYa</span>
        <p>www.vetya.com.ar</p>
      </footer>
    </>
  );
}
