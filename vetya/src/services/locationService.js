import * as Location from 'expo-location';
import { userService } from './api';

const DEFAULT_COORDS_OPTIONS = {
  accuracy: Location.Accuracy.High
};

function buildAddressFromGeocode(place) {
  if (!place) {
    return {
      direccion: 'Dirección no disponible',
      ciudad: 'Ciudad no especificada'
    };
  }

  const partesDireccion = [];
  if (place.street) partesDireccion.push(place.street);
  if (place.streetNumber) partesDireccion.push(place.streetNumber);
  if (place.name && !partesDireccion.includes(place.name)) partesDireccion.push(place.name);

  return {
    direccion: partesDireccion.length > 0 ? partesDireccion.join(' ') : 'Dirección no disponible',
    ciudad: place.city || place.subregion || place.region || 'Ciudad no especificada'
  };
}

export async function syncCurrentUserLocation(options = {}) {
  const {
    requestPermission = true,
    saveToBackend = true,
    coordsOptions = DEFAULT_COORDS_OPTIONS
  } = options;

  try {
    let permissionStatus;

    if (requestPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      permissionStatus = status;
    } else {
      const { status } = await Location.getForegroundPermissionsAsync();
      permissionStatus = status;
    }

    if (permissionStatus !== 'granted') {
      return {
        success: false,
        permissionDenied: true,
        error: 'Se requiere permiso de ubicación'
      };
    }

    const currentLocation = await Location.getCurrentPositionAsync(coordsOptions);
    const latitude = currentLocation.coords.latitude;
    const longitude = currentLocation.coords.longitude;

    let direccion = 'Dirección no disponible';
    let ciudad = 'Ciudad no especificada';

    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = buildAddressFromGeocode(geocode?.[0]);
      direccion = address.direccion;
      ciudad = address.ciudad;
    } catch (geocodeError) {
      console.log('⚠️ Error en geocodificación inversa:', geocodeError);
    }

    if (saveToBackend) {
      const result = await userService.updateCurrentLocation(latitude, longitude);
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'No se pudo guardar la ubicación actual'
        };
      }
    }

    return {
      success: true,
      data: {
        latitude,
        longitude,
        direccion,
        ciudad,
        lat: latitude,
        lng: longitude,
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error al sincronizar ubicación del usuario:', error);
    return {
      success: false,
      error: 'No se pudo obtener tu ubicación actual'
    };
  }
}
