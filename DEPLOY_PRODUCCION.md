# Deploy de Produccion

Esta guia resume como desplegar backend y generar nuevos APK/AAB de `vetya` y `vetpresta` usando Render, Resend y Expo.

## 1. Backend en Render

El backend se despliega con el archivo [`render.yaml`](./render.yaml).

Flujo normal:

1. Hacer commit de los cambios.
2. Hacer push a `main`.
3. Render detecta el push y vuelve a desplegar automaticamente.
4. Verificar el health check en `/api/health`.

Variables que deben existir en Render:

- `BACKEND_URL`
- `MONGO_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_PUBLIC_KEY`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `RESEND_FROM`

Notas importantes:

1. El backend ya esta preparado para priorizar `Resend` si `RESEND_API_KEY` existe.
2. `RESEND_FROM` debe usar un dominio verificado en Resend, por ejemplo `VetYa <no-reply@tu-dominio.com>`.
3. En la configuracion actual de produccion se esta usando `VetYa <no-reply@vetya.nodosmart.io>`.
4. `vetya-backend.onrender.com` no sirve como dominio de envio masivo porque no tienes control DNS sobre `onrender.com`.
5. Si Resend no tiene un dominio real verificado, el registro puede crear usuarios pero `emailSent` va a volver como `false`.

## 2. URL del backend para Expo

Las dos apps leen la API productiva desde `EXPO_PUBLIC_API_URL`.

Archivos que ya quedaron preparados:

- `vetya/src/config/axios.js`
- `vetpresta/src/config/axios.js`

Si cambia la URL del backend en produccion:

1. Actualizar `EXPO_PUBLIC_API_URL` en Expo.
2. Generar un nuevo build Android.

En Expo ya debe existir:

- `EXPO_PUBLIC_API_URL=https://vetya-backend.onrender.com/api`

## 3. Generar un nuevo APK de vetya

Desde `vetya/`:

```powershell
npx eas-cli@latest build --platform android --profile android-production
```

Observacion:

- El build en `expo.dev` puede tardar cerca de 1 hora en completarse, dependiendo de la cola de EAS.

Para ver el estado:

```powershell
npx eas-cli@latest build:list --platform android --limit 5
```

## 4. Generar un nuevo AAB de vetya para Play Store

Desde `vetya/`:

```powershell
npx eas-cli@latest build --platform android --profile android-store
```

Notas:

- No hace falta ejecutar nuevamente `eas build:configure` si `eas.json` ya existe.
- El perfil `android-store` genera un Android App Bundle (`.aab`), que es el formato esperado por Google Play.
- El perfil `android-production` se mantiene para generar APK instalables manualmente.

## 5. Generar un nuevo APK de vetpresta

Desde `vetpresta/`:

```powershell
npx eas-cli@latest build --platform android --profile android-production
```

Observacion:

- El build en `expo.dev` puede tardar cerca de 1 hora en completarse, dependiendo de la cola de EAS.

Para ver el estado:

```powershell
npx eas-cli@latest build:list --platform android --limit 5
```

## 6. Generar un nuevo AAB de vetpresta para Play Store

Desde `vetpresta/`:

```powershell
npx eas-cli@latest build --platform android --profile android-store
```

Notas:

- No hace falta ejecutar nuevamente `eas build:configure` si `eas.json` ya existe.
- El perfil `android-store` genera un Android App Bundle (`.aab`), que es el formato esperado por Google Play.
- El perfil `android-production` se mantiene para generar APK instalables manualmente.

## 7. Cuando hay cambios solo en backend

Si modificas archivos dentro de `backend/`:

1. Commit.
2. Push a `main`.
3. Render redeploya automaticamente.
4. No hace falta regenerar APK salvo que la app tambien haya cambiado.

## 8. Cuando hay cambios en una app

Si modificas `vetya/` o `vetpresta/`:

1. Commit.
2. Push a `main`.
3. Ejecutar un nuevo build EAS de la app modificada.
4. Descargar el APK o AAB desde Expo cuando termine.

## 9. Verificaciones recomendadas

- Backend: abrir `https://TU_BACKEND/api/health`
- Expo: revisar el build en `expo.dev`
- App: instalar el APK y validar login, llamadas API y flujos principales
- Resend: validar que el dominio este en estado `verified` antes de esperar envio real a correos de terceros
