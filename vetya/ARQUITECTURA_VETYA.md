# 📱 ARQUITECTURA VETYA - APP DE CLIENTES

## 📋 Descripción General
Aplicación móvil construida con **React Native + Expo** para clientes/usuarios que necesitan servicios veterinarios para sus mascotas. Es el lado del cliente en el sistema tipo "Uber" para emergencias y citas veterinarias.

---

## 🎯 Propósito
App móvil para que los **clientes/usuarios** puedan:
- **Solicitar emergencias veterinarias** en tiempo real con ubicación GPS
- **Agendar citas** con veterinarios y centros veterinarios
- **Gestionar mascotas** (perfiles, historial médico)
- **Buscar prestadores** por ubicación, especialidad, valoraciones
- **Ver consejos de salud** para tus mascotas
- **Valorar servicios** recibidos
- **Ver historial** de emergencias y citas
- **Recibir notificaciones** de estado de servicios

---

## 📁 Estructura de Carpetas

```
vetya/
├── src/
│   ├── screens/                 # 📱 PANTALLAS (4 grupos principales)
│   │   ├── auth/                # Autenticación
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   │
│   │   ├── main/                # Pantallas principales (17 pantallas)
│   │   │   ├── HomeScreen.js                   # Dashboard principal
│   │   │   ├── EmergencyFormScreen.js          # Solicitar emergencia
│   │   │   ├── EmergencyVetMapScreen.js        # Mapa de vets cercanos
│   │   │   ├── EmergencyConfirmationScreen.js  # Confirmación de emergencia
│   │   │   ├── EmergencyDetailScreen.js        # Detalle de emergencia activa
│   │   │   ├── AgendarCitaScreen.js            # Agendar nueva cita
│   │   │   ├── CitaConfirmacionScreen.js       # Confirmación de cita
│   │   │   ├── AppointmentsScreen.js           # Listado de citas
│   │   │   ├── ConsultaGeneralScreen.js        # Consulta general/chat
│   │   │   ├── ConsultaConfirmacionScreen.js   # Confirmación consulta
│   │   │   ├── PetsScreen.js                   # Gestión de mascotas
│   │   │   ├── PetDetailScreen.js              # Detalle de mascota
│   │   │   ├── VetDetailScreen.js              # Búsqueda de veterinarios
│   │   │   ├── PrestaDetailsScreen.js          # Detalle de prestador
│   │   │   ├── HealthTipsScreen.js             # Consejos de salud
│   │   │   ├── HealthTipDetailScreen.js        # Detalle de consejo
│   │   │   └── ProfileScreen.js                # Perfil de usuario
│   │   │
│   │   ├── profile/             # Perfil y configuración
│   │   │   ├── EditProfileScreen.js
│   │   │   └── SettingsScreen.js
│   │   │
│   │   └── onboarding/          # Bienvenida
│   │       └── OnboardingScreen.js
│   │
│   ├── store/                   # 🗄️ ZUSTAND STORES (8 stores)
│   │   ├── useAuthStore.js              # Autenticación y usuario
│   │   ├── usePetStore.js               # Mascotas
│   │   ├── useEmergencyStore.js         # Emergencias
│   │   ├── useCitaStore.js              # Citas
│   │   ├── usePrestadoresStore.js       # Prestadores/búsqueda
│   │   ├── useValoracionesStore.js      # Valoraciones
│   │   ├── useConsultaGeneralStore.js   # Consultas generales
│   │   └── useCountPacientesStore.js    # Contador de pacientes
│   │
│   ├── services/                # 🌐 SERVICIOS API (6 archivos)
│   │   ├── api.js                       # Servicios principales
│   │   ├── citaService.js               # APIs de citas
│   │   ├── prestadoresService.js        # APIs de prestadores
│   │   ├── valoracionesService.js       # APIs de valoraciones
│   │   ├── consultaGeneralService.js    # APIs de consultas
│   │   └── countPacientesService.js     # APIs de estadísticas
│   │
│   ├── config/                  # ⚙️ CONFIGURACIÓN
│   │   └── axios.js                     # Instancia de axios con interceptores
│   │
│   ├── navigation/              # 🧭 NAVEGACIÓN
│   │   └── AppNavigator.js              # Navegación principal
│   │
│   ├── components/              # 🧩 COMPONENTES REUTILIZABLES
│   │   ├── EmergencyCard.js
│   │   ├── AppointmentCard.js
│   │   ├── PetCard.js
│   │   ├── VetCard.js
│   │   └── ... (otros componentes)
│   │
│   ├── context/                 # 🔄 CONTEXTOS
│   │   └── ThemeContext.js
│   │
│   └── assets/                  # 🖼️ RECURSOS
│       ├── images/
│       └── icons/
│
├── App.js                       # 🚀 Punto de entrada
├── index.js                     # Registro de la app
├── app.json                     # Configuración de Expo
└── package.json                 # Dependencias
```

---

## 🔑 Tecnologías Principales

| Tecnología | Propósito |
|------------|-----------|
| **React Native 0.79.2** | Framework móvil multiplataforma |
| **Expo ~53.0.9** | Plataforma de desarrollo |
| **React Navigation 7.x** | Navegación entre pantallas |
| **Zustand 5.0.4** | Gestión de estado global |
| **Axios 1.9.0** | Cliente HTTP para APIs |
| **AsyncStorage 2.1.2** | Almacenamiento persistente local |
| **React Native Maps 1.24.3** | Mapas para emergencias |
| **Expo Maps 0.10.0** | Componentes de mapas (alternativa) |
| **Expo Location 18.1.5** | Geolocalización |
| **Expo Image Picker 16.1.4** | Selección de imágenes para mascotas |
| **date-fns 4.1.0** | Manejo de fechas |

---

## 🗄️ Arquitectura de Estado (Zustand Stores)

### **1. useAuthStore** - Autenticación
```javascript
Estado:
- isLoggedIn: boolean
- token: string
- user: objeto del usuario autenticado
- isLoading: boolean
- error: string

Acciones:
- login(email, password)
- register(userData)
- logout()
- checkAuth()
- updateUser(userData)
```

### **2. usePetStore** - Mascotas
```javascript
Estado:
- pets: array de mascotas
- currentPet: mascota seleccionada
- isLoading: boolean
- error: string

Acciones:
- fetchPets(userId)
- createPet(petData)
- updatePet(petId, petData)
- deletePet(petId)
- selectPet(pet)
```

### **3. useEmergencyStore** - Emergencias
```javascript
Estado:
- emergencias: array
- emergenciaActual: objeto
- veterinariosDisponibles: array
- isLoading: boolean
- ubicacionActual: objeto

Acciones:
- createEmergencia(emergenciaData)
- fetchEmergenciasByUser(userId)
- fetchEmergenciaById(id)
- fetchVeterinariosDisponibles(ubicacion)
- cancelEmergencia(id)
- seguirEmergencia(id)
```

### **4. useCitaStore** - Citas
```javascript
Estado:
- citas: array
- citaActual: objeto
- isLoading: boolean

Acciones:
- createCita(citaData)
- fetchCitasByCliente(clienteId)
- fetchCitaById(id)
- cancelCita(id, motivo)
- getDashboardSummary(clienteId)
```

### **5. usePrestadoresStore** - Búsqueda de Prestadores
```javascript
Estado:
- prestadores: array
- prestadorSeleccionado: objeto
- filtros: objeto (especialidad, ubicación, etc.)
- isLoading: boolean

Acciones:
- fetchPrestadores(filtros)
- searchPrestadores(query)
- fetchPrestadorById(id)
- fetchDisponibilidad(prestadorId, fecha)
```

### **6. useValoracionesStore** - Valoraciones
```javascript
Estado:
- valoraciones: array
- isLoading: boolean

Acciones:
- createValoracion(valoracionData)
- fetchValoracionesByPrestador(prestadorId)
- updateValoracion(valoracionId, data)
- deleteValoracion(valoracionId)
```

### **7. useConsultaGeneralStore** - Consultas
```javascript
Estado:
- consultas: array
- consultaActual: objeto
- isLoading: boolean

Acciones:
- createConsulta(consultaData)
- fetchConsultas(userId)
- updateEstadoConsulta(consultaId, estado)
```

---

## 🌐 Servicios API

### **api.js** - Servicios Principales
```javascript
// Autenticación
- authService.login(email, password)
- authService.register(userData)

// Mascotas
- petService.getAll(userId)
- petService.create(petData)
- petService.update(petId, petData)
- petService.delete(petId)

// Emergencias
- emergencyService.create(emergenciaData)
- emergencyService.getByUser(userId)
- emergencyService.getById(id)
- emergencyService.getVeterinariosDisponibles(ubicacion)
- emergencyService.cancel(id)

// Prestadores
- prestadorService.search(filtros)
- prestadorService.getById(id)
- prestadorService.getDisponibilidad(prestadorId, fecha)

// Consejos de salud
- healthTipsService.getAll()
- healthTipsService.getById(id)
```

### **citaService.js** - Servicios de Citas
```javascript
- citaService.create(citaData)
- citaService.getByCliente(clienteId)
- citaService.getById(id)
- citaService.cancel(id, motivo)
- citaService.getDashboardSummary(clienteId)
```

### **valoracionesService.js** - Servicios de Valoraciones
```javascript
- valoracionService.create(valoracionData)
- valoracionService.getByPrestador(prestadorId)
- valoracionService.update(valoracionId, data)
- valoracionService.delete(valoracionId)
```

---

## 🧭 Sistema de Navegación

### **AppNavigator.js**
```javascript
// Stack Navigator Principal
- OnboardingScreen (primera vez)
- AuthStack (Login, Register)
- MainTabs (si está autenticado)

// MainTabs (Bottom Tabs)
- Home Tab → HomeScreen
- Mascotas Tab → PetsScreen
- Emergencias Tab → (Acceso rápido a emergencias)
- Perfil Tab → ProfileScreen

// Stack Adicionales
- EmergencyStack (EmergencyForm, EmergencyMap, EmergencyConfirmation, EmergencyDetail)
- AppointmentStack (AgendarCita, AppointmentsList, AppointmentDetail)
- PetStack (PetsList, PetDetail, AddPet, EditPet)
- SearchStack (VetDetail, PrestaDetails)
```

---

## 🔄 Flujos Principales

### **1. Solicitud de Emergencia**
```
1. Cliente abre "Solicitar Emergencia"
2. Selecciona mascota afectada
3. Describe síntomas y gravedad
4. Sistema obtiene ubicación GPS
5. Busca veterinarios disponibles cercanos
6. Muestra mapa con veterinarios (con radio de privacidad de 1km)
7. Sistema asigna automáticamente al más cercano o permite selección
8. Veterinario recibe notificación
9. Cliente ve tiempo estimado de llegada
10. Puede seguir en mapa la ubicación del veterinario
11. Al completarse, cliente valora el servicio
```

### **2. Agendamiento de Cita**
```
1. Cliente busca prestador por:
   - Ubicación cercana
   - Especialidad
   - Valoraciones
2. Selecciona prestador
3. Ve perfil completo (servicios, horarios, reseñas)
4. Selecciona fecha y hora disponible
5. Selecciona mascota y servicio
6. Describe motivo de consulta
7. Confirma cita
8. Prestador recibe notificación
9. Prestador confirma/rechaza
10. Cliente recibe confirmación
11. Cliente puede cancelar hasta 24h antes
12. Al completarse, cliente valora el servicio
```

### **3. Gestión de Mascotas**
```
1. Cliente accede a "Mis Mascotas"
2. Ve lista de mascotas registradas
3. Puede agregar nueva mascota:
   - Foto, nombre, especie
   - Raza, edad, sexo
   - Información médica
4. Puede editar información de mascota existente
5. Ve historial de citas y emergencias de cada mascota
6. Puede eliminar mascota (requiere confirmación)
```

### **4. Búsqueda de Prestadores**
```
1. Cliente accede a búsqueda
2. Aplica filtros:
   - Ubicación (radio en km)
   - Especialidad
   - Calificación mínima
   - Disponibilidad
3. Ve lista de resultados con:
   - Foto, nombre, tipo
   - Especialidades
   - Distancia
   - Calificación promedio
4. Puede ver perfil completo
5. Puede agendar cita directamente
```

### **5. Consulta General**
```
1. Cliente solicita consulta general
2. Selecciona tipo (chat o llamada)
3. Describe consulta
4. Sistema busca prestador disponible
5. Se establece conexión
6. Cliente recibe atención
7. Puede valorar el servicio
```

---

## 🔐 Sistema de Autenticación

### **Flujo de Auth**
```javascript
1. Login → Backend devuelve JWT + datos de user
2. Token se guarda en AsyncStorage (clave: 'auth-storage')
3. Axios interceptor añade token automáticamente a requests
4. checkAuth() al iniciar app para mantener sesión
5. Si token expira (401) → Logout automático
```

### **Almacenamiento**
```javascript
AsyncStorage:
- 'auth-storage': { state: { token, user, isLoggedIn } }
- Zustand persiste automáticamente con middleware
```

---

## 📱 Pantallas Principales

### **HomeScreen** - Dashboard Principal
- Tarjetas de acceso rápido:
  - 🚨 Solicitar Emergencia
  - 📅 Agendar Cita
  - 💬 Consulta General
- Próximas citas agendadas
- Consejos de salud destacados
- Acceso rápido a mascotas
- Banner promocional (si aplica)

### **EmergencyFormScreen** - Solicitar Emergencia
- Selección de mascota
- Campos de descripción de síntomas
- Selector de gravedad (leve/moderada/grave)
- Ubicación automática con GPS
- Vista previa de datos antes de enviar
- Botón de confirmación

### **EmergencyVetMapScreen** - Mapa de Veterinarios
- Mapa interactivo con ubicación del cliente
- Marcadores de veterinarios disponibles cercanos
- Radio de privacidad de 1km para ubicaciones
- Información de cada veterinario (nombre, distancia, tiempo estimado)
- Botón para confirmar veterinario seleccionado

### **EmergencyDetailScreen** - Seguimiento de Emergencia
- Estado actual (Solicitada/Aceptada/En camino/En atención/Completada)
- Información de la mascota
- Datos del veterinario asignado
- Mapa con ubicación en tiempo real
- Tiempo estimado de llegada
- Botón de cancelación (si aplica)
- Chat/llamada con veterinario

### **AgendarCitaScreen** - Agendar Cita
- Búsqueda de prestador
- Calendario con horarios disponibles
- Selección de mascota
- Selección de servicio
- Campo de motivo de consulta
- Resumen y confirmación

### **AppointmentsScreen** - Mis Citas
- Tabs: Próximas / Historial
- Tarjetas con información de cita:
  - Fecha y hora
  - Prestador
  - Mascota
  - Servicio
  - Estado
- Filtros por fecha/estado
- Acciones: Ver detalle / Cancelar

### **PetsScreen** - Mis Mascotas
- Grid de tarjetas de mascotas con fotos
- Información básica (nombre, especie, edad)
- Botón flotante para agregar nueva mascota
- Acceso rápido a historial médico
- Opciones de editar/eliminar

### **VetDetailScreen** - Búsqueda y Filtros
- Barra de búsqueda
- Filtros avanzados:
  - Ubicación (slider de radio)
  - Especialidad (checkboxes)
  - Calificación (estrellas)
  - Disponibilidad (toggle)
- Lista de resultados con ordenamiento
- Vista de mapa alternativamente

### **PrestaDetailsScreen** - Detalle de Prestador
- Foto de perfil y portada
- Nombre, tipo, especialidades
- Calificación promedio y número de reseñas
- Ubicación y radio de atención
- Servicios ofrecidos con precios
- Horarios de atención
- Galería de fotos
- Reseñas de clientes
- Botón "Agendar Cita"

### **HealthTipsScreen** - Consejos de Salud
- Grid de tarjetas con tips
- Categorías (Nutrición, Cuidados, Prevención, etc.)
- Búsqueda por palabra clave
- Tarjetas con imagen, título y preview
- Acceso a detalle completo

---

## 🔔 Sistema de Notificaciones

### **Tipos de Notificaciones**
```javascript
- Emergencia aceptada por veterinario
- Veterinario en camino (actualización de ETA)
- Cita confirmada por prestador
- Recordatorio de cita (24h antes)
- Cita cancelada por prestador
- Solicitud de valoración
- Nuevo consejo de salud disponible
```

---

## 🗺️ Sistema de Geolocalización

### **Expo Location**
```javascript
Funcionalidades:
- Obtención de ubicación actual
- Permisos de ubicación
- Seguimiento en tiempo real (para emergencias)
- Cálculo de distancias
- Búsqueda por radio

Privacidad:
- Radio de privacidad de 1km para ubicaciones de veterinarios
- Distancias mínimas de 1km mostradas
- Tiempos calculados basados en velocidad urbana promedio (30km/h)
```

---

## 🎨 Características de UX/UI

### **Diseño**
- Interfaz moderna y limpia
- Paleta de colores amigable
- Iconos de Expo Vector Icons
- Tarjetas con sombras y bordes redondeados
- Animaciones suaves de transición

### **Accesibilidad**
- Contraste adecuado de colores
- Tamaños de fuente ajustables
- Botones con área táctil suficiente
- Mensajes de error claros

### **Feedback Visual**
- Loading indicators en requests
- Mensajes de éxito/error
- Confirmaciones antes de acciones destructivas
- Estados de carga para imágenes

---

## 📦 Dependencias Clave

```json
{
  "react-native": "0.79.2",
  "expo": "~53.0.9",
  "@react-navigation/native": "^7.1.9",
  "@react-navigation/stack": "^7.3.2",
  "@react-navigation/bottom-tabs": "^7.3.13",
  "zustand": "^5.0.4",
  "axios": "^1.9.0",
  "@react-native-async-storage/async-storage": "^2.1.2",
  "react-native-maps": "^1.24.3",
  "expo-maps": "~0.10.0",
  "expo-location": "^18.1.5",
  "expo-image-picker": "^16.1.4",
  "date-fns": "^4.1.0"
}
```

---

## 🚀 Comandos de Ejecución

```bash
# Iniciar en desarrollo
npm start

# Android
npm run android

# iOS
npm run ios

# Web (limitado)
npm run web

# Limpiar caché
expo start -c
```

---

## 🔗 Conexión con Backend

- **Base URL**: Configurada en `config/axios.js`
- **Todas las APIs** consumen endpoints del backend
- **Token JWT** se envía automáticamente en headers
- **Manejo de errores** centralizado en interceptores

---

## 🐛 Debugging

### **Logs importantes**
```javascript
- Requests/responses de axios (activado en desarrollo)
- Errores de geolocalización
- Errores de autenticación
- Estados de emergencias en tiempo real
```

### **Herramientas**
```javascript
- React Native Debugger
- Expo DevTools
- Console.log en pantallas críticas
```

---

## 📝 Notas Importantes

1. **Geolocalización Esencial**: La ubicación es crítica para el funcionamiento del sistema de emergencias
2. **Radio de Privacidad**: Se aplica un buffer de 1km a todas las ubicaciones de prestadores
3. **Estados en Tiempo Real**: Las emergencias se actualizan en tiempo real
4. **Validación de Mascotas**: Se requiere al menos una mascota registrada para solicitar servicios
5. **Sistema de Valoraciones**: Se solicita automáticamente después de completar servicios
6. **Cancelaciones**: Las citas pueden cancelarse hasta 24h antes sin penalización
7. **Expo Maps vs React Native Maps**: Expo Maps requiere development build, se usa React Native Maps en Expo Go

---

## 🔄 Flujo Completo del Sistema

```
CLIENTE (vetya) ←→ BACKEND (API REST) ←→ PRESTADOR (vetpresta)
       ↓                    ↓                       ↓
   Emergencias         MongoDB                Emergencias
   Citas              Base de Datos            Citas
   Mascotas           Notificaciones          Validación
   Búsqueda           Pagos                   Disponibilidad
   Valoraciones       Geolocalización         Servicios
```

---

**Última actualización**: 2025-01-14
**Versión**: 1.0.0
**Plataforma**: iOS y Android
