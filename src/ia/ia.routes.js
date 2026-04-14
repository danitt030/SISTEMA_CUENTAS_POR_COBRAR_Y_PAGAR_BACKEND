import { Router } from "express";
import { preguntarAsistenteIA, obtenerHistorialIA, eliminarHistorialIA } from "./ia.controller.js";
import { validarPreguntaIA } from "./ia-validators.js";
import { validateJWT } from "../middlewares/validate-jwt.js";
import { obtenerConversaciones } from "./conversacion.controller.js";
import conversacionRoutes from "./conversacion.routes.js";

const router = Router();

/**
 * @route   POST /sistemasCuentasPorPagarYCobrar/v1/ia/pregunta
 * @desc    Preguntar al asistente de IA sobre supervisión de clientes
 * @access  Private (ADMINISTRADOR, CONTADOR, GERENTE_GENERAL, GERENTE, VENDEDOR)
 * @body    { pregunta, modulo, documentoId }
 */
router.post(
    "/pregunta",
    validarPreguntaIA,
    preguntarAsistenteIA
);

/**
 * @route   GET /sistemasCuentasPorPagarYCobrar/v1/ia/historial
 * @desc    Obtener historial de preguntas del usuario
 * @access  Private
 * @query   { limite, desde, modulo }
 */
router.get(
    "/historial",
    validateJWT,
    obtenerHistorialIA
);

/**
 * @route   DELETE /sistemasCuentasPorPagarYCobrar/v1/ia/historial/:id
 * @desc    Eliminar entrada del historial
 * @access  Private
 */
router.delete(
    "/historial/:id",
    validateJWT,
    eliminarHistorialIA
);

/**
 * @route   GET /sistemasCuentasPorPagarYCobrar/v1/ia/conversaciones
 * @desc    Obtener conversaciones del usuario
 * @access  Private
 */
router.get(
    "/conversaciones",
    validateJWT,
    obtenerConversaciones
);

// Rutas CRUD de conversación específica (crear, obtener, actualizar, eliminar)
router.use("/conversacion", conversacionRoutes);

export default router;
