import axios from '../config/axios';

const PET_TYPE_BY_BACKEND = {
  Perro: 'dog',
  Gato: 'cat',
  Ave: 'bird',
  Reptil: 'reptile',
  Roedor: 'rodent',
  Pez: 'fish',
  Conejo: 'rabbit',
  Todos: 'all',
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export const normalizeConsejo = (consejo = {}) => {
  const paraTipos = Array.isArray(consejo.paraTipos) ? consejo.paraTipos : [];
  const primaryType = paraTipos.find((tipo) => tipo !== 'Todos') || paraTipos[0] || 'Todos';
  const id = consejo._id || consejo.id;

  return {
    ...consejo,
    id,
    _id: id,
    title: consejo.titulo || consejo.title || '',
    description: consejo.resumen || consejo.description || '',
    content: consejo.contenido || consejo.content || '',
    image: consejo.imagen || consejo.image || null,
    category: consejo.categoria || consejo.category || 'Consejos',
    categorySlug: consejo.categoriaSlug || consejo.categorySlug || '',
    petTypes: paraTipos,
    petType: PET_TYPE_BY_BACKEND[primaryType] || 'all',
    author: consejo.autor || consejo.author || 'Equipo Vetya',
    doctor: consejo.medicoCitado || consejo.doctor || '',
    source: consejo.fuente || consejo.source || '',
    readTime: `${consejo.tiempoLectura || consejo.readTime || 5} min`,
    readTimeMinutes: consejo.tiempoLectura || 5,
    date: formatDate(consejo.fechaPublicacion || consejo.date),
    featured: Boolean(consejo.destacado || consejo.featured),
    likes: consejo.likes || 0,
    views: consejo.visualizaciones || 0,
  };
};

export const normalizeCategoria = (categoria = {}) => ({
  ...categoria,
  id: categoria._id || categoria.id || categoria.slug,
  name: categoria.nombre || categoria.name || '',
  slug: categoria.slug || '',
  color: categoria.color || '#1E88E5',
  icon: categoria.icono || categoria.icon || 'medical',
});

const unwrapListResponse = (response) => ({
  data: Array.isArray(response.data) ? response.data.map(normalizeConsejo) : [],
  pagination: response.pagination || response.data?.pagination || null,
});

export const getConsejos = async (params = {}) => {
  const response = await axios.get('/consejos-salud', { params });
  return unwrapListResponse(response);
};

export const getConsejoById = async (id) => {
  const response = await axios.get(`/consejos-salud/${id}`);
  return normalizeConsejo(response.data);
};

export const getCategorias = async () => {
  const response = await axios.get('/consejos-salud/categorias');
  const categorias = Array.isArray(response.data?.data) ? response.data.data : response.data;
  return Array.isArray(categorias) ? categorias.map(normalizeCategoria) : [];
};

export const searchConsejos = async (texto, params = {}) => {
  const response = await axios.get(`/consejos-salud/buscar/${encodeURIComponent(texto)}`, { params });
  return unwrapListResponse(response);
};

export const likeConsejo = async (id) => {
  const response = await axios.post(`/consejos-salud/${id}/like`);
  return response.data;
};

export default {
  getConsejos,
  getConsejoById,
  getCategorias,
  searchConsejos,
  likeConsejo,
};
