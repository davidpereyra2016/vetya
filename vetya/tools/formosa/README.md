# Mapa 3D local de Formosa

La pantalla `EmergencyTrackingMapScreen` usa 120 GLB de calles y edificios de OpenStreetMap, divididos en una cuadrícula de 12 × 12 sobre la caja de la ciudad de Formosa. Sólo carga los sectores cercanos a la cámara. El visor Three.js se compiló con el repositorio MIT [`cartesiancs/map3d`](https://github.com/cartesiancs/map3d), descargado como `../map3d-source`. No hay imágenes aéreas ni texturas: el repositorio original tampoco las exporta. Los datos OSM están sujetos a ODbL y se atribuyen en la pantalla.

Para reconstruir el mapa desde datos nuevos, desde `E:\vetya_1.0`:

```powershell
git clone https://github.com/cartesiancs/map3d map3d-source
npm ci --prefix map3d-source
./vetya/tools/formosa/fetch.ps1
cd vetya
node tools/formosa/generate.mjs
node tools/formosa/build-viewer.mjs
node tools/formosa/verify.mjs
```

`fetch.ps1` consulta 16 áreas pequeñas de Overpass y conserva los JSON en `map3d-source/osm` para reproducibilidad. Los archivos GLB generados y el visor quedan incorporados en `assets/maps/formosa` y no necesitan descargas durante el uso. El campo `generatedAt` del manifiesto registra cuándo se regeneraron.

El marcador del veterinario se redondea a una cuadrícula de ~1 km. El trazo entre el veterinario y el cliente es recto y la animación de 60 segundos es una vista previa, no una ruta por calles ni seguimiento en tiempo real. Fuera de la caja de Formosa se usa el mapa 2D ya instalado. La fidelidad de alturas y edificios depende de lo que haya registrado en OpenStreetMap.
