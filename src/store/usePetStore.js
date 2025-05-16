import { create } from 'zustand';
import axios from 'axios';

/**
 * Store para gestionar el estado de las mascotas usando Zustand
 */
const usePetStore = create((set, get) => ({
  // Estado inicial
  pets: [],
  currentPet: null,
  isLoading: false,
  error: null,

  // Obtener todas las mascotas del usuario
  fetchPets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/mascotas');
      set({ 
        pets: response.data, 
        isLoading: false 
      });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener las mascotas';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Obtener una mascota por ID
  fetchPetById: async (petId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/mascotas/${petId}`);
      set({ 
        currentPet: response.data, 
        isLoading: false 
      });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener la mascota';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Crear una nueva mascota
  createPet: async (petData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/mascotas', petData);
      set({ 
        pets: [...get().pets, response.data], 
        isLoading: false 
      });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear la mascota';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Actualizar una mascota existente
  updatePet: async (petId, petData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/mascotas/${petId}`, petData);
      
      // Actualizar la lista de mascotas y la mascota actual si está seleccionada
      set({ 
        pets: get().pets.map(pet => pet._id === petId ? response.data : pet),
        currentPet: get().currentPet?._id === petId ? response.data : get().currentPet,
        isLoading: false 
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar la mascota';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Eliminar una mascota
  deletePet: async (petId) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/mascotas/${petId}`);
      
      // Actualizar la lista de mascotas y limpiar la mascota actual si era la eliminada
      set({ 
        pets: get().pets.filter(pet => pet._id !== petId),
        currentPet: get().currentPet?._id === petId ? null : get().currentPet,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar la mascota';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Añadir entrada al historial médico
  addMedicalRecord: async (petId, recordData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`/mascotas/${petId}/historial`, recordData);
      
      // Actualizar la mascota actual con el nuevo historial
      const updatedPet = response.data;
      set({ 
        pets: get().pets.map(pet => pet._id === petId ? updatedPet : pet),
        currentPet: get().currentPet?._id === petId ? updatedPet : get().currentPet,
        isLoading: false 
      });
      
      return { success: true, data: updatedPet };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al añadir historial médico';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Limpiar error
  clearError: () => set({ error: null }),
  
  // Establecer mascota actual
  setCurrentPet: (pet) => set({ currentPet: pet }),
  
  // Limpiar mascota actual
  clearCurrentPet: () => set({ currentPet: null })
}));

export default usePetStore;
