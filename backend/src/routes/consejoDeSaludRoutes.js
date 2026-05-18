import express from "express";
import mongoose from "mongoose";
import ConsejoDeSalud from "../models/ConsejoDeSalud.js";
import CategoriaConsejoSalud from "../models/CategoriaConsejoSalud.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute, { checkRole } from "../middleware/auth.middleware.js";
import { getPagination, paginatedResponse } from "../utils/routePerformance.js";

const router = express.Router();
const adminOnly = [protectRoute, checkRole(["admin"])];
const LIST_FIELDS =
  "_id titulo resumen imagen categoria categoriaSlug categoriaRef paraTipos tiempoLectura autor medicoCitado etiquetas destacado visualizaciones likes activo fechaPublicacion";

const DEFAULT_CATEGORIES = [
  { nombre: "Nutricion", color: "#FF9800", icono: "restaurant" },
  { nombre: "Prevencion", color: "#4CAF50", icono: "shield-checkmark" },
  { nombre: "Cuidados basicos", color: "#42A5F5", icono: "heart" },
  { nombre: "Comportamiento", color: "#AB47BC", icono: "happy" },
  { nombre: "Emergencias", color: "#F44336", icono: "alert-circle" },
  { nombre: "Otro", color: "#1E88E5", icono: "medical" },
];

const slugify = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseTags = (value) => {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const parsePetTypes = (value) => {
  const values = Array.isArray(value) ? value : String(value || "Todos").split(",");
  const normalized = values.map((item) => String(item).trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : ["Todos"];
};

const ensureDefaultCategories = async () => {
  await Promise.all(
    DEFAULT_CATEGORIES.map((categoria) =>
      CategoriaConsejoSalud.findOneAndUpdate(
        { slug: slugify(categoria.nombre) },
        { $setOnInsert: { ...categoria, slug: slugify(categoria.nombre), activo: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
};

const ensureCategory = async (input) => {
  const nombre = typeof input === "object" && input !== null ? input.nombre : input;
  const cleanName = String(nombre || "").trim();
  if (!cleanName) return null;

  const slug = slugify(cleanName);
  return CategoriaConsejoSalud.findOneAndUpdate(
    { slug },
    {
      $setOnInsert: {
        nombre: cleanName,
        slug,
        descripcion: "",
        color: "#1E88E5",
        icono: "medical",
        activo: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
};

const syncCategoriesFromConsejos = async () => {
  await ensureDefaultCategories();
  const names = await ConsejoDeSalud.distinct("categoria", { categoria: { $exists: true, $ne: "" } });
  await Promise.all(names.map((nombre) => ensureCategory(nombre)));
};

const normalizeConsejoPayload = async (body, existing = {}) => {
  const payload = { ...body };

  if (payload.categoriaId && mongoose.Types.ObjectId.isValid(payload.categoriaId)) {
    const categoria = await CategoriaConsejoSalud.findById(payload.categoriaId).lean();
    if (!categoria) {
      const error = new Error("La categoria seleccionada no existe");
      error.statusCode = 400;
      throw error;
    }
    payload.categoria = categoria.nombre;
    payload.categoriaSlug = categoria.slug;
    payload.categoriaRef = categoria._id;
  } else if (payload.categoria !== undefined) {
    const categoria = await ensureCategory(payload.categoria);
    if (categoria) {
      payload.categoria = categoria.nombre;
      payload.categoriaSlug = categoria.slug;
      payload.categoriaRef = categoria._id;
    }
  } else if (existing.categoria && !existing.categoriaSlug) {
    const categoria = await ensureCategory(existing.categoria);
    if (categoria) {
      payload.categoriaSlug = categoria.slug;
      payload.categoriaRef = categoria._id;
    }
  }

  if (payload.paraTipos !== undefined) payload.paraTipos = parsePetTypes(payload.paraTipos);
  if (payload.etiquetas !== undefined) payload.etiquetas = parseTags(payload.etiquetas);
  if (payload.tiempoLectura !== undefined) payload.tiempoLectura = Number(payload.tiempoLectura) || 5;
  if (payload.destacado !== undefined) payload.destacado = payload.destacado === true || payload.destacado === "true" || payload.destacado === "on";
  if (payload.activo !== undefined) payload.activo = payload.activo === true || payload.activo === "true" || payload.activo === "on";

  delete payload.categoriaId;
  return payload;
};

const buildListFilter = (query, forceActive = false) => {
  const filtro = {};
  const categoria = String(query.categoria || "").trim();

  if (categoria) {
    const slug = slugify(categoria);
    filtro.$or = [{ categoriaSlug: slug }, { categoria }];
  }

  if (query.paraTipos) {
    filtro.paraTipos = { $in: [query.paraTipos, "Todos"] };
  }

  if (query.destacado !== undefined) filtro.destacado = query.destacado === "true";
  if (query.activo !== undefined) filtro.activo = query.activo === "true";
  if (forceActive && query.activo === undefined) filtro.activo = true;
  return filtro;
};

router.get("/categorias", async (req, res) => {
  try {
    await syncCategoriesFromConsejos();
    const filtro = req.query.incluirInactivas === "true" ? {} : { activo: true };
    const categorias = await CategoriaConsejoSalud.find(filtro).sort({ nombre: 1 }).lean();
    res.status(200).json({ data: categorias });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener las categorias" });
  }
});

router.post("/categorias", ...adminOnly, async (req, res) => {
  try {
    const { nombre, descripcion, color, icono, activo } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ message: "El nombre de la categoria es obligatorio" });

    const slug = slugify(nombre);
    const exists = await CategoriaConsejoSalud.findOne({ slug }).lean();
    if (exists) return res.status(409).json({ message: "Ya existe una categoria con ese nombre" });

    const categoria = await CategoriaConsejoSalud.create({
      nombre: nombre.trim(),
      slug,
      descripcion: descripcion || "",
      color: color || "#1E88E5",
      icono: icono || "medical",
      activo: activo === undefined ? true : activo === true || activo === "true" || activo === "on",
    });
    res.status(201).json(categoria);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al crear la categoria" });
  }
});

router.put("/categorias/:id", ...adminOnly, async (req, res) => {
  try {
    const categoria = await CategoriaConsejoSalud.findById(req.params.id);
    if (!categoria) return res.status(404).json({ message: "Categoria no encontrada" });

    const previousName = categoria.nombre;
    if (req.body.nombre?.trim()) {
      categoria.nombre = req.body.nombre.trim();
      categoria.slug = slugify(req.body.nombre);
    }
    categoria.descripcion = req.body.descripcion ?? categoria.descripcion;
    categoria.color = req.body.color || categoria.color;
    categoria.icono = req.body.icono || categoria.icono;
    if (req.body.activo !== undefined) categoria.activo = req.body.activo === true || req.body.activo === "true" || req.body.activo === "on";
    await categoria.save();

    await ConsejoDeSalud.updateMany(
      { $or: [{ categoriaRef: categoria._id }, { categoria: previousName }] },
      { $set: { categoria: categoria.nombre, categoriaSlug: categoria.slug, categoriaRef: categoria._id } }
    );

    res.status(200).json(categoria);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Ya existe una categoria con ese nombre" });
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al actualizar la categoria" });
  }
});

router.delete("/categorias/:id", ...adminOnly, async (req, res) => {
  try {
    const categoria = await CategoriaConsejoSalud.findById(req.params.id).lean();
    if (!categoria) return res.status(404).json({ message: "Categoria no encontrada" });

    const inUse = await ConsejoDeSalud.countDocuments({
      $or: [{ categoriaRef: categoria._id }, { categoria: categoria.nombre }, { categoriaSlug: categoria.slug }],
    });
    if (inUse > 0) {
      return res.status(409).json({ message: "No se puede eliminar una categoria en uso" });
    }

    await CategoriaConsejoSalud.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Categoria eliminada correctamente" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al eliminar la categoria" });
  }
});

router.get("/", async (req, res) => {
  try {
    const filtro = buildListFilter(req.query);
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const [consejos, total] = await Promise.all([
      ConsejoDeSalud.find(filtro)
        .select(LIST_FIELDS)
        .sort({ destacado: -1, fechaPublicacion: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      ConsejoDeSalud.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(consejos, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener los consejos de salud" });
  }
});

router.get("/categoria/:categoria", async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filtro = buildListFilter({ ...req.query, categoria: req.params.categoria }, true);
    const [consejos, total] = await Promise.all([
      ConsejoDeSalud.find(filtro)
        .select(LIST_FIELDS)
        .sort({ fechaPublicacion: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      ConsejoDeSalud.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(consejos, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener los consejos de salud" });
  }
});

router.get("/mascota/:tipo", async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filtro = {
      $or: [{ paraTipos: req.params.tipo }, { paraTipos: "Todos" }],
      activo: true,
    };
    const [consejos, total] = await Promise.all([
      ConsejoDeSalud.find(filtro)
        .select(LIST_FIELDS)
        .sort({ fechaPublicacion: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      ConsejoDeSalud.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(consejos, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener los consejos de salud" });
  }
});

router.get("/buscar/:texto", async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filtro = { $text: { $search: req.params.texto }, activo: true };
    const consejos = await ConsejoDeSalud.find(filtro, { score: { $meta: "textScore" } })
      .select(`${LIST_FIELDS} score`)
      .sort({ score: { $meta: "textScore" } })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();
    const total = await ConsejoDeSalud.countDocuments(filtro);

    res.status(200).json(paginatedResponse(consejos, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al buscar consejos de salud" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const consejo = await ConsejoDeSalud.findByIdAndUpdate(
      req.params.id,
      { $inc: { visualizaciones: 1 } },
      { new: true }
    )
      .select(`${LIST_FIELDS} contenido fuente imagenPublicId`)
      .lean();

    if (!consejo) return res.status(404).json({ message: "Consejo de salud no encontrado" });
    res.status(200).json(consejo);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener el consejo de salud" });
  }
});

router.post("/", ...adminOnly, async (req, res) => {
  try {
    const { titulo, contenido, resumen, categoria } = req.body;
    if (!titulo || !contenido || !resumen || !categoria) {
      return res.status(400).json({ message: "Titulo, contenido, resumen y categoria son obligatorios" });
    }
    if (!req.body.imagen) return res.status(400).json({ message: "La imagen es obligatoria" });

    const uploadResponse = await cloudinary.uploader.upload(req.body.imagen, { folder: "consejos_salud" });
    const payload = await normalizeConsejoPayload(req.body);
    const nuevoConsejo = await ConsejoDeSalud.create({
      ...payload,
      imagen: uploadResponse.secure_url,
      imagenPublicId: uploadResponse.public_id,
      paraTipos: payload.paraTipos || ["Todos"],
      tiempoLectura: payload.tiempoLectura || 5,
      autor: payload.autor || "Equipo Vetya",
      fechaPublicacion: payload.fechaPublicacion || new Date(),
    });

    res.status(201).json(nuevoConsejo);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Error al crear el consejo de salud" });
  }
});

router.put("/:id", ...adminOnly, async (req, res) => {
  try {
    const consejo = await ConsejoDeSalud.findById(req.params.id).select("_id imagen imagenPublicId categoria categoriaSlug").lean();
    if (!consejo) return res.status(404).json({ message: "Consejo de salud no encontrado" });

    const updateData = await normalizeConsejoPayload(req.body, consejo);
    if (updateData.imagen && updateData.imagen !== consejo.imagen) {
      if (consejo.imagenPublicId) {
        await cloudinary.uploader.destroy(consejo.imagenPublicId);
      }
      const uploadResponse = await cloudinary.uploader.upload(updateData.imagen, { folder: "consejos_salud" });
      updateData.imagen = uploadResponse.secure_url;
      updateData.imagenPublicId = uploadResponse.public_id;
    } else {
      delete updateData.imagen;
    }

    const consejoActualizado = await ConsejoDeSalud.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    res.status(200).json(consejoActualizado);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Error al actualizar el consejo de salud" });
  }
});

router.delete("/:id", ...adminOnly, async (req, res) => {
  try {
    const consejo = await ConsejoDeSalud.findById(req.params.id).select("_id imagenPublicId").lean();
    if (!consejo) return res.status(404).json({ message: "Consejo de salud no encontrado" });

    if (consejo.imagenPublicId) {
      await cloudinary.uploader.destroy(consejo.imagenPublicId);
    }

    await ConsejoDeSalud.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Consejo de salud eliminado correctamente" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al eliminar el consejo de salud" });
  }
});

router.post("/:id/like", protectRoute, async (req, res) => {
  try {
    const consejo = await ConsejoDeSalud.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true })
      .select("likes")
      .lean();

    if (!consejo) return res.status(404).json({ message: "Consejo de salud no encontrado" });
    res.status(200).json({ likes: consejo.likes });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al dar like al consejo de salud" });
  }
});

export default router;
