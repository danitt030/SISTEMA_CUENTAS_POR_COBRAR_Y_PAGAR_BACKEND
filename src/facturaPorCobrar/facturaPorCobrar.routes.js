import { Router } from "express";
import {
    crearFacturaCobrar,
    obtenerFacturasCobrar,
    obtenerFacturaCobrarPorId,
    actualizarFacturaCobrar,
    buscarFacturasActivasCobrar,
    desactivarFacturaCobrar,
    eliminarFacturaCobrar,
    obtenerSaldoFacturaCobrar,
    obtenerFacturasPorCliente,
    obtenerFacturasVencidas,
    obtenerFacturasProximas,
    marcarFacturaVencida,
    enviarRecordatorio,
    exportarFacturasCobrar
} from "./facturaPorCobrar.controller.js";
import {
    crearFacturaCobrarValidator,
    obtenerFacturasCobrarValidator,
    obtenerFacturaCobrarPorIdValidator,
    actualizarFacturaCobrarValidator,
    buscarFacturasActivasCobrarValidator,
    desactivarFacturaCobrarValidator,
    eliminarFacturaCobrarValidator,
    obtenerSaldoFacturaCobrarValidator,
    obtenerFacturasPorClienteValidator,
    obtenerFacturasVencidasValidator,
    obtenerFacturasProximasValidator,
    marcarFacturaVencidaValidator,
    enviarRecordatorioValidator,
    exportarFacturasCobrarValidator
} from "../middlewares/facturaPorCobrar-validators.js";

import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";

const router = Router();

// Crear factura por cobrar
router.post(
    "/crear",
    crearFacturaCobrarValidator,
    crearAuditoriaMiddleware("CREAR", "FACTURAS_COBRAR", (req) => `Creación de factura por cobrar: ${req.body.numeroFactura}`),
    crearFacturaCobrar
);

// Obtener todas las facturas por cobrar
router.get("/", obtenerFacturasCobrarValidator, obtenerFacturasCobrar);

// Obtener factura por cobrar por ID
router.get("/obtenerPorId/:id", obtenerFacturaCobrarPorIdValidator, obtenerFacturaCobrarPorId);

// Actualizar factura por cobrar
router.put(
    "/actualizarFactura/:id",
    actualizarFacturaCobrarValidator,
    crearAuditoriaMiddleware("ACTUALIZAR", "FACTURAS_COBRAR", (req) => `Actualización de factura por cobrar: ${req.params.id}`),
    actualizarFacturaCobrar
);

// Buscar facturas activas por estado
router.get("/buscar/activas", buscarFacturasActivasCobrarValidator, buscarFacturasActivasCobrar);

// Desactivar factura por cobrar (soft delete)
router.delete(
    "/desactivar/:id",
    desactivarFacturaCobrarValidator,
    crearAuditoriaMiddleware("ELIMINAR", "FACTURAS_COBRAR", (req) => `Desactivación de factura por cobrar: ${req.params.id}`),
    desactivarFacturaCobrar
);

// Eliminar factura por cobrar (hard delete - admin only)
router.delete(
    "/eliminar/:id",
    eliminarFacturaCobrarValidator,
    crearAuditoriaMiddleware("ELIMINAR", "FACTURAS_COBRAR", (req) => `Eliminación de factura por cobrar: ${req.params.id}`),
    eliminarFacturaCobrar
);

// Obtener saldo de factura por cobrar
router.get("/saldo/:id", obtenerSaldoFacturaCobrarValidator, obtenerSaldoFacturaCobrar);

// Obtener facturas por cliente
router.get("/cliente/:id", obtenerFacturasPorClienteValidator, obtenerFacturasPorCliente);

// Obtener facturas vencidas
router.get("/vencidas", obtenerFacturasVencidasValidator, obtenerFacturasVencidas);

// Obtener facturas próximas a vencer
router.get("/proximas-vencer", obtenerFacturasProximasValidator, obtenerFacturasProximas);

// Marcar factura como vencida
router.patch(
    "/marcar-vencida/:id",
    marcarFacturaVencidaValidator,
    crearAuditoriaMiddleware("ACTUALIZAR", "FACTURAS_COBRAR", (req) => `Marcación de factura como vencida: ${req.params.id}`),
    marcarFacturaVencida
);

// Enviar recordatorio
router.post(
    "/recordatorio/:id",
    enviarRecordatorioValidator,
    crearAuditoriaMiddleware("LEER", "FACTURAS_COBRAR", (req) => `Envío de recordatorio de factura: ${req.params.id}`),
    enviarRecordatorio
);

// Exportar facturas por cobrar a Excel
router.get(
    "/exportar/excel",
    exportarFacturasCobrarValidator,
    crearAuditoriaMiddleware("EXPORTAR", "FACTURAS_COBRAR", (req) => "Exportación de facturas por cobrar a Excel"),
    exportarFacturasCobrar
);

export default router;
