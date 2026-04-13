import { Router } from "express";
import {
    crearFacturaPagar,
    obtenerFacturasPagar,
    obtenerFacturaPagarPorId,
    actualizarFacturaPagar,
    buscarFacturasActivasPagar,
    desactivarFacturaPagar,
    eliminarFacturaPagar,
    obtenerSaldoFacturaPagar,
    obtenerFacturasPorProveedor,
    verificarLimiteCompra,
    exportarFacturasPagar
} from "./facturaPorPagar.controller.js";
import {
    crearFacturaPagarValidator,
    obtenerFacturasPagarValidator,
    obtenerFacturaPagarPorIdValidator,
    actualizarFacturaPagarValidator,
    buscarFacturasActivasPagarValidator,
    desactivarFacturaPagarValidator,
    eliminarFacturaPagarValidator,
    obtenerSaldoFacturaPagarValidator,
    obtenerFacturasPorProveedorValidator,
    verificarLimiteCompraValidator,
    exportarFacturasPagarValidator
} from "../middlewares/facturaPorPagar-validators.js";

import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";

const router = Router();

// Crear factura por pagar
router.post(
    "/crear",
    crearFacturaPagarValidator,
    crearAuditoriaMiddleware("CREAR", "FACTURAS_PAGAR", (req) => `Creación de factura por pagar: ${req.body.numeroFactura}`),
    crearFacturaPagar
);

// Obtener todas las facturas por pagar
router.get("/", obtenerFacturasPagarValidator, obtenerFacturasPagar);

// Obtener factura por pagar por ID
router.get("/obtenerPorId/:id", obtenerFacturaPagarPorIdValidator, obtenerFacturaPagarPorId);

// Actualizar factura por pagar
router.put(
    "/actualizarFactura/:id",
    actualizarFacturaPagarValidator,
    crearAuditoriaMiddleware("ACTUALIZAR", "FACTURAS_PAGAR", (req) => `Actualización de factura por pagar: ${req.params.id}`),
    actualizarFacturaPagar
);

// Buscar facturas activas por estado
router.get("/buscar/activas", buscarFacturasActivasPagarValidator, buscarFacturasActivasPagar);

// Desactivar factura por pagar
router.delete(
    "/desactivar/:id",
    desactivarFacturaPagarValidator,
    crearAuditoriaMiddleware("ELIMINAR", "FACTURAS_PAGAR", (req) => `Desactivación de factura por pagar: ${req.params.id}`),
    desactivarFacturaPagar
);

// Eliminar factura por pagar
router.delete(
    "/eliminar/:id",
    eliminarFacturaPagarValidator,
    crearAuditoriaMiddleware("ELIMINAR", "FACTURAS_PAGAR", (req) => `Eliminación de factura por pagar: ${req.params.id}`),
    eliminarFacturaPagar
);

// Obtener saldo de factura por pagar
router.get("/saldo/:id", obtenerSaldoFacturaPagarValidator, obtenerSaldoFacturaPagar);

// Obtener facturas por proveedor
router.get("/proveedor/:id", obtenerFacturasPorProveedorValidator, obtenerFacturasPorProveedor);

// Verificar límite de compra
router.post(
    "/verificar-limite/:id",
    verificarLimiteCompraValidator,
    crearAuditoriaMiddleware("LEER", "FACTURAS_PAGAR", (req) => `Verificación de límite de compra para factura: ${req.params.id}`),
    verificarLimiteCompra
);

// Exportar facturas por pagar a Excel
router.get(
    "/exportar/excel",
    exportarFacturasPagarValidator,
    crearAuditoriaMiddleware("EXPORTAR", "FACTURAS_PAGAR", (req) => "Exportación de facturas por pagar a Excel"),
    exportarFacturasPagar
);

export default router;
