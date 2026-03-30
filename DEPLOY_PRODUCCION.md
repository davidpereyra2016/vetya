# Deploy de Produccion

Esta guia resume como desplegar backend y generar nuevos APK de `vetya` y `vetpresta` usando Render y Expo.

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

## 2. URL del backend para Expo

Las dos apps leen la API productiva desde `EXPO_PUBLIC_API_URL`.

Archivos que ya quedaron preparados:

- `vetya/src/config/axios.js`
- `vetpresta/src/config/axios.js`

Si cambia la URL del backend en produccion:

1. Actualizar `EXPO_PUBLIC_API_URL` en Expo.
2. Generar un nuevo build Android.

## 3. Generar un nuevo APK de vetya

Desde `vetya/`:

```powershell
npx eas-cli@latest build --platform android --profile android-production
```

Para ver el estado:

```powershell
npx eas-cli@latest build:list --platform android --limit 5
```

## 4. Generar un nuevo APK de vetpresta

Desde `vetpresta/`:

```powershell
npx eas-cli@latest build --platform android --profile android-production
```

Para ver el estado:

```powershell
npx eas-cli@latest build:list --platform android --limit 5
```

## 5. Cuando hay cambios solo en backend

Si modificas archivos dentro de `backend/`:

1. Commit.
2. Push a `main`.
3. Render redeploya automaticamente.
4. No hace falta regenerar APK salvo que la app tambien haya cambiado.

## 6. Cuando hay cambios en una app

Si modificas `vetya/` o `vetpresta/`:

1. Commit.
2. Push a `main`.
3. Ejecutar un nuevo build EAS de la app modificada.
4. Descargar el APK desde Expo cuando termine.

## 7. Verificaciones recomendadas

- Backend: abrir `https://TU_BACKEND/api/health`
- Expo: revisar el build en `expo.dev`
- App: instalar el APK y validar login, llamadas API y flujos principales
