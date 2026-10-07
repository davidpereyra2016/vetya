# Introducción de Zuvia

## Estructura revisada antes de implementar

La app cliente está en `vetya/`; `vetpresta/`, `backend/` y `web/` son proyectos separados y no se modificaron. El inventario de la app incluye `src/screens` (auth, main, onboarding, payment, profile, settings), `src/components/common`, `src/navigation`, `src/store`, `src/services`, `src/config`, `src/context`, `src/utils`, los assets, scripts, pruebas y configuración nativa Android. No hay carpeta nativa `ios/` en este checkout.

- JavaScript, Expo instalado 57.0.26, React Native 0.86.3 y React 19.2.3.
- Entrada: `index.js` → `App.js` → `AppNavigator.js`.
- React Navigation 7: stack y bottom tabs. No usa Expo Router.
- Autenticación activa: Zustand `useAuthStore`, persistencia AsyncStorage (`auth-storage`) y `checkAuth()` con validación de `/users/profile`. El antiguo `AuthContext.js` no está montado en esta entrada.
- Destinos existentes: token nulo → Login; sesión con `isFirstTime` → Onboarding; sesión habitual → MainTabs/Inicio/HomeScreen.
- `AppFrame` aplica Safe Area a las pantallas habituales. La intro se monta fuera de ese marco para ocupar toda la pantalla.
- Splash: plugin `expo-splash-screen` en `app.json`, logo estático y fondo blanco; Android registra `SplashScreenManager` en MainActivity y usa `Theme.App.SplashScreen`. La configuración iOS se genera desde Expo al construir.
- Ya estaban instalados `expo-splash-screen` y `expo-system-ui`; Lottie reproduce JSON, no MP4. Se agregó solamente `expo-video ~57.0.5`, compatible con SDK 57, y su plugin registrado por `expo install`.

## Flujo implementado

Splash nativo estático → primer fotograma local preparado y layout de React Native listo → ocultar splash → reproducir intro → fin real `playToEnd` → navegador existente.

`checkAuth()` se ejecuta en paralelo una vez al montar el navegador. Si el video termina antes de completar la validación, se desmonta el reproductor y se mantiene una pantalla blanca sin controles ni indicadores hasta que haya un destino válido. La política de sesión existente se conserva, incluyendo el logout ante una validación fallida.

La intro no es una ruta del stack: no crea entradas a las que se pueda regresar con atrás, ni necesita `push`, `replace` o `reset`. El botón atrás se consume durante el arranque. Una bandera en memoria evita repetirla durante esa ejecución, incluyendo logout, remontaje del navegador y regreso desde segundo plano. Un arranque nuevo del runtime JavaScript vuelve a mostrarla; una recarga de desarrollo también constituye un nuevo arranque.

El video se prepara pausado. Tras `onFirstFrameRender` y `onLayout`, se oculta el splash y comienza la reproducción. Una cubierta blanca evita exponer la superficie del reproductor antes del primer fotograma. No hay transición decorativa.

La reproducción usa `contain`, fondo exterior `#FFFFFF`, silencio, mezcla con otro audio, sin bucle, controles, PiP, pantalla completa nativa del reproductor ni interacción. Ocupa la pantalla de React Native completa, incluida la zona de Safe Area. La status bar está oculta durante la intro y recupera la configuración habitual después. Android conserva su configuración edge-to-edge y barra de navegación transparente; confirmar el comportamiento de gestos y tres botones en dispositivos reales.

Al enviar la app al fondo se pausa; al volver continúa desde su posición. Los listeners y la salvaguarda se limpian al desmontar y `useVideoPlayer` libera automáticamente el reproductor. El avance normal depende del final del archivo, no de un temporizador. Los errores de reproducción permiten continuar; existe además un límite de 15 segundos solo para la preparación inicial fallida, suspendido en segundo plano.

## Asset

`assets/videos/zuvia-intro.mp4` es una copia exacta del archivo suministrado, verificada por SHA-256. La excepción específica en `.gitignore` permite incluirlo en Git a pesar de la regla general que ignora MP4. Se carga con `require`, sin URL ni descarga externa en builds instaladas. Metro sirve assets localmente durante desarrollo, como el resto de recursos de Expo.

- Duración: 5,10 segundos, 720×1280, 30 fps, H.264/yuv420p, audio AAC, 564.862 bytes.
- SHA-256: `62213DFEA9A156559EC862EF989E3478A78DF8EFF541DC965E54EA734F203592`.
- **Limitación visual del original:** el primer fotograma contiene fondo gris claro con textura y todavía no muestra el logo. El fondo exterior de la app es blanco puro, pero no transforma los píxeles del MP4. El splash estático conserva su logo actual. Una continuidad exacta y blanco puro dentro del video requieren un archivo de animación que ya tenga esas características.

## Pruebas manuales

### Android

1. En `E:\vetya_1.0\vetya`, ejecutar `npm run android` con un dispositivo o emulador disponible. Recompilar el cliente nativo: un APK anterior no contiene `expo-video`.
2. Para release local: en `android/`, con JDK 21, ejecutar `./gradlew.bat :app:assembleRelease`; instalar el APK generado. También se puede construir con el perfil EAS existente `preview`.
3. Forzar cierre y abrir desde el icono: splash estático, video completo, luego Login sin sesión, Inicio con sesión validada u Onboarding cuando corresponda.
4. Durante la intro tocar la pantalla y presionar atrás: no debe haber controles ni cambio de ruta. Después, atrás no debe regresar al video.
5. Enviar al fondo a mitad del video y volver: debe continuar, sin empezar otra vez. Después del final, repetir este paso y cerrar sesión: no debe reaparecer la intro.
6. Revisar teléfonos 16:9 y más altos, gestos y tres botones: logo completo, centrado, sin estiramientos, barras negras ni otra pantalla antes del final. Revisar debug y release; Expo Go no representa fielmente el splash de una build instalada.
7. En release, abrir sin internet para comprobar que el video sigue funcionando. La sesión seguirá la política de autenticación ya existente y puede terminar en Login si no logra validar el perfil.

### iOS

1. En macOS, instalar dependencias y ejecutar `npm run ios` para generar/compilar la configuración Expo e iniciar un simulador. Windows no puede compilar ni ejecutar iOS nativo.
2. Para un iPhone físico y build release interna, usar el perfil existente: `npx eas-cli build --platform ios --profile preview`; completar las credenciales de Apple y el registro del dispositivo de forma privada e instalar la build resultante.
3. Forzar cierre y abrir desde el icono. Comprobar LaunchScreen estático → video local → destino de sesión, notch/Dynamic Island, Safe Area, status bar y ausencia de controles o pantalla negra.
4. Repetir los casos de sesión, segundo plano, proporciones y reproducción offline de Android, tanto en dispositivo físico como en release.

## Verificación automatizada

- `npx jest src/__tests__/integration/introFlow.test.js --runInBand --silent`: 6/6 pruebas aprobadas. Se prueban espera del primer fotograma/layout, evento real de finalización, pausa/reanudación, errores, salvaguarda de carga, rutas existentes, atrás y no repetición. Estas pruebas usan mocks nativos; no demuestran decodificación o fluidez en dispositivos.
- Los 84 archivos JavaScript de `src/` y las entradas `App.js`/`index.js` se analizaron con el parser Babel sin errores de sintaxis. `git diff --check` no encontró errores de espacios en el diff.
- `expo install --check` confirma que no señala `expo-video` como incompatible, pero falla por cinco actualizaciones patch pendientes de dependencias preexistentes (Expo, Constants, Image Manipulator, Maps y Notifications). No se actualizaron por estar fuera del alcance.
- La verificación visual y funcional en dispositivos Android/iOS, incluyendo release, queda pendiente: no había dispositivos conectados al ejecutar este trabajo.
- Se intentó `:app:assembleDebug :app:assembleRelease` con JDK 21. Gradle no pudo configurar el proyecto porque otro proceso tenía el bloqueo `android/.gradle/noVersion/buildLogic.lock` (PID 18944). No se detuvo ese proceso ajeno. Este intento no confirma compilación debug ni release.
- Se intentó exportar Android/iOS con Expo y se reintentó con `CI=1` y dos workers. Metro no completó la exportación durante estas ejecuciones; ambos procesos propios se cancelaron. No se confirma un bundle final ni la compilación iOS. El servidor Metro que ya estaba abierto por el usuario se dejó intacto.
