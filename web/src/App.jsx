import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Menu,
  Phone,
  X,
} from 'lucide-react';
import PhoneMockup from './components/PhoneMockup.jsx';
import Reveal from './components/Reveal.jsx';
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
      <Reveal className="hero-copy" direction="left">
        <h1 className="hero-title">El veterinario de tu mascota, al instante y en tu celular.</h1>
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
      </Reveal>
      <div className="hero-preview" aria-label="Vista previa de las aplicaciones">
        <div className="hero-phone-stage hero-phone-stage-left">
          <PhoneMockup type="vetya" compact />
        </div>
        <div className="hero-phone-stage hero-phone-stage-right">
          <PhoneMockup type="vetpresta" compact />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="problem-band">
      <Reveal className="problem-copy" direction="left">
        <h2>Que resuelve para la población</h2>
        <p>
          VetYa ayuda a que la atención veterinaria sea más rápida, ordenada y transparente, especialmente cuando
          una mascota necesita asistencia urgente o cuando una familia no sabe qué prestador elegir.
        </p>
      </Reveal>
      <div className="problem-list">
        {populationProblems.map((item, index) => (
          <Reveal as="div" direction="up" delay={index * 90} key={item}>
            <CheckCircle2 size={20} />
            <span>{item}</span>
          </Reveal>
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
          <Reveal direction="left">
            <img className="app-logo" src="/assets/vetya-logo.png" alt="Logo VetYa" />
            <SectionTitle
              title="VetYa para usuarios"
              text="La app para personas que necesitan solicitar servicios veterinarios, buscar prestadores, agendar citas y mantener el historial de sus mascotas."
            />
          </Reveal>
          <div className="feature-grid">
            {vetyaFeatures.map((feature, index) => (
              <Reveal key={feature.title} direction="up" delay={index * 80}>
                <FeatureCard feature={feature} />
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal className="mockup-column" direction="right" delay={120}>
          <PhoneMockup type="vetya" />
        </Reveal>
      </div>
    </section>
  );
}

function VetprestaSection() {
  return (
    <section id="vetpresta" className="section app-section provider-section">
      <div className="section-grid reverse">
        <Reveal className="mockup-column" direction="left">
          <PhoneMockup type="vetpresta" />
        </Reveal>
        <div>
          <Reveal direction="right">
            <img className="app-logo provider-logo" src="/assets/vetpresta-logo.png" alt="Logo Vetpresta" />
            <SectionTitle
              title="Vetpresta para prestadores"
              text="La app operativa para veterinarios y centros: recibe emergencias, confirma citas, configura horarios, valida documentación y administra servicios."
            />
          </Reveal>
          <div className="feature-grid">
            {vetprestaFeatures.map((feature, index) => (
              <Reveal key={feature.title} direction="up" delay={index * 80}>
                <FeatureCard feature={feature} />
              </Reveal>
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
      <Reveal direction="up">
        <SectionTitle
          align="center"
          title="Un ecosistema para cuidar mejor"
          text="VetYa nace como puente entre familias, mascotas y profesionales. El sistema une dos aplicaciones móviles para que cada solicitud tenga trazabilidad segura y confiable."
        />
      </Reveal>
      <div className="stats-grid">
        {sharedStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Reveal as="article" key={stat.label} direction="up" delay={index * 110}>
              <Icon size={24} />
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contacto" className="section contact-section">
      <Reveal direction="left">
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
      </Reveal>
      <Reveal as="form" className="contact-form" direction="right" delay={100}>
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
      </Reveal>
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
