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

const router = Router();

// Crear pago a proveedor
router.post("/crear", crearPagoProveedorValidator, crearPagoProveedor);

// Obtener todos los pagos
router.get("/", obtenerPagosProveedoresValidator, obtenerPagosProveedores);

// Obtener pago por ID
router.get("/obtenerPorId/:id", obtenerPagoPorIdValidator, obtenerPagoPorId);

// Actualizar pago
router.put("/actualizar/:id", actualizarPagoValidator, actualizarPago);

// Buscar pagos activos
router.get("/buscar/activos", buscarPagosActivosValidator, buscarPagosActivos);

// Desactivar pago (soft delete)
router.delete("/desactivar/:id", desactivarPagoValidator, desactivarPago);

// Eliminar pago (hard delete)
router.delete("/eliminar/:id", eliminarPagoValidator, eliminarPago);

// Obtener saldo de factura
router.get("/saldo/:id", obtenerSaldoPagoValidator, obtenerSaldoPago);

// Obtener pagos por proveedor
router.get("/proveedor/:id", obtenerPagosPorProveedorValidator, obtenerPagosPorProveedor);

// Exportar pagos a Excel
router.get("/exportar/excel", exportarPagosProveedorValidator, exportarPagosProveedor);

export default router;
