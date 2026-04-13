import { Router } from "express";
import {
    crearPagoProveedor,
    obtenerPagosProveedores,
    obtenerPagoPorId,
    actualizarPago,
    buscarPagosActivos,
    desactivarPago,
    eliminarPago,
    obtenerSaldoPago,
    obtenerPagosPorProveedor,
    exportarPagosProveedor
} from "./pagoProveedor.controller.js";
import {
    crearPagoProveedorValidator,
    obtenerPagosProveedoresValidator,
    obtenerPagoPorIdValidator,
    actualizarPagoValidator,
    buscarPagosActivosValidator,
    desactivarPagoValidator,
    eliminarPagoValidator,
    obtenerSaldoPagoValidator,
    obtenerPagosPorProveedorValidator,
    exportarPagosProveedorValidator
} from "../middlewares/pagoProveedor-validators.js";

import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";

const router = Router();

// Crear pago a proveedor
router.post(
    "/crear",
    crearPagoProveedorValidator,
    crearAuditoriaMiddleware("CREAR", "PAGOS_PROVEEDORES", (req) => `Creación de pago a proveedor: ${req.body.montoPagado}`),
    crearPagoProveedor
);

// Obtener todos los pagos
router.get("/", obtenerPagosProveedoresValidator, obtenerPagosProveedores);

// Obtener pago por ID
router.get("/obtenerPorId/:id", obtenerPagoPorIdValidator, obtenerPagoPorId);

// Actualizar pago
router.put(
    "/actualizar/:id",
    actualizarPagoValidator,
    crearAuditoriaMiddleware("ACTUALIZAR", "PAGOS_PROVEEDORES", (req) => `Actualización de pago: ${req.params.id}`),
    actualizarPago
);

// Buscar pagos activos
router.get("/buscar/activos", buscarPagosActivosValidator, buscarPagosActivos);

// Desactivar pago (soft delete)
router.delete(
    "/desactivar/:id",
    desactivarPagoValidator,
    crearAuditoriaMiddleware("ELIMINAR", "PAGOS_PROVEEDORES", (req) => `Desactivación de pago: ${req.params.id}`),
    desactivarPago
);

// Eliminar pago (hard delete)
router.delete(
    "/eliminar/:id",
    eliminarPagoValidator,
    crearAuditoriaMiddleware("ELIMINAR", "PAGOS_PROVEEDORES", (req) => `Eliminación de pago: ${req.params.id}`),
    eliminarPago
);

// Obtener saldo de factura
router.get("/saldo/:id", obtenerSaldoPagoValidator, obtenerSaldoPago);

// Obtener pagos por proveedor
router.get("/proveedor/:id", obtenerPagosPorProveedorValidator, obtenerPagosPorProveedor);

// Exportar pagos a Excel
router.get(
    "/exportar/excel",
    exportarPagosProveedorValidator,
    exportarPagosProveedor
);

export default router;
