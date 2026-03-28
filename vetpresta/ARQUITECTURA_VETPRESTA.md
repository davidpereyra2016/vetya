# 📱 ARQUITECTURA VETPRESTA - APP DE PRESTADORES

## 📋 Descripción General
Aplicación móvil construida con **React Native + Expo** para prestadores de servicios veterinarios (veterinarios individuales y centros veterinarios). Permite gestionar emergencias, citas, perfil profesional, disponibilidad y validación administrativa.

---

## 🎯 Propósito
App móvil para que los **prestadores de servicios veterinarios** puedan:
- **Recibir y gestionar emergencias** asignadas en tiempo real
- **Gestionar citas** agendadas por clientes
- **Completar proceso de validación** profesional
- **Configurar disponibilidad** y horarios de atención
- **Ver reseñas** y calificaciones de clientes
- **Gestionar su perfil** profesional
- **Recibir notificaciones** de nuevas solicitudes
- **Ver ganancias** y estadísticas

---

## 📁 Estructura de Carpetas

```
vetpresta/
├── src/
│   ├── screens/                 # 📱 PANTALLAS (12 grupos)
│   │   ├── auth/                # Autenticación
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── ForgotPasswordScreen.js
│   │   │   └── ResetPasswordScreen.js
│   │   │
│   │   ├── main/                # Pantallas principales
│   │   │   ├── HomeScreen.js           # Dashboard principal
│   │   │   └── ProfileScreen.js        # Perfil del prestador
│   │   │
│   │   ├── validation/          # Sistema de validación profesional
│   │   │   ├── ValidationDashboardScreen.js
│   │   │   ├── AdditionalDataScreen.js
│   │   │   ├── DocumentUploadScreen.js
│   │   │   └── ValidationBlockScreen.js
│   │   │
│   │   ├── emergency/           # Gestión de emergencias
│   │   │   ├── EmergencyListScreen.js
│   │   │   ├── EmergencyDetailScreen.js
│   │   │   └── EmergencyMapScreen.js
│   │   │
│   │   ├── appointments/        # Gestión de citas
│   │   │   ├── AppointmentListScreen.js
│   │   │   └── AppointmentDetailScreen.js
│   │   │
│   │   ├── availability/        # Configuración de horarios
│   │   │   ├── AvailabilityScreen.js
│   │   │   └── EditAvailabilityScreen.js
│   │   │
│   │   ├── services/            # Servicios ofrecidos
│   │   │   └── ServicesScreen.js
│   │   │
│   │   ├── reviews/             # Reseñas y valoraciones
│   │   │   └── ReviewsScreen.js
│   │   │
│   │   ├── earnings/            # Ganancias
│   │   │   └── EarningsScreen.js
│   │   │
│   │   ├── profile/             # Perfil y configuración
│   │   │   ├── EditProfileScreen.js
│   │   │   └── SettingsScreen.js
│   │   │
│   │   ├── onboarding/          # Bienvenida
│   │   │   └── WelcomeScreen.js
│   │   │
│   │   ├── splash/              # Splash inicial
│   │   │   └── SplashScreen.js
│   │   │
│   │   └── NotificacionesScreen.js  # Centro de notificaciones
│   │
│   ├── store/                   # 🗄️ ZUSTAND STORES (9 stores)
│   │   ├── useAuthStore.js             # Autenticación y usuario
│   │   ├── usePrestadorStore.js        # Datos del prestador
│   │   ├── useValidacionStore.js       # Estado de validación
│   │   ├── useEmergencyStore.js        # Emergencias
│   │   ├── useCitaStore.js             # Citas
│   │   ├── useDisponibilidadStore.js   # Disponibilidad
│   │   ├── useServiceStore.js          # Servicios
│   │   ├── useNotificacionStore.js     # Notificaciones
│   │   └── usePetStore.js              # Mascotas (referencia)
│   │
│   ├── services/                # 🌐 SERVICIOS API (8 archivos)
│   │   ├── api.js                      # Servicios principales y auth
│   │   ├── prestadorService.js         # APIs de prestadores
│   │   ├── citaService.js              # APIs de citas
│   │   ├── emergenciaService.js        # APIs de emergencias
│   │   ├── validacionService.js        # APIs de validación
│   │   ├── authService.js              # APIs de autenticación
│   │   ├── axiosInstance.js            # Instancia legacy de axios
│   │   └── notificacionService.js      # APIs de notificaciones
│   │
│   ├── config/                  # ⚙️ CONFIGURACIÓN
│   │   └── axios.js                    # Instancia principal con interceptores
│   │
│   ├── navigation/              # 🧭 NAVEGACIÓN
│   │   └── AppNavigator.js             # Navegación principal (Stack + Tabs)
│   │
│   ├── components/              # 🧩 COMPONENTES REUTILIZABLES
│   │   ├── ValidationStatusBanner.js   # Banner de estado de validación
│   │   ├── AppointmentCard.js          # Tarjeta de cita
│   │   ├── EmergencyCard.js            # Tarjeta de emergencia
│   │   ├── ServiceItem.js              # Item de servicio
│   │   ├── ReviewCard.js               # Tarjeta de reseña
│   │   └── ... (otros componentes)
│   │
│   ├── context/                 # 🔄 CONTEXTOS
│   │   └── NotificationContext.js
│   │
│   ├── styles/                  # 🎨 ESTILOS
│   │   └── theme.js
│   │
│   ├── utils/                   # 🛠️ UTILIDADES
│   │   └── helpers.js
│   │
│   ├── data/                    # 📊 DATOS ESTÁTICOS
│   │   └── mockData.js
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
| **React Native Maps 1.20.1** | Mapas para emergencias |
| **Expo Location 18.1.5** | Geolocalización |
| **Expo Image Picker 16.1.4** | Selección de imágenes |
| **Expo Document Picker 13.1.6** | Selección de documentos |
| **Expo Notifications 0.31.2** | Notificaciones push |
| **DateTimePicker 8.3.0** | Selector de fecha/hora |
| **date-fns 4.1.0** | Manejo de fechas |

---

## 🗄️ Arquitectura de Estado (Zustand Stores)

### **1. useAuthStore** - Autenticación
```javascript
Estado:
- isLoggedIn: boolean
- token: string
- user: objeto del usuario autenticado
- provider: objeto del prestador
- isLoading: boolean
- error: string

Acciones:
- login(email, password)
- register(userData)
- logout()
- checkAuth()
- updateUser(userData)
- updateProvider(providerData)
```

### **2. useValidacionStore** - Sistema de Validación
```javascript
Estado:
- estadoValidacion: 'pendiente_documentos' | 'en_revision' | 'aprobado' | 'rechazado' | 'requiere_correccion'
- prestadorTipo: 'Veterinario' | 'Centro Veterinario'
- documentosRequeridos: array
- documentosSubidos: objeto
- datosAdicionales: objeto
- isLoading: boolean

Acciones:
- fetchEstadoValidacion()
- updateDatosAdicionales(datos)
- subirDocumento(tipo, archivo)
- eliminarDocumento(tipo)
- getDocumentosConErrores()
- initializeFromProvider(provider)
```

### **3. useEmergencyStore** - Emergencias
```javascript
Estado:
- emergencias: array
- emergenciaActual: objeto
- isLoading: boolean
- availableForEmergencies: boolean

Acciones:
- fetchEmergenciesByPrestador(prestadorId)
- fetchEmergencyById(id)
- updateEmergencyStatus(id, status)
- acceptEmergency(id, data)
- toggleAvailability()
```

### **4. useCitaStore** - Citas
```javascript
Estado:
- citas: array
- citaActual: objeto
- isLoading: boolean

Acciones:
- fetchCitasByPrestador(prestadorId, estado)
- fetchCitaById(id)
- updateCitaStatus(id, estado)
- confirmCita(id)
- rechazarCita(id, motivo)
```

### **5. useDisponibilidadStore** - Disponibilidad
```javascript
Estado:
- disponibilidades: array
- horariosBase: objeto
- isLoading: boolean

Acciones:
- fetchDisponibilidad(prestadorId, fechaInicio, fechaFin)
- updateHorarioBase(horarios)
- marcarNoDisponible(fecha, motivo)
```

### **6. useServiceStore** - Servicios
```javascript
Estado:
- servicios: array
- serviciosOfrecidos: array
- isLoading: boolean

Acciones:
- fetchServicios()
- fetchServiciosOfrecidos(prestadorId)
- updateServiciosOfrecidos(servicios)
```

### **7. useNotificacionStore** - Notificaciones
```javascript
Estado:
- notificaciones: array
- unreadCount: number
- isLoading: boolean

Acciones:
- fetchNotificaciones()
- markAsRead(id)
- markAllAsRead()
- deleteNotificacion(id)
```

---

## 🌐 Servicios API

### **api.js** - Servicios Principales
```javascript
// Autenticación
- authService.login(email, password)
- authService.register(userData)
- authService.forgotPassword(email)
- authService.resetPassword(token, password)

// Validación
- validacionService.getEstadoValidacion()
- validacionService.updateDatosAdicionales(datos)
- validacionService.subirDocumento(tipo, archivo)
- validacionService.eliminarDocumento(tipo)

// Prestadores
- prestadorService.getById(id)
- prestadorService.updateProfile(id, data)

// Citas
- citaService.getCitasByProvider(prestadorId, estado)
- citaService.updateCitaStatus(id, estado)

// Emergencias
- emergenciaService.getByPrestador(prestadorId)
- emergenciaService.updateStatus(id, status)
- emergenciaService.acceptEmergency(id, data)
```

### **axios.js** - Configuración de Axios
```javascript
// Interceptor de request: Añade token automáticamente
- Lee token desde AsyncStorage
- Añade header Authorization: Bearer <token>

// Interceptor de response: Maneja errores
- Detecta errores 401 (token expirado)
- Limpia AsyncStorage automáticamente
- Ejecuta callback de logout
```

---

## 🧭 Sistema de Navegación

### **AppNavigator.js**
```javascript
// Stack Navigator Principal
- SplashScreen
- AuthStack (Login, Register, ForgotPassword, ResetPassword)
- ValidationBlockScreen (si no está aprobado)
- MainTabs (si está aprobado)

// MainTabs (Bottom Tabs)
- Home Tab → HomeScreen
- Citas Tab → AppointmentListScreen
- Emergencias Tab → EmergencyListScreen
- Perfil Tab → ProfileScreen

// Stack Adicionales
- ValidationStack (ValidationDashboard, AdditionalData, DocumentUpload)
- EmergencyStack (EmergencyList, EmergencyDetail, EmergencyMap)
- AppointmentStack (AppointmentList, AppointmentDetail)
```

---

## 🔄 Flujos Principales

### **1. Onboarding y Validación**
```
1. Registro de prestador
2. Login exitoso
3. Sistema verifica estado de validación
4. Si no está aprobado → ValidationBlockScreen
5. Prestador completa:
   - Datos adicionales (matrícula, universidad, CUIT, etc.)
   - Subir documentos (cédula, diploma, constancia, etc.)
6. Admin revisa en panel web
7. Cuando se aprueba → Acceso completo a la app
```

### **2. Gestión de Emergencias**
```
1. Prestador activa "Disponible para emergencias"
2. Sistema envía notificación de emergencia cercana
3. Prestador ve detalles (ubicación, mascota, gravedad)
4. Acepta o rechaza emergencia
5. Si acepta:
   - Ve ruta en mapa
   - Actualiza estado (en camino, en atención, completada)
   - Cliente ve progreso en tiempo real
6. Al completar, espera valoración del cliente
```

### **3. Gestión de Citas**
```
1. Cliente agenda cita desde app vetya
2. Prestador recibe notificación
3. Prestador ve en "Citas Pendientes"
4. Revisa detalles (mascota, motivo, fecha/hora)
5. Confirma o rechaza la cita
6. Cliente recibe confirmación
7. Al completarse, actualiza estado
8. Cliente puede valorar el servicio
```

### **4. Configuración de Disponibilidad**
```
1. Prestador accede a AvailabilityScreen
2. Configura horarios base (Lun-Dom, inicio-fin)
3. Marca días específicos como no disponibles
4. Sistema usa estos datos para:
   - Sugerir horarios a clientes
   - Filtrar prestadores disponibles en emergencias
```

---

## 🔐 Sistema de Autenticación

### **Flujo de Auth**
```javascript
1. Login → Backend devuelve JWT + datos de user/provider
2. Token se guarda en AsyncStorage (clave: 'auth-storage')
3. Axios interceptor añade token automáticamente a requests
4. checkAuth() al iniciar app para mantener sesión
5. Si token expira (401) → Logout automático
```

### **Almacenamiento**
```javascript
AsyncStorage:
- 'auth-storage': { state: { token, user, provider, isLoggedIn } }
- Zustand persiste automáticamente con middleware
```

---

## 🚦 Control de Acceso por Estado de Validación

### **Estados y Restricciones**
| Estado | Acceso |
|--------|--------|
| **pendiente_documentos** | Solo ValidationStack |
| **en_revision** | Solo ValidationStack |
| **requiere_correccion** | Solo ValidationStack + puede subir docs |
| **aprobado** | Acceso completo |
| **rechazado** | ValidationBlockScreen con mensaje |

### **Lógica en AppNavigator**
```javascript
if (estadoValidacion !== 'aprobado') {
  return <ValidationBlockScreen />;
}
return <MainTabs />;
```

---

## 📱 Pantallas Principales

### **HomeScreen** - Dashboard
- Resumen de citas pendientes y confirmadas
- Emergencias asignadas (si es veterinario)
- Banner de estado de validación (si no está aprobado)
- Botón para activar/desactivar disponibilidad para emergencias
- Acceso rápido a funciones principales

### **ValidationDashboardScreen** - Estado de Validación
- Estado actual de validación con badge colorido
- Progreso de documentos (% completado)
- Lista de documentos requeridos con estados
- Observaciones del admin (si las hay)
- Botones de acción (completar datos, subir documentos)

### **DocumentUploadScreen** - Subir Documentos
- Lista de documentos requeridos por tipo de prestador
- Preview de documentos subidos
- Opciones: Cámara, Galería, Archivos
- Indicadores de estado (pendiente/aprobado/rechazado)
- Observaciones del admin si hay rechazos

### **EmergencyListScreen** - Listado de Emergencias
- Tabs: Asignadas / Historial
- Tarjetas con información de emergencia
- Filtros por estado
- Refresh para actualizar

### **AppointmentListScreen** - Listado de Citas
- Tabs: Pendientes / Confirmadas / Historial
- Calendario de citas
- Filtros y búsqueda
- Acciones rápidas (confirmar/rechazar)

---

## 🔔 Sistema de Notificaciones

### **Expo Notifications**
```javascript
Tipos de notificaciones:
- Nueva emergencia cercana
- Cita agendada por cliente
- Cita confirmada/cancelada
- Estado de validación actualizado
- Mensajes del admin
```

### **Gestión**
```javascript
- Push token se registra al login
- Notificaciones se guardan en BD
- useNotificacionStore gestiona estado
- NotificacionesScreen muestra historial
- Badge en tab con contador de no leídas
```

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
  "react-native-maps": "1.20.1",
  "expo-location": "~18.1.5",
  "expo-notifications": "^0.31.2",
  "expo-image-picker": "^16.1.4",
  "expo-document-picker": "~13.1.6",
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
- Estados de validación
- Errores de autenticación
- Actualizaciones de emergencias/citas
```

### **Herramientas**
```javascript
- React Native Debugger
- Expo DevTools
- Console.log en pantallas críticas
```

---

## 📝 Notas Importantes

1. **Instancia de Axios Unificada**: Siempre usar `config/axios.js` (NO `axios` directo)
2. **AsyncStorage**: Almacena token y datos de auth persistentemente
3. **Estado de Validación**: Controla acceso a funcionalidades principales
4. **Coordenadas**: Se usan para asignación de emergencias cercanas
5. **Refresh de Datos**: useFocusEffect se usa para refrescar al volver a pantallas
6. **Optimización**: Se evitan requests innecesarios cuando prestador ya está aprobado
7. **Deep Linking**: Configurado para recuperación de contraseña

---

**Última actualización**: 2025-01-14
**Versión**: 1.0.0
**Plataforma**: iOS y Android
