# 🧪 GUÍA DE TESTING - VETYA (App de Clientes)

## 📋 Descripción

Sistema de tests unitarios e integración para la aplicación móvil Vetya usando **Jest** y **React Native Testing Library**.

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
      "node_modules/(?!(react-native|@react-native|@react-navigation|expo|expo-.*|@expo|react-native-.*|@react-native-async-storage|zustand)/)"
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
vetya/
├── src/
│   ├── store/
│   │   └── __tests__/              # Tests de Zustand stores
│   │       ├── useEmergencyStore.test.js
│   │       ├── useCitaStore.test.js
│   │       └── usePetStore.test.js
│   │
│   └── __tests__/
│       └── integration/            # Tests de integración
│           ├── emergencyFlow.test.js
│           └── appointmentFlow.test.js
│
└── TESTING_README.md              # Esta guía
```

---

## 🏃 Comandos de Ejecución

### **Ejecutar todos los tests**
```bash
npm test
```

### **Ejecutar tests en modo watch** (auto-reload al guardar)
```bash
npm run test:watch
```

### **Ejecutar tests con cobertura**
```bash
npm run test:coverage
```

### **Ejecutar un archivo específico**
```bash
npm test useEmergencyStore.test.js
```

### **Ejecutar tests que coincidan con patrón**
```bash
npm test -- --testNamePattern="Cliente crea emergencia"
```

---

## 📊 Cobertura de Tests

### **Tests de Stores (Zustand)**

#### **useEmergencyStore.test.js**
- ✅ Creación de emergencia exitosa
- ✅ Validación de datos requeridos (ubicación, mascota)
- ✅ Búsqueda de veterinarios disponibles cercanos
- ✅ Obtención de emergencias del usuario
- ✅ Seguimiento de emergencia por ID
- ✅ Cancelación de emergencia
- ✅ Manejo de errores

#### **useCitaStore.test.js**
- ✅ Creación de cita exitosa
- ✅ Validación de fecha no pasada
- ✅ Validación de horario disponible
- ✅ Obtención de citas del cliente
- ✅ Filtrado de citas por estado
- ✅ Cancelación de cita
- ✅ Obtención de resumen de dashboard
- ✅ Ordenamiento por fecha

#### **usePetStore.test.js**
- ✅ Obtención de mascotas del usuario
- ✅ Creación de mascota
- ✅ Validación de datos requeridos (nombre, especie)
- ✅ Actualización de mascota
- ✅ Eliminación de mascota
- ✅ Selección de mascota actual
- ✅ Filtrado y búsqueda
- ✅ Validaciones de datos

### **Tests de Integración**

#### **emergencyFlow.test.js**
- ✅ Flujo completo: Cliente con mascota → Crea emergencia → Recibe veterinario
- ✅ Flujo con error: Sin mascota seleccionada
- ✅ Flujo con error: No hay veterinarios disponibles

#### **appointmentFlow.test.js**
- ✅ Flujo completo: Buscar prestador → Ver disponibilidad → Agendar cita
- ✅ Flujo con error: Horario no disponible
- ✅ Flujo completo: Agendar y cancelar cita

---

## 🔍 Casos de Prueba Principales

### **1. Crear Emergencia** ⚠️

**Escenario exitoso:**
```javascript
// Cliente tiene mascota registrada
// Cliente describe síntomas
// Sistema obtiene ubicación GPS
// Emergencia se crea exitosamente
// Estado: 'solicitada'
```

**Validaciones:**
- Ubicación GPS requerida
- Mascota requerida
- Descripción requerida
- Gravedad válida (leve/moderada/grave)

**Casos de error:**
- Sin ubicación → Error
- Sin mascota → Error
- Sin descripción → Error

---

### **2. Búsqueda de Veterinarios** 🔍

**Escenario exitoso:**
```javascript
// Sistema busca veterinarios cercanos
// Calcula distancia y tiempo estimado
// Ordena por proximidad
// Muestra lista con disponibilidad
```

**Validaciones:**
- Radio de privacidad de 1km aplicado
- Solo veterinarios disponibles
- Distancias correctas
- Tiempos estimados realistas

---

### **3. Agendar Cita** 📅

**Escenario exitoso:**
```javascript
// Cliente busca prestador
// Verifica disponibilidad
// Selecciona fecha/hora
// Selecciona mascota
// Cita se crea con estado 'Pendiente'
```

**Validaciones:**
- Fecha no puede ser pasada
- Horario debe estar disponible
- Mascota requerida
- Prestador activo y aprobado

**Casos de error:**
- Fecha pasada → Error
- Horario ocupado → Error
- Sin mascota → Error

---

### **4. Gestión de Mascotas** 🐾

**Operaciones cubiertas:**
- Crear mascota nueva
- Actualizar datos (edad, peso)
- Eliminar mascota
- Seleccionar mascota para servicios
- Filtrar por especie
- Buscar por nombre

**Validaciones:**
- Nombre requerido
- Especie requerida
- Edad no negativa
- Peso positivo

---

## 🎯 Flujos Críticos Testeados

### **Flujo 1: Emergencia Completa**
```
1. Cliente tiene mascotas → ✅
2. Selecciona mascota afectada → ✅
3. Describe emergencia → ✅
4. Sistema obtiene ubicación → ✅
5. Crea emergencia → ✅
6. Busca veterinarios cercanos → ✅
7. Muestra opciones disponibles → ✅
8. Veterinario es asignado → ✅
```

### **Flujo 2: Cita Completa**
```
1. Cliente busca prestadores → ✅
2. Filtra por especialidad/ubicación → ✅
3. Selecciona prestador → ✅
4. Ve perfil y servicios → ✅
5. Verifica disponibilidad → ✅
6. Selecciona mascota → ✅
7. Agenda cita → ✅
8. Cita queda pendiente de confirmación → ✅
```

---

## 🛠️ Mocks Utilizados

### **AsyncStorage**
```javascript
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));
```

### **Servicios API**
```javascript
jest.mock('../../services/api', () => ({
  emergencyService: {
    create: jest.fn(),
    getByUser: jest.fn(),
    getById: jest.fn(),
    getVeterinariosDisponibles: jest.fn(),
  },
  petService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
```

---

## 📈 Métricas de Calidad

### **Cobertura Objetivo**
- **Stores**: > 80%
- **Servicios**: > 70%
- **Integración**: Flujos críticos cubiertos

### **Tipos de Tests**
- **Unitarios**: Funciones individuales de stores
- **Integración**: Flujos completos entre stores
- **E2E** (futuro): Tests end-to-end con navegación

---

## 🐛 Debugging de Tests

### **Ver logs detallados**
```bash
npm test -- --verbose
```

### **Ejecutar un solo test**
```javascript
test.only('debe crear emergencia', async () => {
  // Test específico
});
```

### **Saltar un test temporalmente**
```javascript
test.skip('test en construcción', async () => {
  // Se saltará este test
});
```

### **Ver output de console.log**
Los `console.log` dentro de los tests se mostrarán en la salida.

---

## ✅ Checklist de Testing

Antes de hacer commit:

- [ ] Todos los tests pasan (`npm test`)
- [ ] Cobertura > 80% en stores críticos
- [ ] No hay tests con `.only` o `.skip`
- [ ] Mocks están correctamente configurados
- [ ] Tests son independientes (no dependen del orden)
- [ ] Nombres de tests son descriptivos
- [ ] Se prueban casos de éxito y error
- [ ] Se validan estados de loading y error

---

## 🚨 Casos de Uso Importantes

### **1. Emergencia sin Mascota**
```javascript
test('debe requerir mascota para emergencia', async () => {
  // Sin mascotaId → Error esperado
});
```

### **2. Cita en Fecha Pasada**
```javascript
test('debe rechazar fecha pasada', async () => {
  // fecha: '2020-01-01' → Error esperado
});
```

### **3. Sin Veterinarios Disponibles**
```javascript
test('debe manejar caso sin veterinarios', async () => {
  // veterinariosDisponibles: [] → Manejo correcto
});
```

---

## 📝 Convenciones de Nombres

### **Archivos de Test**
- `[nombre].test.js` - Tests unitarios
- `[flujo]Flow.test.js` - Tests de integración

### **Describe Blocks**
```javascript
describe('useEmergencyStore - Cliente crea emergencia', () => {
  describe('Creación de Emergencia', () => {
    test('debe crear emergencia exitosamente', async () => {
      // Test
    });
  });
});
```

### **Nombres de Tests**
- Usar "debe" o "should" al inicio
- Ser descriptivo y específico
- Indicar el resultado esperado

✅ Correcto: `debe crear emergencia exitosamente`
❌ Incorrecto: `test de emergencia`

---

## 🔄 CI/CD (Futuro)

Para integración continua:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Upload coverage
        run: npm run test:coverage
```

---

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Zustand](https://docs.pmnd.rs/zustand/guides/testing)
- [Jest Expo Preset](https://docs.expo.dev/develop/unit-testing/)

---

## 🎓 Mejores Prácticas

1. **AAA Pattern**: Arrange, Act, Assert
2. **Un concepto por test**: Cada test debe probar una cosa
3. **Tests independientes**: No deben depender de orden de ejecución
4. **Mock externo, test interno**: Mock APIs externas, test lógica interna
5. **Nombres descriptivos**: El nombre debe explicar qué se prueba
6. **Limpieza**: Usar `beforeEach` para resetear estados

---

**Última actualización**: 2025-01-14  
**Versión**: 1.0.0  
**Contacto**: Equipo de Desarrollo Vetya

---

## 💡 Tips Útiles

- Ejecuta `npm run test:watch` mientras desarrollas
- Revisa la cobertura regularmente con `npm run test:coverage`
- Los tests son documentación viva del código
- Si un test falla, verifica primero los mocks
- Usa `waitFor` para operaciones asíncronas
- `act` es necesario para updates de estado

¡Happy Testing! 🎉
