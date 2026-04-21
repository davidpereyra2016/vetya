// usePublicidadStore.js - Estado global para banners publicitarios
import { create } from 'zustand';
import * as publicidadService from '../services/publicidadService';

const usePublicidadStore = create((set, get) => ({
  // Estado
  banners: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  /**
   * Obtiene los banners publicitarios activos desde el backend.
   * @param {boolean} force - Si true, ignora el cache y vuelve a pedirlos.
   */
  fetchBanners: async (force = false) => {
    const { lastFetched, banners } = get();
    // Cache simple de 5 min para evitar llamadas redundantes
    const CACHE_MS = 5 * 60 * 1000;
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_MS && banners.length > 0) {
      return banners;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await publicidadService.getBannersActivos();
      const banners = Array.isArray(data?.banners) ? data.banners : [];
      set({ banners, isLoading: false, lastFetched: Date.now() });
      return banners;
    } catch (error) {
      console.error('Error en fetchBanners:', error);
      set({ error: error?.message || 'Error al cargar banners', isLoading: false });
      return [];
    }
  },

  clearBanners: () => set({ banners: [], error: null, lastFetched: null }),
}));

export default usePublicidadStore;
