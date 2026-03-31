import { Router } from "express";
import {
    registrarEvento,
    obtenerLogs,
    filtrarPorUsuario,
    filtrarPorFechaYAccion,
    exportarLogs
} from "./auditoria.controller.js";
import {
    validarRegistroEvento,
    validarObtenerLogs,
    validarFiltrarPorUsuario,
    validarFiltrarPorFechaYAccion,
    validarExportarLogs
} from "../middlewares/auditoria-validators.js";

const router = Router();

/**
 * @route   POST /sistemasCuentasPorPagarYCobrar/v1/auditoria/registrar
 * @desc    Registrar un evento de auditoría
 * @access  Private (Authenticated)
 */
router.post("/registrar", validarRegistroEvento, registrarEvento);

/**
 * @route   GET /sistemasCuentasPorPagarYCobrar/v1/auditoria/logs
 * @desc    Obtener todos los logs de auditoría (con paginación)
 * @access  Private (Admin, Contador)
 */
router.get("/logs", validarObtenerLogs, obtenerLogs);

/**
 * @route   GET /sistemasCuentasPorPagarYCobrar/v1/auditoria/usuario/:usuarioId
 * @desc    Filtrar logs por usuario específico
 * @access  Private (Admin, Contador)
 */
router.get("/usuario/:usuarioId", validarFiltrarPorUsuario, filtrarPorUsuario);

/**
 * @route   GET /sistemasCuentasPorPagarYCobrar/v1/auditoria/filtrar
 * @desc    Filtrar logs por fecha y acción
 * @access  Private (Admin, Contador)
 * @query   fechaInicio, fechaFin, accion
 */
router.get("/filtrar", validarFiltrarPorFechaYAccion, filtrarPorFechaYAccion);

/**
 * @route   GET /sistemasCuentasPorPagarYCobrar/v1/auditoria/exportar
 * @desc    Exportar logs a Excel
 * @access  Private (Admin, Contador)
 * @query   fechaInicio, fechaFin, accion (optional)
 */
router.get("/exportar", validarExportarLogs, exportarLogs);

export default router;
