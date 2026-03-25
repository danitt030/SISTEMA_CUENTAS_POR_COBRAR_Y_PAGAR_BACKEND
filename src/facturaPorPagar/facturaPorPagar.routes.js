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

const router = Router();

// Crear factura por pagar
router.post("/crear", crearFacturaPagarValidator, crearFacturaPagar);

// Obtener todas las facturas por pagar
router.get("/", obtenerFacturasPagarValidator, obtenerFacturasPagar);

// Obtener factura por pagar por ID
router.get("/obtenerPorId/:id", obtenerFacturaPagarPorIdValidator, obtenerFacturaPagarPorId);

// Actualizar factura por pagar
router.put("/actualizarFactura/:id", actualizarFacturaPagarValidator, actualizarFacturaPagar);

// Buscar facturas activas por estado
router.get("/buscar/activas", buscarFacturasActivasPagarValidator, buscarFacturasActivasPagar);

// Desactivar factura por pagar
router.delete("/desactivar/:id", desactivarFacturaPagarValidator, desactivarFacturaPagar);

// Eliminar factura por pagar
router.delete("/eliminar/:id", eliminarFacturaPagarValidator, eliminarFacturaPagar);

// Obtener saldo de factura por pagar
router.get("/saldo/:id", obtenerSaldoFacturaPagarValidator, obtenerSaldoFacturaPagar);

// Obtener facturas por proveedor
router.get("/proveedor/:id", obtenerFacturasPorProveedorValidator, obtenerFacturasPorProveedor);

// Verificar límite de compra
router.post("/verificar-limite/:id", verificarLimiteCompraValidator, verificarLimiteCompra);

// Exportar facturas por pagar a Excel
router.get("/exportar/excel", exportarFacturasPagarValidator, exportarFacturasPagar);

export default router;
