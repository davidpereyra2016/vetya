# Panel de Administración - Vetya

## 📋 Descripción

El panel de administración de Vetya permite gestionar y supervisar todas las operaciones de la plataforma, incluyendo la **validación y aprobación de prestadores** que solicitan unirse a la aplicación.

## 🚀 Cómo Inicializar el Panel de Administración

### 1. Configuración del Servidor

El panel de administración está integrado en el backend principal. Asegúrate de que el servidor esté ejecutándose:

```bash
cd E:\vetya_1.0\backend
npm start
```

### 2. Acceso al Panel

Una vez que el servidor esté ejecutándose, accede al panel de administración en:

```
http://localhost:3000/admin
```

### 3. Credenciales de Administrador

Para acceder al panel, necesitas una cuenta de usuario con rol `admin`. Puedes crear un administrador de las siguientes maneras:

#### Opción A: Modificar un usuario existente en la base de datos
```javascript
// En MongoDB Compass o mediante script
db.users.updateOne(
  { email: "admin@vetya.com" },
  { $set: { role: "admin" } }
)
```

#### Opción B: Crear un nuevo administrador
```javascript
// Script para crear administrador
const bcrypt = require('bcrypt');

const adminUser = {
  nombre: "Administrador",
  email: "admin@vetya.com",
  password: await bcrypt.hash("admin123", 10),
  role: "admin",
  fechaCreacion: new Date()
};

// Insertar en la colección users
db.users.insertOne(adminUser);
```

### 4. Login en el Panel

1. Ve a `http://localhost:3000/admin/login`
2. Ingresa las credenciales del administrador:
   - **Email**: admin@vetya.com
   - **Password**: admin123 (o la que hayas configurado)
3. Haz clic en "Iniciar Sesión"

## 🛠️ Funcionalidades del Panel

### Dashboard Principal
- **Estadísticas generales** del sistema
- **Contadores** de usuarios, prestadores, mascotas y citas
- **Acceso rápido** a todas las secciones

### Gestión de Validaciones de Prestadores

#### Vista Principal (`/admin/validaciones`)
- **Lista completa** de todas las solicitudes de validación
- **Filtros** por estado, tipo de prestador y búsqueda
- **Estadísticas rápidas** por estado de validación
- **Acciones rápidas** de aprobación/rechazo

#### Vista de Detalle (`/admin/validaciones/:id`)
- **Información completa** del prestador
- **Revisión de documentos** subidos
- **Historial de revisiones** y cambios
- **Formularios** para revisar documentos individuales
- **Decisión final** de aprobación/rechazo

### Estados de Validación

1. **`pendiente_documentos`** - El prestador debe subir documentos
2. **`en_revision`** - Documentos listos para revisión administrativa
3. **`requiere_correccion`** - Se solicitaron correcciones
4. **`aprobado`** - Prestador aprobado y activo
5. **`rechazado`** - Solicitud rechazada

### Documentos Requeridos

#### Para Veterinarios:
- Diploma universitario
- Constancia del consejo profesional
- Cédula de identidad

#### Para Centros Veterinarios:
- Habilitación municipal
- Constancia AFIP
- Contrato de alquiler/propiedad
- Seguro de responsabilidad civil
- Cédula del responsable

## 📝 Flujo de Trabajo para Administradores

### 1. Revisión de Nuevas Solicitudes
1. Acceder a **Validaciones** en el menú lateral
2. Filtrar por estado **"En Revisión"**
3. Hacer clic en **"Ver detalles"** de una solicitud

### 2. Revisión de Documentos
1. En la vista de detalle, revisar cada documento subido
2. Para cada documento:
   - Hacer clic en **"Ver Documento"** para abrir el archivo
   - Seleccionar estado: **Aprobar**, **Rechazar** o **Requiere Revisión**
   - Agregar **observaciones** si es necesario
   - Hacer clic en **"Guardar Revisión"**

### 3. Decisión Final
Una vez revisados todos los documentos:
1. Ir a la sección **"Decisión Final"**
2. Seleccionar:
   - **✅ Aprobar Prestador** - El prestador puede usar la app
   - **❌ Rechazar Prestador** - Se rechaza la solicitud
   - **⚠️ Solicitar Correcciones** - Se pide al prestador corregir documentos
3. Agregar **observaciones** explicando la decisión
4. Hacer clic en **"Tomar Decisión"**

### 4. Acciones Rápidas
Desde la lista principal, puedes:
- **Aprobar rápidamente** prestadores con documentación completa
- **Rechazar** solicitudes problemáticas
- **Filtrar** por diferentes criterios

## 🔧 Configuración Técnica

### Rutas del Panel de Administración

```javascript
// Rutas principales
GET  /admin                           // Redirige al dashboard
GET  /admin/login                     // Página de login
POST /admin/login                     // Procesar login
GET  /admin/logout                    // Cerrar sesión
GET  /admin/dashboard                 // Dashboard principal

// Rutas de validaciones
GET  /admin/validaciones              // Lista de validaciones
GET  /admin/validaciones/:id          // Detalle de validación
POST /admin/validaciones/:id/revisar-documento  // Revisar documento
POST /admin/validaciones/:id/decision           // Decisión final
```

### APIs Utilizadas

El panel consume las siguientes APIs del backend:

```javascript
// APIs de validación
GET  /api/validacion/admin/pendientes
GET  /api/validacion/admin/detalle/:id
PUT  /api/validacion/admin/revisar-documento/:id
PUT  /api/validacion/admin/decision-final/:id
```

## 🎨 Interfaz de Usuario

### Características de la UI
- **Responsive design** compatible con desktop y móvil
- **Bootstrap 5** para estilos consistentes
- **Font Awesome** para iconografía
- **DataTables** para tablas interactivas
- **Modales** para confirmaciones
- **Alertas** para feedback del usuario

### Colores por Estado
- 🟡 **Amarillo** - Pendiente documentos / Requiere corrección
- 🔵 **Azul** - En revisión
- 🟢 **Verde** - Aprobado
- 🔴 **Rojo** - Rechazado
- ⚫ **Gris** - Estados neutros

## 🔐 Seguridad

### Autenticación
- **JWT tokens** para sesiones
- **Cookies httpOnly** para almacenamiento seguro
- **Middleware de autenticación** en todas las rutas protegidas

### Autorización
- Solo usuarios con **rol `admin`** pueden acceder
- **Verificación de permisos** en cada endpoint
- **Logs de actividad** para auditoría

## 🚨 Troubleshooting

### Problemas Comunes

#### No puedo acceder al panel
- Verificar que el servidor esté ejecutándose en el puerto correcto
- Confirmar que tienes un usuario con rol `admin`
- Revisar las credenciales de login

#### Error al cargar validaciones
- Verificar que las rutas de validación estén configuradas
- Confirmar que el token de administrador sea válido
- Revisar logs del servidor para errores específicos

#### Documentos no se cargan
- Verificar configuración de Cloudinary
- Confirmar que las URLs de documentos sean válidas
- Revisar permisos de acceso a archivos

### Logs y Debugging
```bash
# Ver logs del servidor
npm run dev

# Logs específicos en el navegador
# Abrir DevTools > Console para ver errores JavaScript
```

## 📞 Soporte

Para problemas técnicos o dudas sobre el panel de administración:
1. Revisar este documento
2. Consultar logs del servidor
3. Revisar la documentación de las APIs
4. Contactar al equipo de desarrollo

---

**Nota**: Este panel de administración es parte del sistema integral de validación de prestadores de Vetya y debe ser utilizado únicamente por personal autorizado.
