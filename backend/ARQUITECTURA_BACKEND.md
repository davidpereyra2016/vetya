# 🏗️ ARQUITECTURA DEL BACKEND - VETYA

## 📋 Descripción General
Backend API RESTful construido con **Node.js + Express + MongoDB** que gestiona toda la lógica de negocio para la plataforma Vetya. Sirve datos tanto a la aplicación móvil de clientes (`vetya`) como a la de prestadores (`vetpresta`).

---

## 🎯 Propósito
Servidor central que maneja:
- **Autenticación y autorización** de usuarios y prestadores
- **Gestión de emergencias veterinarias** en tiempo real
- **Sistema de citas** (agendamiento, confirmación, cancelación)
- **Validación y aprobación** de prestadores de servicios
- **Panel administrativo web** para gestión del sistema
- **Gestión de mascotas** y perfiles de usuarios
- **Sistema de notificaciones**
- **Procesamiento de pagos**
- **Valoraciones y reseñas**

---

## 📁 Estructura de Carpetas

```
backend/
├── src/
│   ├── admin/           # Panel administrativo web (EJS)
│   │   ├── routes/      # Rutas del panel admin
│   │   └── views/       # Vistas EJS para el panel
│   │
│   ├── config/          # Configuraciones (DB, Cloudinary, etc.)
│   │
│   ├── models/          # 🗄️ MODELOS DE MONGODB (12 modelos)
│   │   ├── User.js                    # Usuarios/Clientes
│   │   ├── Prestador.js               # Prestadores de servicios
│   │   ├── PrestadorValidacion.js     # Validación de prestadores
│   │   ├── Mascota.js                 # Mascotas de los usuarios
│   │   ├── Cita.js                    # Citas/Turnos agendados
│   │   ├── Emergencia.js              # Emergencias veterinarias
│   │   ├── Servicio.js                # Servicios ofrecidos
│   │   ├── Disponibilidad.js          # Horarios de prestadores
│   │   ├── Pago.js                    # Transacciones de pago
│   │   ├── Valoracion.js              # Reseñas y calificaciones
│   │   ├── Notificacion.js            # Sistema de notificaciones
│   │   └── ConsejoDeSalud.js          # Tips y consejos
│   │
│   ├── routes/          # 🛣️ RUTAS API (17 archivos)
│   │   ├── authRoutes.js              # Login, registro, recuperación contraseña
│   │   ├── userRoutes.js              # CRUD usuarios
│   │   ├── prestadorRoutes.js         # CRUD prestadores
│   │   ├── validacionRoutes.js        # Sistema de validación/aprobación
│   │   ├── mascotaRoutes.js           # Gestión de mascotas
│   │   ├── citaRoutes.js              # Sistema de citas
│   │   ├── emergenciaRoutes.js        # Sistema de emergencias
│   │   ├── disponibilidadRoutes.js    # Horarios y disponibilidad
│   │   ├── servicioRoutes.js          # Catálogo de servicios
│   │   ├── pagoRoutes.js              # Procesamiento de pagos
│   │   ├── valoracionRoutes.js        # Sistema de reseñas
│   │   ├── notificacionRoutes.js      # Envío de notificaciones
│   │   ├── consejoDeSaludRoutes.js    # Tips de salud
│   │   ├── catalogoRoutes.js          # Datos de catálogos
│   │   ├── clientRoutes.js            # Endpoints de clientes
│   │   ├── countPacientes.js          # Estadísticas
│   │   └── index.js                   # Registro de todas las rutas
│   │
│   ├── middleware/      # Middlewares personalizados
│   │   ├── auth.middleware.js         # Autenticación JWT
│   │   └── validacion.middleware.js   # Control de acceso por estado
│   │
│   ├── utils/           # Utilidades y helpers
│   ├── lib/             # Librerías externas personalizadas
│   ├── data/            # Datos semilla/iniciales
│   ├── scripts/         # Scripts de mantenimiento
│   └── index.js         # 🚀 Punto de entrada principal
│
├── uploads/             # Archivos subidos (temporal)
├── .env                 # Variables de entorno
├── package.json         # Dependencias del proyecto
└── createAdmin.js       # Script para crear admin inicial
```

---

## 🔑 Tecnologías Principales

| Tecnología | Propósito |
|------------|-----------|
| **Express 5.1.0** | Framework web para APIs REST |
| **Mongoose 8.14.3** | ODM para MongoDB |
| **JWT (jsonwebtoken 9.0.2)** | Autenticación basada en tokens |
| **bcryptjs 3.0.2** | Hash de contraseñas |
| **Cloudinary 2.6.1** | Almacenamiento de imágenes/documentos |
| **Multer 1.4.5** | Manejo de uploads de archivos |
| **CORS 2.8.5** | Control de acceso cross-origin |
| **EJS 3.1.10** | Motor de plantillas para panel admin |
| **Cookie Parser 1.4.7** | Manejo de cookies |
| **Axios 1.9.0** | Cliente HTTP |

---

## 🗄️ Modelos de Base de Datos

### **1. User** - Usuarios/Clientes
```javascript
- email, password, nombre, telefono
- direccion, coordenadas
- mascotas[], historialEmergencias[]
- resetPasswordToken, resetPasswordExpires
```

### **2. Prestador** - Prestadores de Servicios
```javascript
- tipo: 'Veterinario' | 'Centro Veterinario' | 'Veterinaria'
- nombre, email, telefono, especialidades[]
- direccion, coordenadas, radio (km de cobertura)
- servicios[], horarios[]
- estadoValidacion: 'pendiente_documentos' | 'en_revision' | 'aprobado' | 'rechazado' | 'requiere_correccion'
- activo, disponibleEmergencias
```

### **3. PrestadorValidacion** - Validación de Prestadores
```javascript
- prestadorId (ref: Prestador)
- estado: enum de estados de validación
- datosAdicionales: matrícula, universidad, especialidades, CUIT, etc.
- documentos: { cedula, matricula, titulo, constanciaConsejo, etc. }
  - url, cloudinaryId, estado, observaciones, fechaSubida
- historialRevisiones[]
```

### **4. Mascota** - Mascotas
```javascript
- nombre, especie, raza, edad, sexo
- dueno (ref: User)
- historialMedico[]
```

### **5. Cita** - Citas/Turnos
```javascript
- clienteId, prestadorId, mascotaId
- fecha, hora, duracion
- servicio, motivo
- estado: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada'
- notas, pagado
```

### **6. Emergencia** - Emergencias
```javascript
- clienteId, mascotaId
- ubicacion, coordenadas
- descripcion, gravedad, estado
- veterinarioAsignado (ref: Prestador)
- tiempoEstimado, costoEstimado
- historialEstados[]
```

### **7. Servicio** - Catálogo de Servicios
```javascript
- nombre, descripcion, categoria
- precio, duracion
- disponibleEmergencias
```

### **8. Disponibilidad** - Horarios
```javascript
- prestadorId
- fecha, horaInicio, horaFin
- disponible, motivo
```

### **9. Pago** - Transacciones
```javascript
- usuario, prestador, monto
- tipo: 'Cita' | 'Emergencia'
- estado, metodoPago
- transaccionId
```

### **10. Valoracion** - Reseñas
```javascript
- clienteId, prestadorId
- calificacion (1-5)
- comentario, respuesta
```

### **11. Notificacion** - Notificaciones
```javascript
- destinatario, tipo, titulo, mensaje
- leida, fecha
- datosAdicionales
```

### **12. ConsejoDeSalud** - Tips
```javascript
- titulo, contenido, categoria
- imagen, activo
```

---

## 🛣️ Principales Rutas API

### **Autenticación** (`/api/auth`)
```
POST   /register         - Registro de usuarios/prestadores
POST   /login            - Login con JWT
POST   /forgot-password  - Solicitar recuperación
POST   /reset-password   - Restablecer contraseña
GET    /me               - Obtener usuario actual
```

### **Validación** (`/api/validacion`)
```
GET    /mi-estado                      - Estado de validación del prestador
PUT    /datos-adicionales              - Actualizar datos profesionales
POST   /subir-documento                - Subir documentos (Cloudinary)
DELETE /documento/:tipo                - Eliminar documento
GET    /admin/pendientes               - Lista para revisar (admin)
GET    /admin/detalle/:id              - Detalle de validación (admin)
PUT    /admin/revisar-documento/:id    - Revisar documento (admin)
PUT    /admin/decision-final/:id       - Aprobar/rechazar (admin)
```

### **Emergencias** (`/api/emergencias`)
```
POST   /                              - Crear emergencia
GET    /usuario/:userId               - Emergencias del usuario
GET    /prestador/:prestadorId        - Emergencias asignadas
PUT    /:id/estado                    - Actualizar estado
PUT    /:id/asignar                   - Asignar veterinario
GET    /cercanos                      - Prestadores cercanos
```

### **Citas** (`/api/citas`)
```
POST   /                              - Crear cita
GET    /cliente/:clienteId            - Citas del cliente
GET    /prestador/:prestadorId        - Citas del prestador
PUT    /:id/estado                    - Actualizar estado
GET    /:id                           - Detalle de cita
DELETE /:id                           - Cancelar cita
```

### **Prestadores** (`/api/prestadores`)
```
GET    /                              - Listar prestadores
GET    /:id                           - Detalle de prestador
PUT    /:id                           - Actualizar prestador
GET    /buscar                        - Buscar prestadores
GET    /:id/disponibilidad            - Horarios disponibles
```

### **Mascotas** (`/api/mascotas`)
```
GET    /usuario/:userId               - Mascotas del usuario
POST   /                              - Crear mascota
PUT    /:id                           - Actualizar mascota
DELETE /:id                           - Eliminar mascota
```

---

## 🔐 Sistema de Autenticación

### **JWT (JSON Web Tokens)**
- Tokens generados al login/registro
- Incluyen: `userId`, `userType` ('cliente' o 'prestador')
- Middleware `protectRoute` verifica tokens en rutas protegidas
- Tokens almacenados en AsyncStorage en apps móviles
- Cookies para panel admin

### **Control de Acceso**
- `requireApprovedProvider`: Solo prestadores aprobados
- `checkProviderStatus`: Verifica estado sin bloquear
- `requireProviderInStates`: Permite estados específicos

---

## 🌐 Panel Administrativo Web

### **Ubicación**: `/admin`
Interfaz web construida con **EJS** para administradores.

### **Funcionalidades**:
- **Login admin**: Autenticación separada con cookies
- **Gestión de prestadores**: Ver, editar, activar/desactivar
- **Sistema de validaciones**: Revisar y aprobar documentos
- **Gestión de emergencias**: Monitoreo en tiempo real
- **Gestión de citas**: Ver y gestionar todas las citas
- **Dashboard**: Estadísticas y métricas del sistema

### **Rutas principales**:
```
GET  /admin/login              - Login administrativo
GET  /admin/dashboard          - Panel principal
GET  /admin/prestadores        - Gestión de prestadores
GET  /admin/validaciones       - Sistema de validaciones
GET  /admin/emergencias        - Monitor de emergencias
```

---

## 🔄 Flujos Principales

### **1. Registro y Validación de Prestadores**
```
1. Prestador se registra → estado: 'pendiente_documentos'
2. Completa datos adicionales (matrícula, universidad, etc.)
3. Sube documentos requeridos (cédula, diploma, etc.)
4. Admin revisa documentos en panel web
5. Admin aprueba/rechaza/solicita correcciones
6. Prestador recibe notificación
7. Si aprobado → puede usar todas las funcionalidades
```

### **2. Creación de Emergencia**
```
1. Cliente crea emergencia desde app
2. Sistema busca veterinarios cercanos disponibles
3. Veterinarios reciben notificación
4. Veterinario acepta emergencia
5. Cliente ve tiempo estimado y puede seguir en mapa
6. Veterinario completa servicio
7. Cliente califica y paga
```

### **3. Agendamiento de Cita**
```
1. Cliente busca prestador por especialidad/ubicación
2. Ve disponibilidad en calendario
3. Selecciona fecha/hora y mascota
4. Prestador recibe notificación
5. Prestador confirma/rechaza
6. Cliente recibe confirmación
7. Al completarse, cliente puede valorar
```

---

## 🚀 Comandos de Ejecución

```bash
# Desarrollo con auto-reload
npm run dev

# Crear admin inicial
node createAdmin.js

# Variables de entorno requeridas (.env)
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📦 Dependencias Clave

```json
{
  "express": "^5.1.0",
  "mongoose": "^8.14.3",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^3.0.2",
  "cloudinary": "^2.6.1",
  "multer": "^1.4.5-lts.2",
  "cors": "^2.8.5",
  "ejs": "^3.1.10",
  "axios": "^1.9.0"
}
```

---

## 🔗 Conexiones con Apps

- **vetpresta** (App de Prestadores): Consume APIs para gestión de citas, emergencias, perfil, validación
- **vetya** (App de Clientes): Consume APIs para emergencias, citas, mascotas, búsqueda de prestadores

---

## 📝 Notas Importantes

1. **Todas las rutas API** están bajo el prefijo `/api`
2. **Panel admin** está bajo el prefijo `/admin`
3. **Cloudinary** se usa para almacenar documentos e imágenes
4. **Coordenadas geográficas** se usan para búsquedas por proximidad
5. **Sistema de notificaciones** integrado para comunicación en tiempo real
6. **Estados de validación** controlan acceso de prestadores a funcionalidades
7. **Interceptores de axios** configurados en las apps para manejo automático de tokens

---

## 🐛 Debugging

El backend incluye logs detallados en:
- Requests de autenticación
- Procesos de validación
- Creación/actualización de emergencias
- Asignación de citas
- Errores de base de datos

---

**Última actualización**: 2025-01-14
**Versión**: 1.0.0
