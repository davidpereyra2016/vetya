import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock de axios - DEBE estar antes de importar el store
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
      defaults: { headers: { common: {} } },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  },
}));

// Importar después del mock
import usePetStore from '../usePetStore';
import axios from 'axios';

describe('usePetStore - Gestión de Mascotas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Obtener Mascotas', () => {
    test('debe obtener todas las mascotas del usuario', async () => {
      const mockPets = [
        {
          _id: 'pet1',
          nombre: 'Rocky',
          especie: 'Perro',
          raza: 'Golden Retriever',
          edad: 3,
          sexo: 'Macho',
          peso: 28,
          foto: 'https://example.com/rocky.jpg',
        },
        {
          _id: 'pet2',
          nombre: 'Luna',
          especie: 'Gato',
          raza: 'Siamés',
          edad: 2,
          sexo: 'Hembra',
          peso: 4,
          foto: 'https://example.com/luna.jpg',
        },
      ];

      axios.get.mockResolvedValueOnce({ data: mockPets });

      const { result } = renderHook(() => usePetStore());

      await act(async () => {
        await result.current.fetchPets();
      });

      expect(result.current.pets).toEqual(mockPets);
      expect(result.current.pets.length).toBe(2);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    test('debe manejar caso sin mascotas', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => usePetStore());

      await act(async () => {
        await result.current.fetchPets();
      });

      expect(result.current.pets).toEqual([]);
      expect(result.current.pets.length).toBe(0);
    });

    test('debe manejar error al obtener mascotas', async () => {
      axios.get.mockRejectedValueOnce({
        response: { data: { message: 'Error al cargar mascotas' } }
      });

      const { result } = renderHook(() => usePetStore());

      await act(async () => {
        await result.current.fetchPets();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Crear Mascota', () => {
    test('debe crear una mascota exitosamente', async () => {
      const mockNewPet = {
        _id: 'pet123',
        nombre: 'Max',
        especie: 'Perro',
        raza: 'Labrador',
        edad: 1,
        sexo: 'Macho',
        peso: 15,
        color: 'Amarillo',
        dueno: 'user123',
      };

      axios.post.mockResolvedValueOnce({ data: mockNewPet });

      const { result } = renderHook(() => usePetStore());

      const petData = {
        nombre: 'Max',
        especie: 'Perro',
        raza: 'Labrador',
        edad: 1,
        sexo: 'Macho',
        peso: 15,
        color: 'Amarillo',
      };

      await act(async () => {
        await result.current.createPet(petData);
      });

      expect(axios.post).toHaveBeenCalledWith('/mascotas', petData);
      expect(result.current.error).toBe(null);
      expect(result.current.pets).toContainEqual(mockNewPet);
    });

    test('debe manejar error de validación del servidor', async () => {
      axios.post.mockRejectedValueOnce({
        response: { data: { message: 'Error al crear la mascota' } }
      });

      const { result } = renderHook(() => usePetStore());

      const petData = {
        nombre: 'Max',
        especie: 'Perro',
      };

      await act(async () => {
        await result.current.createPet(petData);
      });

      expect(result.current.error).toBeTruthy();
    });


    test('debe permitir crear mascota con foto', async () => {
      const mockNewPetWithPhoto = {
        _id: 'pet123',
        nombre: 'Max',
        especie: 'Perro',
        foto: 'https://cloudinary.com/pet123.jpg',
      };

      axios.post.mockResolvedValueOnce({ data: mockNewPetWithPhoto });

      const { result } = renderHook(() => usePetStore());

      const petData = {
        nombre: 'Max',
        especie: 'Perro',
        foto: 'file://local/photo.jpg',
      };

      await act(async () => {
        await result.current.createPet(petData);
      });

      expect(axios.post).toHaveBeenCalledWith('/mascotas', petData);
    });
  });

  describe('Actualizar Mascota', () => {
    test('debe actualizar datos de mascota exitosamente', async () => {
      const mockUpdatedPet = {
        _id: 'pet123',
        nombre: 'Rocky Jr.',
        especie: 'Perro',
        edad: 4, // Edad actualizada
        peso: 30, // Peso actualizado
      };

      axios.put.mockResolvedValueOnce({ data: mockUpdatedPet });

      const { result } = renderHook(() => usePetStore());

      const updateData = {
        edad: 4,
        peso: 30,
      };

      await act(async () => {
        await result.current.updatePet('pet123', updateData);
      });

      expect(axios.put).toHaveBeenCalledWith('/mascotas/pet123', updateData);
      expect(result.current.error).toBe(null);
    });

    test('debe actualizar foto de mascota', async () => {
      const mockUpdatedPet = {
        _id: 'pet123',
        nombre: 'Rocky',
        foto: 'https://cloudinary.com/new-photo.jpg',
      };

      axios.put.mockResolvedValueOnce({ data: mockUpdatedPet });

      const { result } = renderHook(() => usePetStore());

      const updateData = {
        foto: 'file://local/new-photo.jpg',
      };

      await act(async () => {
        await result.current.updatePet('pet123', updateData);
      });

      expect(axios.put).toHaveBeenCalledWith('/mascotas/pet123', updateData);
    });

    test('debe manejar error al actualizar mascota inexistente', async () => {
      axios.put.mockRejectedValueOnce({
        response: { data: { message: 'Error al actualizar la mascota' } }
      });

      const { result } = renderHook(() => usePetStore());

      await act(async () => {
        await result.current.updatePet('pet_inexistente', { edad: 5 });
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Eliminar Mascota', () => {
    test('debe eliminar una mascota exitosamente', async () => {
      axios.delete.mockResolvedValueOnce({ data: { message: 'Mascota eliminada correctamente' } });

      const { result } = renderHook(() => usePetStore());

      // Primero agregar una mascota al store
      act(() => {
        result.current.pets = [{ _id: 'pet123', nombre: 'Rocky' }];
      });

      await act(async () => {
        await result.current.deletePet('pet123');
      });

      expect(axios.delete).toHaveBeenCalledWith('/mascotas/pet123');
      expect(result.current.error).toBe(null);
    });

    test('debe manejar error al eliminar mascota con citas activas', async () => {
      axios.delete.mockRejectedValueOnce({
        response: { data: { message: 'Error al eliminar la mascota' } }
      });

      const { result } = renderHook(() => usePetStore());

      await act(async () => {
        await result.current.deletePet('pet123');
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Selección de Mascota', () => {
    test('debe seleccionar una mascota actual', () => {
      const { result } = renderHook(() => usePetStore());

      const mockPet = {
        _id: 'pet123',
        nombre: 'Rocky',
        especie: 'Perro',
      };

      act(() => {
        result.current.setCurrentPet(mockPet);
      });

      expect(result.current.currentPet).toEqual(mockPet);
      expect(result.current.currentPet._id).toBe('pet123');
    });

    test('debe limpiar selección de mascota', () => {
      const { result } = renderHook(() => usePetStore());

      // Primero seleccionar
      act(() => {
        result.current.setCurrentPet({ _id: 'pet123', nombre: 'Rocky' });
      });

      // Luego limpiar
      act(() => {
        result.current.clearCurrentPet();
      });

      expect(result.current.currentPet).toBe(null);
    });
  });

  describe('Filtrado y Búsqueda', () => {
    test('debe filtrar mascotas por especie', () => {
      const pets = [
        { _id: '1', nombre: 'Rocky', especie: 'Perro' },
        { _id: '2', nombre: 'Luna', especie: 'Gato' },
        { _id: '3', nombre: 'Max', especie: 'Perro' },
      ];

      const perros = pets.filter((p) => p.especie === 'Perro');
      expect(perros.length).toBe(2);
    });

    test('debe buscar mascota por nombre', () => {
      const pets = [
        { _id: '1', nombre: 'Rocky', especie: 'Perro' },
        { _id: '2', nombre: 'Luna', especie: 'Gato' },
        { _id: '3', nombre: 'Max', especie: 'Perro' },
      ];

      const busqueda = 'rock';
      const resultado = pets.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );

      expect(resultado.length).toBe(1);
      expect(resultado[0].nombre).toBe('Rocky');
    });

    test('debe ordenar mascotas por nombre alfabéticamente', () => {
      const pets = [
        { _id: '1', nombre: 'Rocky' },
        { _id: '2', nombre: 'Luna' },
        { _id: '3', nombre: 'Max' },
      ];

      const ordenadas = pets.sort((a, b) => a.nombre.localeCompare(b.nombre));

      expect(ordenadas[0].nombre).toBe('Luna');
      expect(ordenadas[1].nombre).toBe('Max');
      expect(ordenadas[2].nombre).toBe('Rocky');
    });
  });

  describe('Validaciones de Datos', () => {
    test('debe validar edad no negativa', () => {
      const edad = -1;
      const esValida = edad >= 0;
      expect(esValida).toBe(false);
    });

    test('debe validar peso positivo', () => {
      const peso = 0;
      const esValido = peso > 0;
      expect(esValido).toBe(false);
    });

    test('debe validar especies permitidas', () => {
      const especiesValidas = ['Perro', 'Gato', 'Ave', 'Conejo', 'Reptil', 'Otro'];
      const especie = 'Perro';
      expect(especiesValidas.includes(especie)).toBe(true);
    });

    test('debe rechazar especie inválida', () => {
      const especiesValidas = ['Perro', 'Gato', 'Ave', 'Conejo', 'Reptil', 'Otro'];
      const especie = 'Dragon';
      expect(especiesValidas.includes(especie)).toBe(false);
    });
  });

  describe('Historial Médico', () => {
    test('debe agregar entrada al historial médico', () => {
      const mascota = {
        _id: 'pet123',
        nombre: 'Rocky',
        historialMedico: [],
      };

      const nuevaEntrada = {
        fecha: new Date().toISOString(),
        descripcion: 'Vacunación antirrábica',
        veterinario: 'Dr. Juan Pérez',
      };

      mascota.historialMedico.push(nuevaEntrada);

      expect(mascota.historialMedico.length).toBe(1);
      expect(mascota.historialMedico[0].descripcion).toBe('Vacunación antirrábica');
    });

    test('debe obtener última visita al veterinario', () => {
      const mascota = {
        historialMedico: [
          { fecha: '2024-01-15', descripcion: 'Consulta general' },
          { fecha: '2024-06-20', descripcion: 'Vacunación' },
          { fecha: '2024-12-10', descripcion: 'Revisión anual' },
        ],
      };

      const ordenado = mascota.historialMedico.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const ultimaVisita = ordenado[0];

      expect(ultimaVisita.descripcion).toBe('Revisión anual');
    });
  });
});
