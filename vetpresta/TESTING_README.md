# 🧪 GUÍA DE TESTING - VETPRESTA (App de Prestadores)

## 📋 Descripción

Sistema de tests unitarios e integración para la aplicación móvil Vetpresta usando **Jest** y **React Native Testing Library**.

---

## 🚀 Configuración Completada

### **Dependencias Instaladas**
```json
{
  "@testing-library/react-native": "^12.4.3",
  "@testing-library/jest-native": "^5.4.3",
  "jest": "^29.7.0",
  "jest-expo": "~51.0.1",
  "@types/jest": "^29.5.11"
}
```

### **Configuración de Jest** (package.json)
```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!(react-native|@react-native|@react-navigation|expo|expo-.*|@expo|react-native-.*|@react-native-async-storage|@react-native-community|zustand)/)"
    ],
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/assets/**",
      "!src/**/*.test.{js,jsx,ts,tsx}",
      "!src/**/__tests__/**"
    ]
  }
}
```

---

## 📁 Estructura de Tests

```
vetpresta/
├── src/
│   └── store/
│       └── __tests__/              # Tests de Zustand stores
│           ├── useEmergencyStore.test.js
│           └── useCitaStore.test.js
│
└── TESTING_README.md              # Esta guía
```

---

## 🏃 Comandos de Ejecución

### **Ejecutar todos los tests**
```bash
npm test
```

### **Ejecutar tests en modo watch**
```bash
npm run test:watch
```

### **Ejecutar tests con cobertura**
```bash
npm run test:coverage
```

### **Ejecutar archivo específico**
```bash
npm test useEmergencyStore.test.js
```

---

## 📊 Cobertura de Tests

### **Tests de Stores (Zustand)**

#### **useEmergencyStore.test.js - Prestador recibe emergencias**
- ✅ Obtención de emergencias asignadas al prestador
- ✅ Recepción de notificación de nueva emergencia
- ✅ Aceptación de emergencia con tiempo estimado
- ✅ Rechazo de emergencia con motivo
- ✅ Actualización de estado (en_camino, en_atencion, completada)
- ✅ Toggle de disponibilidad para emergencias
- ✅ Filtrado de emergencias por estado
- ✅ Ordenamiento por gravedad
- ✅ Manejo de errores (emergencia ya asignada)

#### **useCitaStore.test.js - Prestador gestiona citas**
- ✅ Obtención de citas pendientes del prestador
- ✅ Obtención de citas confirmadas
- ✅ Detalle completo de cita (cliente, mascota)
- ✅ Confirmación de cita pendiente
- ✅ Rechazo de cita con motivo
- ✅ Completar cita con notas del veterinario
- ✅ Dashboard de resumen de citas
- ✅ Filtrado de citas por estado
- ✅ Ordenamiento por hora
- ✅ Detección de citas próximas y vencidas

---

## 🔍 Casos de Prueba Principales

### **1. Recibir Emergencia** ⚠️

**Escenario exitoso:**
```javascript
// Prestador está disponible
// Recibe notificación de emergencia cercana
// Ve detalles: cliente, mascota, ubicación, gravedad
// Puede aceptar o rechazar
```

**Datos incluidos en emergencia:**
```javascript
{
  clienteId: { nombre, telefono },
  mascotaId: { nombre, especie, raza },
  descripcion: string,
  gravedad: 'leve' | 'moderada' | 'grave',
  ubicacion: { lat, lng },
  distancia: number (km),
  tiempoEstimado: number (minutos)
}
```

---

### **2. Aceptar Emergencia** ✅

**Escenario exitoso:**
```javascript
// Prestador ve emergencia
// Decide aceptar
// Proporciona tiempo estimado de llegada
// Estado cambia a 'aceptada'
// Cliente recibe confirmación
```

**Validaciones:**
- Solo emergencias no asignadas
- Prestador debe estar disponible
- Tiempo estimado requerido

**Casos de error:**
- Emergencia ya asignada → Error
- Prestador no disponible → Error

---

### **3. Actualizar Estados de Emergencia** 🔄

**Flujo de estados:**
```
solicitada → asignada → en_camino → en_atencion → completada
```

**Tests cubiertos:**
- ✅ Actualizar a "en_camino"
- ✅ Actualizar a "en_atencion" con hora inicio
- ✅ Actualizar a "completada" con notas

---

### **4. Gestionar Citas** 📅

**Operaciones cubiertas:**

#### **Recepción de Citas Pendientes**
```javascript
// Prestador ve citas que requieren confirmación
// Información completa: cliente, mascota, motivo
// Puede confirmar o rechazar
```

#### **Confirmación de Cita**
```javascript
// Prestador revisa detalles
// Confirma disponibilidad
// Estado cambia a 'Confirmada'
// Cliente recibe notificación
```

#### **Rechazo de Cita**
```javascript
// Prestador no puede atender
// Proporciona motivo
// Estado cambia a 'Cancelada'
// Cliente es notificado
```

#### **Completar Cita**
```javascript
// Servicio se completa
// Prestador añade notas opcionales
// Estado cambia a 'Completada'
// Sistema solicita valoración al cliente
```

---

## 🎯 Flujos Críticos Testeados

### **Flujo 1: Emergencia Completa (Lado Prestador)**
```
1. Prestador activa disponibilidad → ✅
2. Recibe notificación de emergencia → ✅
3. Ve detalles y ubicación → ✅
4. Acepta emergencia → ✅
5. Actualiza estado "en_camino" → ✅
6. Actualiza estado "en_atencion" → ✅
7. Completa servicio → ✅
8. Añade notas del servicio → ✅
```

### **Flujo 2: Gestión de Cita (Lado Prestador)**
```
1. Prestador recibe cita pendiente → ✅
2. Revisa detalles del cliente → ✅
3. Revisa datos de la mascota → ✅
4. Confirma la cita → ✅
5. Cita aparece en calendario → ✅
6. Al completar, añade notas → ✅
```

---

## 🛠️ Mocks Utilizados

### **Servicios de Emergencias**
```javascript
jest.mock('../../services/api', () => ({
  emergenciaService: {
    getByPrestador: jest.fn(),
    getById: jest.fn(),
    acceptEmergency: jest.fn(),
    updateStatus: jest.fn(),
    rejectEmergency: jest.fn(),
  },
}));
```

### **Servicios de Citas**
```javascript
jest.mock('../../services/citaService', () => ({
  getCitasByProvider: jest.fn(),
  updateCitaStatus: jest.fn(),
  getCitaById: jest.fn(),
  getDashboardSummary: jest.fn(),
}));
```

---

## 🔐 Tests de Control de Acceso

### **Toggle de Disponibilidad**
```javascript
test('debe activar disponibilidad para emergencias', () => {
  // Estado inicial: false
  toggleAvailability();
  // Estado final: true
});

test('debe desactivar disponibilidad', () => {
  // Estado activo
  toggleAvailability();
  // Estado final: false
});
```

**Importancia:**
- Solo prestadores disponibles reciben emergencias
- Control manual por el prestador
- Afecta visibilidad en búsquedas

---

## 📊 Filtrado y Ordenamiento

### **Filtrar Emergencias**
```javascript
// Por estado
const activas = emergencias.filter(
  e => e.estado !== 'completada' && e.estado !== 'cancelada'
);

// Por gravedad
const graves = emergencias.filter(e => e.gravedad === 'grave');
```

### **Ordenar Emergencias**
```javascript
// Por gravedad (grave → moderada → leve)
const ordenadas = emergencias.sort((a, b) => {
  const orden = { grave: 3, moderada: 2, leve: 1 };
  return orden[b.gravedad] - orden[a.gravedad];
});
```

### **Filtrar Citas**
```javascript
// Citas de hoy
const hoy = new Date().toISOString().split('T')[0];
const citasHoy = citas.filter(c => c.fecha === hoy);

// Próximas 30 minutos
const proximasMinutos = citas.filter(c => {
  const citaTime = new Date(`${c.fecha} ${c.hora}`);
  const diff = citaTime - new Date();
  return diff > 0 && diff < 30 * 60000;
});
```

---

## 🎨 Dashboard de Prestador

### **Métricas Testeadas**
```javascript
{
  proximaCita: { fecha, hora, cliente, mascota },
  citasHoy: 5,
  citasSemana: 20,
  citasPendientes: 8,
  citasConfirmadas: 12
}
```

**Uso:**
- Vista resumen en HomeScreen
- Indicadores de actividad
- Planificación de agenda

---

## ✅ Validaciones Importantes

### **Aceptar Emergencia**
- ✅ Emergencia no debe estar ya asignada
- ✅ Tiempo estimado es requerido
- ✅ Prestador debe estar disponible
- ✅ Distancia debe ser dentro del radio

### **Confirmar Cita**
- ✅ Cita no debe estar cancelada
- ✅ Fecha no debe ser pasada
- ✅ Prestador debe estar aprobado
- ✅ Motivo requerido para rechazo

### **Completar Servicio**
- ✅ Servicio debe estar en atención
- ✅ Notas son opcionales
- ✅ Hora de finalización se registra
- ✅ Trigger para valoración del cliente

---

## 🚨 Casos de Error Cubiertos

### **Emergencias**
```javascript
❌ Aceptar emergencia ya asignada
❌ Actualizar estado sin permiso
❌ Rechazar sin proporcionar motivo
```

### **Citas**
```javascript
❌ Confirmar cita ya cancelada
❌ Completar sin haber iniciado
❌ Rechazar sin motivo
```

---

## 📈 Métricas de Calidad

### **Cobertura Objetivo**
- **useEmergencyStore**: > 85%
- **useCitaStore**: > 85%
- **useValidacionStore** (futuro): > 80%

### **Tipos de Tests**
- ✅ Unitarios: Funciones individuales
- ✅ Integración: Flujos entre stores
- 🔄 E2E (futuro): Navegación completa

---

## 🔄 Estados de Emergencia

```javascript
'solicitada'   // Cliente solicita, sin asignar
'asignada'     // Prestador acepta
'en_camino'    // Prestador va hacia cliente
'en_atencion'  // Prestador atendiendo
'completada'   // Servicio finalizado
'cancelada'    // Cliente o prestador canceló
```

**Transiciones válidas testeadas:**
- solicitada → asignada ✅
- asignada → en_camino ✅
- en_camino → en_atencion ✅
- en_atencion → completada ✅

---

## 🔄 Estados de Cita

```javascript
'Pendiente'    // Esperando confirmación
'Confirmada'   // Prestador confirmó
'Completada'   // Servicio finalizado
'Cancelada'    // Por cliente o prestador
```

**Acciones testeadas:**
- confirmar() → Pendiente → Confirmada ✅
- rechazar() → Pendiente → Cancelada ✅
- completar() → Confirmada → Completada ✅

---

## 🎓 Mejores Prácticas

1. **Tests independientes**: Cada test resetea estado
2. **Mock APIs externas**: No llamadas reales a backend
3. **Nombres descriptivos**: Clara intención del test
4. **AAA Pattern**: Arrange, Act, Assert
5. **waitFor async**: Para operaciones asíncronas
6. **Cleanup**: beforeEach limpia mocks y stores

---

## 💡 Tips para Prestadores

### **Priorización de Emergencias**
```javascript
// Ordenar por gravedad y distancia
const emergenciasOrdenadas = emergencias.sort((a, b) => {
  if (a.gravedad !== b.gravedad) {
    const orden = { grave: 3, moderada: 2, leve: 1 };
    return orden[b.gravedad] - orden[a.gravedad];
  }
  return a.distancia - b.distancia; // Más cerca primero
});
```

### **Gestión de Agenda**
```javascript
// Detectar conflictos de horarios
const tieneConflicto = (nuevaCita) => {
  return citasConfirmadas.some(cita => {
    return cita.fecha === nuevaCita.fecha &&
           cita.hora === nuevaCita.hora;
  });
};
```

---

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Zustand](https://docs.pmnd.rs/zustand/guides/testing)
- [Jest Expo Preset](https://docs.expo.dev/develop/unit-testing/)

---

## 🎯 Próximos Tests a Implementar

- [ ] Tests de validación de prestadores
- [ ] Tests de disponibilidad y horarios
- [ ] Tests de servicios ofrecidos
- [ ] Tests de notificaciones
- [ ] Tests de valoraciones recibidas
- [ ] Tests de integración completos
- [ ] Tests E2E con navegación

---

## 🐛 Debugging

### **Ver output detallado**
```bash
npm test -- --verbose
```

### **Ejecutar solo un test**
```javascript
test.only('debe aceptar emergencia', async () => {
  // Solo ejecuta este
});
```

### **Logs en tests**
Los `console.log` dentro de tests se muestran en output.

---

**Última actualización**: 2025-01-14  
**Versión**: 1.0.0  
**Equipo**: Desarrollo Vetya

¡Happy Testing! 🎉
