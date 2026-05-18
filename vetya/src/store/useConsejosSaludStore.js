import { create } from 'zustand';
import * as consejosSaludService from '../services/consejosSaludService';

const CACHE_MS = 5 * 60 * 1000;

const shouldUseCache = (lastFetched, items, force) =>
  !force && lastFetched && Date.now() - lastFetched < CACHE_MS && Array.isArray(items) && items.length > 0;

const useConsejosSaludStore = create((set, get) => ({
  consejos: [],
  destacados: [],
  categorias: [],
  selectedConsejo: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  pagination: null,
  lastFetched: null,
  lastFetchedDestacados: null,
  lastFetchedCategorias: null,

  fetchConsejos: async (params = {}, force = false) => {
    const { consejos, lastFetched } = get();
    if (shouldUseCache(lastFetched, consejos, force) && Object.keys(params).length === 0) return consejos;

    set({ isLoading: !force, isRefreshing: force, error: null });
    try {
      const result = await consejosSaludService.getConsejos({ activo: true, ...params });
      set({
        consejos: result.data,
        pagination: result.pagination,
        isLoading: false,
        isRefreshing: false,
        lastFetched: Date.now(),
      });
      return result.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar consejos de salud',
        isLoading: false,
        isRefreshing: false,
      });
      return [];
    }
  },

  fetchConsejosDestacados: async (force = false) => {
    const { destacados, lastFetchedDestacados } = get();
    if (shouldUseCache(lastFetchedDestacados, destacados, force)) return destacados;

    set({ error: null });
    try {
      const result = await consejosSaludService.getConsejos({ activo: true, destacado: true, limit: 4 });
      set({ destacados: result.data, lastFetchedDestacados: Date.now() });
      return result.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar consejos destacados' });
      return [];
    }
  },

  fetchConsejoById: async (id) => {
    if (!id) return null;
    set({ isLoading: true, error: null });
    try {
      const consejo = await consejosSaludService.getConsejoById(id);
      set({ selectedConsejo: consejo, isLoading: false });
      return consejo;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cargar el consejo',
        isLoading: false,
      });
      return null;
    }
  },

  fetchCategorias: async (force = false) => {
    const { categorias, lastFetchedCategorias } = get();
    if (shouldUseCache(lastFetchedCategorias, categorias, force)) return categorias;

    try {
      const categorias = await consejosSaludService.getCategorias();
      set({ categorias, lastFetchedCategorias: Date.now() });
      return categorias;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al cargar categorias' });
      return [];
    }
  },

  searchConsejos: async (texto, params = {}) => {
    if (!texto?.trim()) return get().fetchConsejos(params, true);
    set({ isLoading: true, error: null });
    try {
      const result = await consejosSaludService.searchConsejos(texto.trim(), params);
      set({ consejos: result.data, pagination: result.pagination, isLoading: false });
      return result.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al buscar consejos',
        isLoading: false,
      });
      return [];
    }
  },

  likeConsejo: async (id) => {
    try {
      const result = await consejosSaludService.likeConsejo(id);
      const likes = result?.likes;
      if (typeof likes === 'number') {
        set((state) => ({
          selectedConsejo: state.selectedConsejo?.id === id ? { ...state.selectedConsejo, likes } : state.selectedConsejo,
          consejos: state.consejos.map((item) => (item.id === id ? { ...item, likes } : item)),
          destacados: state.destacados.map((item) => (item.id === id ? { ...item, likes } : item)),
        }));
      }
      return result;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error al dar like' });
      return null;
    }
  },

  clearSelectedConsejo: () => set({ selectedConsejo: null }),
  clearError: () => set({ error: null }),
}));

export default useConsejosSaludStore;
