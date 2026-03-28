# 🏥 VETYA - PLATAFORMA DE SERVICIOS VETERINARIOS

## 📋 Descripción General del Sistema

**Vetya** es una plataforma completa tipo "Uber" para servicios veterinarios que conecta clientes/dueños de mascotas con prestadores de servicios veterinarios (veterinarios individuales y centros veterinarios) para emergencias en tiempo real y citas programadas.

---

## 🎯 Visión del Sistema

El sistema permite:
- **Clientes**: Solicitar emergencias veterinarias urgentes con seguimiento GPS en tiempo real, agendar citas con prestadores, gestionar mascotas y ver consejos de salud
- **Prestadores**: Recibir y atender emergencias cercanas, gestionar citas agendadas, completar proceso de validación profesional y configurar disponibilidad
- **Administradores**: Validar y aprobar prestadores, monitorear emergencias y citas, gestionar el sistema desde un panel web

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    VETYA - SISTEMA COMPLETO                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│                  │        │                  │        │                  │
│   VETYA (App)    │◄──────►│     BACKEND      │◄──────►│  VETPRESTA (App) │
│    CLIENTES      │  API   │   Node.js API    │  API   │   PRESTADORES    │
│  React Native    │  REST  │   + MongoDB      │  REST  │  React Native    │
│                  │        │   + Panel Admin  │        │                  │
└──────────────────┘        └──────────────────┘        └──────────────────┘
        │                           │                            │
        │                           │                            │
    Usuarios                   Base de Datos              Veterinarios
    Clientes                   Centralizada               Centros Vet
    Mascotas                                              Servicios
```

---

## 📁 Estructura del Proyecto

```
vetya_1.0/
│
├── backend/                      # 🔧 Backend API + Panel Admin
│   ├── src/
│   │   ├── models/              # 12 modelos de MongoDB
│   │   ├── routes/              # 17 archivos de rutas API
│   │   ├── admin/               # Panel web administrativo (EJS)
│   │   ├── middleware/          # Autenticación y validación
│   │   └── config/              # Configuraciones
│   └── ARQUITECTURA_BACKEND.md  # 📘 Documentación detallada
│
├── vetpresta/                    # 📱 App de Prestadores (React Native)
│   ├── src/
│   │   ├── screens/             # 12 grupos de pantallas
│   │   ├── store/               # 9 stores de Zustand
│   │   ├── services/            # 8 servicios de API
│   │   ├── navigation/          # Sistema de navegación
│   │   └── components/          # Componentes reutilizables
│   └── ARQUITECTURA_VETPRESTA.md # 📗 Documentación detallada
│
├── vetya/                        # 📱 App de Clientes (React Native)
│   ├── src/
│   │   ├── screens/             # 4 grupos de pantallas
│   │   ├── store/               # 8 stores de Zustand
│   │   ├── services/            # 6 servicios de API
│   │   ├── navigation/          # Sistema de navegación
│   │   └── components/          # Componentes reutilizables
│   └── ARQUITECTURA_VETYA.md    # 📙 Documentación detallada
│
└── README.md                     # 📖 Este archivo (Visión general)
```

---

## 🎨 Componentes del Sistema

### **1. BACKEND** (Node.js + Express + MongoDB)
📍 **Ubicación**: `E:\vetya_1.0\backend`
📘 **Documentación**: [ARQUITECTURA_BACKEND.md](backend/ARQUITECTURA_BACKEND.md)

**Funcionalidades principales:**
- API RESTful para ambas aplicaciones móviles
- Sistema de autenticación con JWT
- Gestión de emergencias en tiempo real
- Sistema de citas y disponibilidad
- Validación y aprobación de prestadores
- Panel administrativo web (EJS)
- Gestión de mascotas y usuarios
- Sistema de notificaciones
- Procesamiento de pagos
- Valoraciones y reseñas
- Consejos de salud

**Modelos de Base de Datos:**
1. `User` - Usuarios/Clientes
2. `Prestador` - Prestadores de servicios
3. `PrestadorValidacion` - Validación de prestadores
4. `Mascota` - Mascotas
5. `Cita` - Citas/Turnos
6. `Emergencia` - Emergencias
7. `Servicio` - Catálogo de servicios
8. `Disponibilidad` - Horarios
9. `Pago` - Transacciones
10. `Valoracion` - Reseñas
11. `Notificacion` - Notificaciones
12. `ConsejoDeSalud` - Tips

**Tecnologías:**
- Express 5.1.0
- Mongoose 8.14.3
- JWT + bcryptjs
- Cloudinary (almacenamiento)
- EJS (panel admin)

---

### **2. VETPRESTA** (App de Prestadores)
📍 **Ubicación**: `E:\vetya_1.0\vetpresta`
📗 **Documentación**: [ARQUITECTURA_VETPRESTA.md](vetpresta/ARQUITECTURA_VETPRESTA.md)

**Para quién:** Veterinarios individuales y centros veterinarios

**Funcionalidades principales:**
- Recibir y gestionar emergencias asignadas
- Gestionar citas agendadas por clientes
- Completar proceso de validación profesional
- Subir documentos (diploma, matrícula, habilitación)
- Configurar disponibilidad y horarios
- Ver reseñas y calificaciones
- Gestionar perfil profesional
- Toggle de disponibilidad para emergencias
- Dashboard con estadísticas

**Flujo de validación:**
```
1. Registro → pendiente_documentos
2. Completar datos adicionales (matrícula, universidad, CUIT, etc.)
3. Subir documentos requeridos
4. Admin revisa en panel web
5. Aprobación/Rechazo/Correcciones
6. Si aprobado → Acceso completo
```

**Tecnologías:**
- React Native 0.79.2
- Expo ~53.0.9
- Zustand (estado)
- React Navigation
- React Native Maps

---

### **3. VETYA** (App de Clientes)
📍 **Ubicación**: `E:\vetya_1.0\vetya`
📙 **Documentación**: [ARQUITECTURA_VETYA.md](vetya/ARQUITECTURA_VETYA.md)

**Para quién:** Dueños de mascotas / Clientes

**Funcionalidades principales:**
- Solicitar emergencias veterinarias urgentes
- Ver veterinarios disponibles en mapa
- Seguimiento GPS en tiempo real de emergencias
- Agendar citas con prestadores
- Buscar prestadores por ubicación/especialidad
- Gestionar mascotas (agregar, editar, historial)
- Ver reseñas y calificaciones
- Ver consejos de salud
- Valorar servicios recibidos
- Realizar consultas generales
- Ver historial de servicios

**Flujo de emergencia:**
```
1. Cliente solicita emergencia
2. Describe síntomas y selecciona mascota
3. Sistema obtiene ubicación GPS
4. Busca veterinarios disponibles cercanos
5. Muestra mapa con opciones
6. Asigna veterinario
7. Cliente ve tiempo estimado de llegada
8. Seguimiento en tiempo real
9. Servicio completado
10. Cliente valora el servicio
```

**Tecnologías:**
- React Native 0.79.2
- Expo ~53.0.9
- Zustand (estado)
- React Navigation
- React Native Maps + Expo Maps
- Expo Location

---

## 🔄 Flujos de Comunicación

### **Emergencias en Tiempo Real**

```
1. VETYA (Cliente)
   └─► Solicita emergencia con ubicación GPS
        └─► BACKEND
             ├─► Guarda en MongoDB
             ├─► Busca prestadores disponibles cercanos
             └─► Envía notificación
                  └─► VETPRESTA (Prestador)
                       ├─► Recibe notificación
                       ├─► Ve detalles en mapa
                       └─► Acepta/Rechaza
                            └─► BACKEND actualiza estado
                                 └─► VETYA recibe actualización
                                      └─► Cliente ve veterinario asignado
```

### **Agendamiento de Citas**

```
1. VETYA (Cliente)
   └─► Busca prestador
        └─► Selecciona fecha/hora disponible
             └─► BACKEND
                  ├─► Verifica disponibilidad
                  ├─► Crea cita (estado: Pendiente)
                  └─► Notifica
                       └─► VETPRESTA (Prestador)
                            ├─► Ve cita pendiente
                            └─► Confirma/Rechaza
                                 └─► BACKEND actualiza
                                      └─► VETYA notifica cliente
```

### **Validación de Prestadores**

```
1. VETPRESTA (Prestador)
   └─► Completa registro
        └─► Sube documentos a Cloudinary
             └─► BACKEND guarda referencias
                  └─► PANEL ADMIN (Web)
                       ├─► Admin revisa documentos
                       ├─► Aprueba/Rechaza/Solicita correcciones
                       └─► BACKEND actualiza estado
                            └─► VETPRESTA recibe actualización
                                 └─► Si aprobado → Acceso completo
```

---

## 🗄️ Base de Datos (MongoDB)

### **Colecciones Principales:**

| Colección | Descripción | Relaciones |
|-----------|-------------|------------|
| `users` | Usuarios/Clientes | → mascotas, emergencias, citas |
| `prestadors` | Prestadores de servicios | → validacion, servicios, citas |
| `prestadorvalidacions` | Validaciones de prestadores | → prestador, documentos |
| `mascotas` | Mascotas de usuarios | → dueno (user), historial |
| `citas` | Citas agendadas | → cliente, prestador, mascota |
| `emergencias` | Emergencias veterinarias | → cliente, mascota, veterinario |
| `servicios` | Catálogo de servicios | → prestadores |
| `disponibilidads` | Horarios de prestadores | → prestador |
| `pagos` | Transacciones | → usuario, prestador |
| `valoracions` | Reseñas y calificaciones | → cliente, prestador |
| `notificacions` | Sistema de notificaciones | → destinatario |
| `consejodesaluds` | Consejos de salud | - |

---

## 🔐 Sistema de Autenticación

### **Flujo Unificado:**

```javascript
// AMBAS APPS (vetya y vetpresta)
1. Login con email/password
2. Backend valida credenciales
3. Genera JWT con payload: { userId, userType: 'cliente' o 'prestador' }
4. Apps guardan token en AsyncStorage
5. Axios interceptor añade token automáticamente a cada request
6. Backend middleware valida token en rutas protegidas
7. Si token expira (401) → Logout automático en apps
```

### **Control de Acceso (vetpresta):**
```javascript
// Estado de validación controla acceso a funcionalidades
- pendiente_documentos → Solo pantallas de validación
- en_revision → Solo pantallas de validación
- requiere_correccion → Puede subir documentos corregidos
- aprobado → Acceso completo a todas las funcionalidades
- rechazado → Pantalla de bloqueo con mensaje
```

---

## 🌐 APIs Principales

### **Base URL**: `http://localhost:5000/api`

| Ruta | Descripción | Apps que consumen |
|------|-------------|-------------------|
| `/auth/*` | Login, registro, recuperación | vetya, vetpresta |
| `/users/*` | Gestión de usuarios | vetya |
| `/prestadores/*` | Gestión de prestadores | vetya, vetpresta |
| `/validacion/*` | Sistema de validación | vetpresta, panel admin |
| `/mascotas/*` | Gestión de mascotas | vetya |
| `/citas/*` | Sistema de citas | vetya, vetpresta |
| `/emergencias/*` | Sistema de emergencias | vetya, vetpresta |
| `/servicios/*` | Catálogo de servicios | vetya, vetpresta |
| `/disponibilidad/*` | Horarios | vetya, vetpresta |
| `/valoraciones/*` | Reseñas | vetya, vetpresta |
| `/notificaciones/*` | Notificaciones | vetya, vetpresta |
| `/consejos-salud/*` | Tips de salud | vetya |

---

## 🚀 Cómo Ejecutar el Sistema Completo

### **1. Backend**
```bash
cd backend
npm install
# Configurar .env con MongoDB URI, JWT_SECRET, Cloudinary, etc.
npm run dev
# Servidor en http://localhost:5000
# Panel admin en http://localhost:5000/admin
```

### **2. App de Prestadores (vetpresta)**
```bash
cd vetpresta
npm install
npm start
# Escanear QR con Expo Go
# O ejecutar en emulador: npm run android / npm run ios
```

### **3. App de Clientes (vetya)**
```bash
cd vetya
npm install
npm start
# Escanear QR con Expo Go
# O ejecutar en emulador: npm run android / npm run ios
```

---

## 📋 Variables de Entorno Requeridas

### **Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vetya
JWT_SECRET=tu_secreto_jwt_super_seguro
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### **Apps Móviles**
```javascript
// Configurar baseURL en config/axios.js
const BASE_URL = 'http://TU_IP_LOCAL:5000/api';
// NO usar localhost en apps móviles, usar IP de tu máquina
```

---

## 🔧 Scripts Útiles

### **Backend**
```bash
npm run dev              # Desarrollo con nodemon
node createAdmin.js      # Crear usuario admin inicial
```

### **Apps Móviles**
```bash
npm start                # Iniciar Expo
npm run android          # Ejecutar en Android
npm run ios              # Ejecutar en iOS
expo start -c            # Limpiar caché y ejecutar
```

---

## 🎯 Características Principales del Sistema

### **Para Clientes (vetya):**
- ✅ Emergencias veterinarias urgentes con GPS
- ✅ Seguimiento en tiempo real de veterinarios
- ✅ Agendamiento de citas por calendario
- ✅ Gestión completa de mascotas
- ✅ Búsqueda de prestadores con filtros
- ✅ Valoraciones y reseñas
- ✅ Consejos de salud para mascotas
- ✅ Historial de servicios

### **Para Prestadores (vetpresta):**
- ✅ Recepción de emergencias cercanas
- ✅ Gestión de citas agendadas
- ✅ Sistema de validación profesional
- ✅ Configuración de disponibilidad
- ✅ Dashboard con estadísticas
- ✅ Gestión de perfil profesional
- ✅ Sistema de reseñas
- ✅ Notificaciones push

### **Para Administradores (panel web):**
- ✅ Validación de prestadores
- ✅ Revisión de documentos
- ✅ Gestión de prestadores
- ✅ Monitoreo de emergencias
- ✅ Gestión de citas
- ✅ Dashboard con métricas
- ✅ Control completo del sistema

---

## 🔒 Seguridad

- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **Cloudinary** para almacenamiento seguro de documentos
- **Middleware** de validación en rutas protegidas
- **Control de acceso** por estado de validación
- **Limpieza automática** de tokens expirados
- **CORS** configurado apropiadamente
- **Validación** de datos en frontend y backend

---

## 📊 Geolocalización

### **Sistema de Privacidad:**
- **Radio de privacidad de 1km** para ubicaciones de prestadores
- Distancias calculadas nunca muestran menos de 1km
- Tiempos estimados basados en velocidad urbana (30km/h)
- Coordenadas exactas solo visibles para servicios activos

### **Tecnología:**
- Expo Location para obtener coordenadas
- MongoDB GeoJSON para búsquedas por proximidad
- React Native Maps para visualización
- Cálculo de rutas y tiempos estimados

---

## 📝 Mejores Prácticas del Proyecto

### **Arquitectura:**
1. **Separación clara** de responsabilidades (backend, apps)
2. **Instancia única de axios** con interceptores automáticos
3. **Zustand** para estado global en apps móviles
4. **AsyncStorage** para persistencia local
5. **Modelos de MongoDB** bien estructurados
6. **Rutas API** organizadas por dominio

### **Código:**
1. **Documentación detallada** en cada carpeta
2. **Nombres descriptivos** de variables y funciones
3. **Manejo de errores** consistente
4. **Logs informativos** para debugging
5. **Validaciones** en frontend y backend
6. **Componentes reutilizables** en apps móviles

---

## 🐛 Troubleshooting Común

### **Problema: Error 401 "No se proporcionó un token"**
**Solución**: Verificar que se esté usando `config/axios.js` (NO `axios` directo)

### **Problema: Emergencias no se asignan**
**Solución**: Verificar que prestadores tengan `disponibleEmergencias: true` y coordenadas válidas

### **Problema: Documentos no se suben**
**Solución**: Verificar configuración de Cloudinary y tokens de autenticación

### **Problema: App no conecta con backend**
**Solución**: Usar IP de la máquina en lugar de localhost en apps móviles

### **Problema: Prestador de servicio de tipo (veterinario) del lado del cliente (vetya) no le llegan las coordenadas de la ubicación actual del prestador al momento de ejecutar una emergencia**
**Solución**: Ejecutar la terminal de los tres archivos, analizar log y añadir las correcciones del lado del cliente al momento de pedir una emergencia: E:\vetya_1.0\vetya\src\screens\main\EmergencyVetMapScreen.js

---

## 📚 Documentación Adicional

Cada carpeta del proyecto tiene su propia documentación detallada:

- **Backend**: [`backend/ARQUITECTURA_BACKEND.md`](backend/ARQUITECTURA_BACKEND.md)
- **Vetpresta**: [`vetpresta/ARQUITECTURA_VETPRESTA.md`](vetpresta/ARQUITECTURA_VETPRESTA.md)
- **Vetya**: [`vetya/ARQUITECTURA_VETYA.md`](vetya/ARQUITECTURA_VETYA.md)

---

## 🎯 Roadmap Futuro

### **Funcionalidades Planeadas:**
- [ ] Sistema de pagos integrado (Stripe/MercadoPago)
- [ ] Chat en tiempo real entre clientes y prestadores
- [ ] Videoconsultas veterinarias
- [ ] Historial médico detallado de mascotas
- [ ] Sistema de recetas digitales
- [ ] Integración con farmacias veterinarias
- [ ] Programa de fidelización
- [ ] Notificaciones push avanzadas
- [ ] Dashboard de analytics para prestadores
- [ ] Sistema de referidos

---

## 👥 Estructura del Equipo Recomendada

- **Backend Developer**: Mantener API y panel admin
- **Mobile Developer (React Native)**: Mantener ambas apps
- **UI/UX Designer**: Diseño de interfaces
- **QA Tester**: Testing de flujos críticos
- **DevOps**: Deployment y CI/CD

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 📞 Soporte

Para cualquier duda o problema:
1. Revisar la documentación específica de cada carpeta
2. Verificar los logs del backend y las apps
3. Consultar las memorias del sistema guardadas

---

**Versión**: 1.0.0  
**Última actualización**: 2025-01-14  
**Estado**: En desarrollo activo

---

## 🎉 ¡Sistema Completo Documentado!

Ahora tienes una visión completa del sistema Vetya. Para trabajar en cualquier parte específica, consulta la documentación detallada de cada carpeta:

```
📘 Backend  → backend/ARQUITECTURA_BACKEND.md
📗 Vetpresta → vetpresta/ARQUITECTURA_VETPRESTA.md
📙 Vetya    → vetya/ARQUITECTURA_VETYA.md
```

¡Happy coding! 🚀
