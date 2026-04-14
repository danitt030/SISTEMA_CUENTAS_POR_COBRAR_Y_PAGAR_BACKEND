import ConversacionIA from "./conversacionIA.model.js";
import { generarTituloConversacion } from "../helpers/ia-helpers.js";

/**
 * Crear nueva conversación
 */
export const crearConversacion = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { modulo = "general", cliente } = req.body;

    const nuevaConversacion = new ConversacionIA({
      usuario: usuarioId,
      modulo,
      cliente: cliente || null,
      titulo: "Nueva Conversación",
      mensajes: [],
    });

    await nuevaConversacion.save();

    return res.status(201).json({
      success: true,
      conversacion: nuevaConversacion,
    });
  } catch (err) {
    console.error("[ERROR] crearConversacion:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error al crear conversación",
      error: err.message,
    });
  }
};

/**
 * Obtener conversaciones del usuario
 */
export const obtenerConversaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { modulo = "todos" } = req.query;

    let query = { usuario: usuarioId };
    if (modulo && modulo !== "todos") {
      query.modulo = modulo;
    }

    const conversaciones = await ConversacionIA.find(query)
      .select("_id titulo modulo cliente actualizadoEn")
      .sort({ actualizadoEn: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      conversaciones,
    });
  } catch (err) {
    console.error("[ERROR] obtenerConversaciones:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error al obtener conversaciones",
      error: err.message,
    });
  }
};

/**
 * Obtener conversación completa por ID
 */
export const obtenerConversacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;

    const conversacion = await ConversacionIA.findById(id);

    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: "Conversación no encontrada",
      });
    }

    // Verificar que el usuario sea el propietario
    if (conversacion.usuario.toString() !== usuarioId.toString()) {
      return res.status(403).json({
        success: false,
        message: "No tienes acceso a esta conversación",
      });
    }

    return res.status(200).json({
      success: true,
      conversacion,
    });
  } catch (err) {
    console.error("[ERROR] obtenerConversacion:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error al obtener conversación",
      error: err.message,
    });
  }
};

/**
 * Agregar mensaje a conversación
 */
export const agregarMensajeConversacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;
    const { tipo, contenido } = req.body;

    const conversacion = await ConversacionIA.findById(id);

    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: "Conversación no encontrada",
      });
    }

    // Verificar que el usuario sea el propietario
    if (conversacion.usuario.toString() !== usuarioId.toString()) {
      return res.status(403).json({
        success: false,
        message: "No tienes acceso a esta conversación",
      });
    }

    // Agregar mensaje
    conversacion.mensajes.push({
      tipo,
      contenido,
      timestamp: new Date(),
    });

    // Actualizar título si es el primer mensaje del usuario
    if (conversacion.titulo === "Nueva Conversación" && tipo === "usuario") {
      conversacion.titulo = generarTituloConversacion(contenido);
    }

    conversacion.actualizadoEn = new Date();
    await conversacion.save();

    return res.status(200).json({
      success: true,
      conversacion,
    });
  } catch (err) {
    console.error("[ERROR] agregarMensajeConversacion:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error al agregar mensaje",
      error: err.message,
    });
  }
};

/**
 * Eliminar conversación
 */
export const eliminarConversacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;

    const conversacion = await ConversacionIA.findById(id);

    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: "Conversación no encontrada",
      });
    }

    // Verificar que el usuario sea el propietario
    if (conversacion.usuario.toString() !== usuarioId.toString()) {
      return res.status(403).json({
        success: false,
        message: "No tienes acceso a esta conversación",
      });
    }

    await ConversacionIA.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Conversación eliminada",
    });
  } catch (err) {
    console.error("[ERROR] eliminarConversacion:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar conversación",
      error: err.message,
    });
  }
};
