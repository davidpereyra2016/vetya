# Sonidos de Notificación

Este directorio contiene los archivos de sonido para las notificaciones push.

## Archivos requeridos:

- `emergency_sound.wav` - Sonido para notificaciones de emergencia (alta prioridad)

## Notas:

- Los archivos de sonido deben estar en formato `.wav`
- Se recomienda que los sonidos tengan una duración máxima de 30 segundos
- Para iOS, los sonidos deben tener una frecuencia de muestreo de 44.1 kHz o menos

## Cómo agregar sonidos personalizados:

1. Coloca el archivo `.wav` en este directorio
2. Asegúrate de que el nombre coincida con el configurado en `app.json`
3. Reconstruye la aplicación con `expo prebuild` o `eas build`
