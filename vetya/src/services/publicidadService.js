// publicidadService.js - Servicio para banners publicitarios (Cloudinary)
import axios from '../config/axios';

/**
 * Obtiene los banners publicitarios activos desde el backend.
 * Endpoint PUBLICO: /api/publicidad/banners-activos
 * Devuelve: { success, total, banners: [{ _id, urlImagen, enlace, orden, ... }] }
 */
export const getBannersActivos = async () => {
  try {
    const response = await axios.get('/publicidad/banners-activos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener banners publicitarios:', error);
    throw error;
  }
};

export default {
  getBannersActivos,
};
