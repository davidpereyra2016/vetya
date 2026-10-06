# Zuvia — assets de marca

Los SVG contienen contornos editables, sin imágenes incrustadas ni fuentes externas. Se trazaron a partir de la referencia suministrada; son una recreación del raster, no el archivo vectorial original. La palabra usa `#1E88E5`, el lema `#243D5D` y el isotipo un degradado de `#5AB6A9` a `#9FE0BF`. El punto de la i es cuadrado y está separado del camino.

- `zuvia_logo.svg`: logotipo completo, 1000 × 700.
- `zuvia_icon.svg`: isotipo independiente, 895 × 360.
- `zuvia_logo.png` y `@1x`, `@2x`, `@3x`: 320 × 224, 640 × 448 y 960 × 672. React Native resuelve automáticamente las densidades al importar el archivo base.
- `zuvia_icon.png` y densidades: isotipo transparente.
- `icon.png`: 1024 × 1024, fondo blanco opaco.
- `adaptive-icon.png`: 1024 × 1024, foreground transparente y margen para las máscaras Android.
- `splash-icon.png`: isotipo transparente para `expo-splash-screen`.
- `splash.png`: composición vertical blanca de 1284 × 2778 con el logotipo completo; archivo de entrega, no splash nativo de pantalla completa.
- `ios/AppIcon.appiconset`: catálogo de exportación con 18 entradas para iPhone, iPad y App Store; PNG sin transparencia.

## Integración

`app.json` usa los nuevos assets y el nombre visible Zuvia. Android tiene PNG en las cinco densidades, foreground adaptativo, splash y nombre visible actualizados. Se retiraron los WEBP con nombres de recurso idénticos para evitar duplicados en AAPT.

No existía un proyecto `ios/` en esta app. El catálogo queda preparado aquí para importar en Xcode. Expo generará el proyecto iOS y sus iconos a partir de `app.json` durante prebuild/EAS. No se creó un directorio nativo incompleto: eso podría hacer que EAS lo interpretase como un proyecto Xcode existente. La integración nativa iOS requiere generar y compilar ese proyecto.

Se intentó `expo prebuild --platform ios --no-install` en Windows: Expo lo omitió expresamente y solicitó macOS o Linux. No se generó ni compiló un proyecto iOS.

Se conservaron slug, scheme, package/bundle identifier, EAS projectId, endpoints, claves y correo de soporte existentes. Los cambios en términos y privacidad son únicamente el nombre comercial.

## Reproducir

Desde la raíz del repositorio, con Inkscape y Python 3.12 con Pillow, OpenCV y fontTools:

```powershell
py -3.12 vetya/scripts/generate_zuvia_assets.py 'C:/Users/Asus/Downloads/Gemini_Generated_Image_8ke7218ke7218ke7.jfif'
```

El script utiliza Century Gothic del sistema para convertir el lema en contornos. Inkscape rasteriza los SVG maestros; las variantes se reducen con Lanczos.

Inkscape 1.4.4 se instaló y abrió, pero el MCP de control gráfico falló al capturar su ventana. La generación se completó por código y la consola de Inkscape; no se acredita una vectorización manual por GUI ni identidad pixel a pixel con el original.

Un cambio de icono/splash requiere reconstruir la aplicación nativa; Expo Go no permite comprobar todas las propiedades del splash. Referencia: https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/

## Verificación local

`py -3.12 scripts/verify_zuvia_assets.py` valida dimensiones, transparencia, las 18 entradas del catálogo iOS, las cinco densidades Android, el punto cuadrado y las rutas de configuración. Pasó tras la corrección del punto.

Jest: 28/29 en la primera corrida; un timeout de EmergencyForm se repitió aisladamente y sus 5 casos pasaron. Resultado combinado: 29/29 casos únicos. La exportación de bundles Android e iOS pasó. Esto no acredita ejecución en dispositivo ni un build nativo iOS.

Android: `:app:processDebugResources` pasó con JDK 21 tras resolver las dependencias en línea (169 tareas). Se validaron el procesamiento de recursos y manifests; no se generó ni instaló un APK nuevo.
