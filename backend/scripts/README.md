# Scripts de Mantenimiento de Vetya Backend

## 📌 Descripción

Esta carpeta contiene scripts de mantenimiento y configuración para la base de datos de Vetya.

---

## 📋 Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `seedDatabase.js` | Poblar BD con datos de prueba | `node scripts/seedDatabase.js` |
| `removeEmergencyTTLIndex.js` | Eliminar índice TTL de emergencias | `node scripts/removeEmergencyTTLIndex.js` |

---

## 🌱 Poblar Base de Datos con Datos de Prueba

### Script: `seedDatabase.js`

**Descripción:**
- Crea datos de prueba completos para testing de la aplicación
- **NO elimina datos existentes** - solo agrega nuevos registros
- Crea usuarios, mascotas, prestadores, citas, emergencias, pagos y valoraciones

**Datos que crea:**
- 👤 **6 Usuarios**: 3 clientes + 3 prestadores
- 🐾 **3 Mascotas**: Con historial médico y vacunas
- 🏥 **3 Prestadores**: 1 Veterinario (aprobado), 1 Centro Veterinario (aprobado), 1 Otro (en revisión)
- 📋 **3 Validaciones**: Con documentos y estados
- 🛠️ **3 Servicios**: Consulta, Ecografía, Baño y Corte
- 📅 **3 Disponibilidades**
- 🔖 **3 Citas**: Completada, Confirmada, Pendiente
- 🚨 **3 Emergencias**: Atendida, En camino, Solicitada
- 💳 **3 Pagos**: Efectivo y MercadoPago
- ⭐ **3 Valoraciones**

**Credenciales de prueba:**
```
Clientes:
  - juan.perez.seed@vetya.com / password123
  - maria.gomez.seed@vetya.com / password123
  - carlos.ruiz.seed@vetya.com / password123

Prestadores:
  - dr.house.seed@vetya.com / password123 (Veterinario - Aprobado)
  - clinica.central.seed@vetya.com / password123 (Centro - Aprobado)
  - paseos.felices.seed@vetya.com / password123 (Otro - En revisión)
```

**Cómo ejecutar:**
```bash
cd E:\vetya_1.0\backend
node scripts/seedDatabase.js
```

**Salida esperada:**
```
🔗 Conectando a MongoDB...
✅ Conectado a MongoDB exitosamente
📊 Base de datos: vetya

📈 Estadísticas actuales:
   Users: X
   Prestadores: X
   Mascotas: X

👤 Creando Usuarios...
   ✅ 6 usuarios creados
🐾 Creando Mascotas...
   ✅ 3 mascotas creadas
...
═══════════════════════════════════════════════════════════
✨ BASE DE DATOS POBLADA EXITOSAMENTE
═══════════════════════════════════════════════════════════
```

**⚠️ Nota:** Si ejecutas el script más de una vez, obtendrás error de duplicados (email/username). Usa emails diferentes o elimina los datos de prueba anteriores.

---

## 🗑️ Eliminar Índice TTL de Emergencias

### Script: `removeEmergencyTTLIndex.js`

**Problema que resuelve:**
- Las emergencias se eliminaban automáticamente de MongoDB después de 5 minutos debido a un índice TTL (Time To Live)
- Esto impedía que los clientes vieran el historial de emergencias completadas

**Solución:**
- Este script elimina el índice `expiraEn_1` que causaba la eliminación automática
- Después de ejecutarlo, las emergencias permanecerán en la base de datos indefinidamente

---

## 🚀 Cómo Ejecutar el Script

### Requisitos Previos:
1. Tener Node.js instalado
2. Estar en el directorio del backend
3. Tener las variables de entorno configuradas (archivo `.env`)

### Pasos:

#### **Opción 1: Desde la raíz del backend**

```bash
# Navegar al directorio del backend
cd E:\vetya_1.0\backend

# Ejecutar el script
node scripts/removeEmergencyTTLIndex.js
```

#### **Opción 2: Usando npm script**

Agregar en `package.json`:
```json
{
  "scripts": {
    "remove-ttl-index": "node scripts/removeEmergencyTTLIndex.js"
  }
}
```

Luego ejecutar:
```bash
npm run remove-ttl-index
```

---

## 📊 Salida Esperada

Al ejecutar el script correctamente, verás:

```
🔗 Conectando a MongoDB...
✅ Conectado a MongoDB exitosamente
📊 Base de datos: vetya

📋 Índices existentes en la colección emergencias:
{
  "_id_": { ... },
  "expiraEn_1": { ... },
  ...
}

🎯 Índice TTL "expiraEn_1" encontrado. Procediendo a eliminar...
✅ Índice TTL "expiraEn_1" eliminado exitosamente

📋 Índices después de la eliminación:
{
  "_id_": { ... },
  ...
}

📊 Total de emergencias en la base de datos: 15

✅ Proceso completado exitosamente
💡 Las emergencias ahora permanecerán en la base de datos indefinidamente
💡 El historial de emergencias estará disponible para los clientes

🔌 Conexión a MongoDB cerrada
```

---

## ⚠️ Notas Importantes

1. **Ejecutar solo una vez**: Este script solo necesita ejecutarse una vez
2. **Backup recomendado**: Aunque el script es seguro, se recomienda hacer un backup de la base de datos antes
3. **Verificar conexión**: Asegúrate de que la variable `MONGO_URI` en `.env` sea correcta
4. **No afecta datos**: El script solo elimina el índice, no los datos de emergencias

---

## 🔍 Verificación Manual

Si deseas verificar manualmente en MongoDB Compass o Shell:

```javascript
// Ver índices actuales
db.emergencias.getIndexes()

// Verificar que expiraEn_1 no exista
// Si ya fue eliminado, no aparecerá en la lista
```

---

## 🆘 Solución de Problemas

### Error: "No se puede conectar a MongoDB"
- Verifica que MongoDB esté corriendo
- Revisa la variable `MONGO_URI` en el archivo `.env`

### Error: "Index not found"
- El índice ya fue eliminado anteriormente
- No es necesario ejecutar el script nuevamente

### Error: "Permission denied"
- Verifica que tienes permisos de escritura en la base de datos

---

## 📝 Changelog

### v1.0.0 - 2025-10-15
- Script inicial para eliminar índice TTL `expiraEn_1`
- Agrega logs detallados del proceso
- Muestra estadísticas de emergencias existentes
