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

const router = Router();

// Crear factura por cobrar
router.post("/crear", crearFacturaCobrarValidator, crearFacturaCobrar);

// Obtener todas las facturas por cobrar
router.get("/", obtenerFacturasCobrarValidator, obtenerFacturasCobrar);

// Obtener factura por cobrar por ID
router.get("/obtenerPorId/:id", obtenerFacturaCobrarPorIdValidator, obtenerFacturaCobrarPorId);

// Actualizar factura por cobrar
router.put("/actualizarFactura/:id", actualizarFacturaCobrarValidator, actualizarFacturaCobrar);

// Buscar facturas activas por estado
router.get("/buscar/activas", buscarFacturasActivasCobrarValidator, buscarFacturasActivasCobrar);

// Desactivar factura por cobrar (soft delete)
router.delete("/desactivar/:id", desactivarFacturaCobrarValidator, desactivarFacturaCobrar);

// Eliminar factura por cobrar (hard delete - admin only)
router.delete("/eliminar/:id", eliminarFacturaCobrarValidator, eliminarFacturaCobrar);

// Obtener saldo de factura por cobrar
router.get("/saldo/:id", obtenerSaldoFacturaCobrarValidator, obtenerSaldoFacturaCobrar);

// Obtener facturas por cliente
router.get("/cliente/:id", obtenerFacturasPorClienteValidator, obtenerFacturasPorCliente);

// Obtener facturas vencidas
router.get("/vencidas", obtenerFacturasVencidasValidator, obtenerFacturasVencidas);

// Obtener facturas próximas a vencer
router.get("/proximas-vencer", obtenerFacturasProximasValidator, obtenerFacturasProximas);

// Marcar factura como vencida
router.patch("/marcar-vencida/:id", marcarFacturaVencidaValidator, marcarFacturaVencida);

// Enviar recordatorio
router.post("/recordatorio/:id", enviarRecordatorioValidator, enviarRecordatorio);

// Exportar facturas por cobrar a Excel
router.get("/exportar/excel", exportarFacturasCobrarValidator, exportarFacturasCobrar);

export default router;
