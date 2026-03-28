# Configuración de Notificaciones Push - VetPresta

## Resumen

Las notificaciones push permiten a los prestadores recibir alertas sobre:
- Nuevas emergencias asignadas
- Solicitudes de citas
- Confirmaciones y cancelaciones
- Recordatorios del sistema

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Backend       │────▶│  Firebase FCM   │────▶│   VetPresta     │
│   (Node.js)     │     │  (Push Server)  │     │   (React Native)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Archivos Modificados/Creados

### Backend
- `src/models/User.js` - Agregado campo `deviceToken`
- `src/routes/userRoutes.js` - Rutas para registrar/eliminar token
- `src/routes/notificacionRoutes.js` - Envío de notificaciones push

### Frontend (VetPresta)
- `App.js` - Inicialización de notificaciones
- `src/services/pushNotificationService.js` - Servicio de notificaciones
- `src/services/apiNotificacion.js` - API para tokens
- `src/store/useAuthStore.js` - Registro de token en login/logout
- `src/navigation/AppNavigator.js` - Manejo de navegación desde notificaciones
- `app.json` - Configuración de Expo Notifications

## Configuración para Producción

### 1. Firebase Cloud Messaging (FCM)

#### Android
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Agregar app Android con package name: `com.vetya.vetpresta`
3. Descargar `google-services.json` y colocarlo en `vetpresta/`
4. Configurar las credenciales en el backend

#### iOS
1. En Firebase Console, agregar app iOS con bundle ID: `com.vetya.vetpresta`
2. Descargar `GoogleService-Info.plist`
3. Configurar APNs (Apple Push Notification service):
   - Crear certificado de push en Apple Developer
   - Subir el certificado a Firebase

### 2. Variables de Entorno (Backend)

Agregar al archivo `.env`:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com
```

### 3. Configuración de Firebase en Backend

El archivo `backend/src/config/firebase.js` debe inicializar Firebase Admin:

```javascript
import admin from 'firebase-admin';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
```

### 4. Build de Producción

Para que las notificaciones funcionen completamente, necesitas crear un build de desarrollo o producción:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Crear build de desarrollo (para testing)
eas build --profile development --platform android

# Crear build de producción
eas build --profile production --platform android
```

## Flujo de Notificaciones

### Al iniciar sesión:
1. Usuario hace login
2. App solicita permisos de notificaciones
3. Si se otorgan, se obtiene el Expo Push Token
4. Token se envía al backend y se guarda en `User.deviceToken`

### Al recibir notificación:
1. Backend envía notificación via Firebase
2. Firebase entrega al dispositivo
3. Si app está en primer plano: se muestra alerta
4. Si app está en segundo plano: notificación del sistema
5. Al tocar la notificación: se navega a la pantalla correspondiente

### Al cerrar sesión:
1. Se elimina el `deviceToken` del servidor
2. El dispositivo deja de recibir notificaciones

## Pruebas en Desarrollo

### Limitaciones de Expo Go
- Las notificaciones push remotas NO funcionan en Expo Go desde SDK 53
- Para probar notificaciones completas, usa un development build

### Notificaciones Locales (para testing)
```javascript
import { sendLocalNotification } from './src/services/pushNotificationService';

// Enviar notificación de prueba
sendLocalNotification(
  '¡Nueva Emergencia!',
  'Un cliente necesita atención urgente',
  { tipo: 'Emergencia', emergenciaId: '123' }
);
```

## Tipos de Notificaciones

| Tipo | Descripción | Navegación |
|------|-------------|------------|
| `Emergencia` | Nueva emergencia asignada | ConfirmarEmergencia |
| `emergencia_asignada` | Emergencia asignada | ConfirmarEmergencia |
| `emergencia_confirmada` | Emergencia confirmada | EmergencyDetails |
| `emergencia_en_camino` | Veterinario en camino | EmergencyDetails |
| `Cita` | Nueva solicitud de cita | Appointments |
| `cita_confirmada` | Cita confirmada | Appointments |
| `cita_cancelada` | Cita cancelada | Appointments |

## Troubleshooting

### No se reciben notificaciones
1. Verificar que el dispositivo tiene conexión a internet
2. Verificar que se otorgaron permisos de notificaciones
3. Verificar que el `deviceToken` está guardado en la BD
4. Verificar logs del backend al enviar notificación

### Token no se registra
1. Verificar que no estás en Expo Go (usar development build)
2. Verificar que Firebase está configurado correctamente
3. Revisar logs de la app al iniciar sesión

### Notificación no navega correctamente
1. Verificar que la pantalla destino existe en el navegador
2. Revisar logs de `handleNotificationResponse`
3. Verificar que `global.pendingNotificationAction` se está procesando
