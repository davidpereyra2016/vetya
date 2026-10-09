# Mapa 3D local de Formosa

La pantalla `EmergencyTrackingMapScreen` usa 120 GLB de calles y edificios de OpenStreetMap, divididos en una cuadrícula de 12 × 12 sobre la caja de la ciudad de Formosa. Sólo carga los sectores cercanos a la cámara. El visor Three.js se compiló con el repositorio MIT [`cartesiancs/map3d`](https://github.com/cartesiancs/map3d), descargado como `../map3d-source`. No hay imágenes aéreas ni texturas: el repositorio original tampoco las exporta. Los datos OSM están sujetos a ODbL y se atribuyen en la pantalla.

Para reconstruir el mapa desde datos nuevos, desde `E:\vetya_1.0`:

```powershell
git clone https://github.com/cartesiancs/map3d map3d-source
npm ci --prefix map3d-source
./vetya/tools/formosa/fetch.ps1
cd vetya
node tools/formosa/generate.mjs
node tools/formosa/generate-routes.mjs
node tools/formosa/build-viewer.mjs
node tools/formosa/verify.mjs
node tools/formosa/test-route.mjs
```

`fetch.ps1` consulta 16 áreas pequeñas de Overpass y conserva los JSON en `map3d-source/osm` para reproducibilidad. Los archivos GLB generados y el visor quedan incorporados en `assets/maps/formosa` y no necesitan descargas durante el uso. El campo `generatedAt` del manifiesto registra cuándo se regeneraron.

El marcador del veterinario se redondea a una cuadrícula de ~1 km. Un grafo de calles transitables almacenado en `roads.bin` alimenta A* con distancias geodésicas; se respetan las calles de una mano registradas y se evita el acceso marcado como privado. El trazo es una estimación por calles y la animación de 60 segundos es una vista previa, no navegación ni seguimiento en tiempo real. Si las posiciones no pueden conectarse a la red vial, se muestra un trazo lineal de referencia identificado como tal. Fuera de la caja de Formosa se usa el mapa 2D ya instalado. No se modelan tráfico, giros prohibidos ni cierres temporales; la fidelidad depende de OpenStreetMap.

## Elección del algoritmo

- **Dijkstra:** correcto para distancias positivas, pero explora más nodos sin la guía geográfica y el ejemplo adjunto ordena toda la cola en cada iteración.
- **A\*:** elegido. La distancia geodésica en línea recta nunca excede el recorrido por calles cuando cada arista se pesa por su longitud, así que guía la búsqueda sin perder el camino mínimo entre los nodos viales elegidos. Se usa un montículo mínimo y se valida que exista una ruta antes de reconstruirla.
- **BFS bidireccional:** minimiza el número de aristas, no la distancia recorrida; no sirve para calles de longitudes distintas.
- **Greedy Best-First:** puede escoger un rodeo por atender sólo la cercanía aparente al destino.
- **Beam Search:** puede descartar la única conexión útil. Además, el ejemplo recibido inicializa `prev` con todos los nodos y luego sólo expande vecinos que no estén allí, por lo que no avanzaría.
