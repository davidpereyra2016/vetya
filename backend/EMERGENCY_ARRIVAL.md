# Confirmación de llegada mediante código — Zuvia / VetPresta

## Comportamiento

Al solicitar una emergencia se genera un código aleatorio de cuatro dígitos (incluye ceros iniciales). Zuvia lo muestra en la tarjeta de espera de HomeScreen. El cliente lo entrega únicamente al llegar el veterinario. VetPresta permite ingresarlo desde el detalle de la emergencia.

Solo el veterinario asignado, con tipo `Veterinario`, puede validar el código. Desde `Asignada`, `Confirmada` o `En camino` la validación pasa a `En atención`. No se requiere marcar previamente `En camino`; sí aceptar la solicitud. La ruta genérica de estados y la antigua confirmación del cliente no permiten saltar esta validación. No se puede completar la atención sin llegada confirmada ni volver a estados anteriores después de iniciarla. Las emergencias cerradas no admiten nuevas validaciones.

Los reintentos de una validación exitosa no agregan confirmaciones ni entradas de historial. Cinco códigos incorrectos bloquean la validación durante cinco minutos. Los intentos concurrentes se serializan mediante transacciones de MongoDB.

## Persistencia y API

Colección Mongoose `llegadaemergencias`, modelo `LlegadaEmergencia`:

- Referencias a `Emergencia`, `User` (cliente) y `Prestador` (veterinario; nulo mientras no haya asignación).
- Código estable, oculto por defecto en consultas (`select: false`).
- Fecha y usuario que confirmó la llegada, intentos fallidos, bloqueo e historial de intentos autorizados.
- Estado de la emergencia y fecha de cancelación. El registro y el código se conservan aunque se cancele; no hay TTL.

La emergencia y su código se crean juntos en una transacción. La confirmación y el inicio de atención también se guardan juntos. Las actualizaciones mediante `save()` usan control de versión para impedir que una lectura anterior sobrescriba una validación concurrente. El registro se sincroniza al guardar asignaciones o cancelaciones.

| Ruta bajo `/api/emergencias` | Permiso | Resultado |
| --- | --- | --- |
| `GET /:id/codigo-llegada` | Cliente propietario | Código mientras espera; respuesta `no-store`. |
| `PATCH /:id/validar-llegada` con `{ "codigo": "0042" }` | Veterinario asignado | Confirma llegada e inicia atención; evento Socket.IO para las partes. |
| `GET /:id/registro-llegada` | Cliente o veterinario relacionado | Registro de telemetría sin código, incluso después de cancelar. |
| `PATCH /:id/confirmar-llegada` | Cliente propietario | Conserva la preparación/recuperación del pago; exige llegada ya validada e `Idempotency-Key`. |

El código no se agrega a listados, eventos Socket.IO, notificaciones ni logs. Las lecturas de código y registro omiten la caché Redis para verificar autorización y estado actuales. Las emergencias activas anteriores al despliegue reciben un código al abrir la tarjeta; las cerradas no se reactivan. Las que ya estaban en atención mantienen su confirmación anterior y el acceso al cobro. El pago en efectivo usa la clave única existente `checkoutKey` para evitar registros duplicados entre consultas concurrentes.

## Publicación y operación

No requiere variables nuevas en Render ni una migración destructiva. Mongoose crea la colección y sus índices al iniciar con permisos normales de la aplicación. MongoDB debe admitir transacciones (replica set o cluster distribuido); la conexión configurada se comprobó en modo de solo lectura y admite transacciones. También se comprobó que `emergencias` no tiene TTL.

`render.yaml` configura `rootDir: backend` y despliegue automático. El push debe ir a la rama conectada al servicio. La configuración efectiva del panel y el resultado del deploy deben verificarse aparte. Actualizar ambos clientes es necesario: versiones anteriores no muestran ni ingresan el código. Un redeploy de Render solo actualiza el backend; los iconos nativos nuevos requieren una nueva compilación de Zuvia.

## Verificación local (2026-10-05, fecha del usuario)

- `node --test backend/tests/emergency-arrival.test.mjs`: 12/12, HTTP/JWT/MongoDB replica set descartable y Socket.IO. Incluye permisos, código estable, ceros iniciales, bloqueo/desbloqueo, estados habilitados, simultaneidad, historial único, cierre, conservación tras cancelar, pago efectivo único y rollback ante un fallo de persistencia.
- Integración general de emergencias: 10 escenarios correctos; solicitudes simultáneas producen una sola emergencia.
- Auditoría de pagos/OAuth: 64/64 con Mercado Pago simulado. Comprueba checkout tras validación y recuperación después de reconectar el vendedor; no acredita cobros reales.
- Zuvia: 29 pruebas existentes correctas y 3 pruebas nuevas de visualización del código, ocultación tras llegada y error de red.
- VetPresta: 32/32. Se corrigió una fecha de prueba que mezclaba UTC y hora local; no se cambió la lógica de citas.
- Exportaciones Expo Android e iOS correctas para ambas apps.

No se ejecutó una emergencia real, un cobro real ni una prueba en dispositivos. Las exportaciones no equivalen a APK/IPA instalados. Los logs suministrados se convirtieron con MarkItDown local a `qa/reports/arrival-request-logs.local.md` y se conservaron únicamente en local por contener datos personales. Los `.py` y las salidas temporales de validación no forman parte de la publicación.
