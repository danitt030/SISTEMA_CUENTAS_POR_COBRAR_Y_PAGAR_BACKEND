import { Router } from "express";
import {
    crearCobroCliente,
    obtenerCobrosClientes,
    obtenerCobroPorId,
    actualizarCobro,
    buscarCobrosActivos,
    desactivarCobro,
    eliminarCobro,
    obtenerSaldoCobro,
    obtenerCobrosPorCliente,
    obtenerComisionesTotales,
    exportarCobrosClientes
} from "../cobroCliente/cobroCliente.controller.js";
import {
    validarCrearCobroCliente,
    validarObtenerCobros,
    validarObtenerCobroPorId,
    validarActualizarCobro,
    validarBuscarCobrosActivos,
    validarDesactivarCobro,
    validarEliminarCobro,
    validarObtenerSaldoCobro,
    validarObtenerCobrosPorCliente,
    validarObtenerComisiones,
    validarExportarCobros
} from "../middlewares/cobroCliente-validators.js";

import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";

const router = Router();

// Crear nuevo cobro
router.post(
    "/crear",
    validarCrearCobroCliente,
    crearAuditoriaMiddleware("CREAR", "COBROS_CLIENTES", (req) => `Creación de cobro a cliente: ${req.body.montoAbonado}`),
    crearCobroCliente
);

// Obtener todos los cobros
router.get("/obtener", validarObtenerCobros, obtenerCobrosClientes);

// Obtener cobro por ID
router.get("/obtener/:id", validarObtenerCobroPorId, obtenerCobroPorId);

// Actualizar cobro
router.put(
    "/actualizar/:id",
    validarActualizarCobro,
    crearAuditoriaMiddleware("ACTUALIZAR", "COBROS_CLIENTES", (req) => `Actualización de cobro: ${req.params.id}`),
    actualizarCobro
);

// Buscar cobros activos con filtros
router.get("/buscar/activos", validarBuscarCobrosActivos, buscarCobrosActivos);

// Desactivar cobro
router.put(
    "/desactivar/:id",
    validarDesactivarCobro,
    crearAuditoriaMiddleware("ELIMINAR", "COBROS_CLIENTES", (req) => `Desactivación de cobro: ${req.params.id}`),
    desactivarCobro
);

// Eliminar cobro (hard delete)
router.delete(
    "/eliminar/:id",
    validarEliminarCobro,
    crearAuditoriaMiddleware("ELIMINAR", "COBROS_CLIENTES", (req) => `Eliminación de cobro: ${req.params.id}`),
    eliminarCobro
);

// Obtener saldo de cobro en factura
router.get("/saldo/:id", validarObtenerSaldoCobro, obtenerSaldoCobro);

// Obtener cobros por cliente
router.get("/cliente/:id", validarObtenerCobrosPorCliente, obtenerCobrosPorCliente);

// Obtener comisiones totales
router.get("/comisiones/totales", validarObtenerComisiones, obtenerComisionesTotales);

// Exportar cobros a Excel
router.get(
    "/exportar/excel",
    validarExportarCobros,
    exportarCobrosClientes
);

export default router;
