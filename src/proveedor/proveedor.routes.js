import { Router } from "express";
import {
    crearProveedor,
    obtenerProveedores,
    obtenerProveedorPorId,
    actualizarProveedor,
    desactivarProveedor,
    eliminarProveedor,
    buscarProveedoresActivos,
    obtenerSaldoProveedor,
    exportarProveedores
} from "./proveedor.controller.js";

import {
    crearProveedorValidator,
    obtenerProveedoresValidator,
    obtenerProveedorPorIdValidator,
    actualizarProveedorValidator,
    desactivarProveedorValidator,
    eliminarProveedorValidator,
    buscarProveedoresActivosValidator,
    obtenerSaldoProveedorValidator,
    exportarProveedoresValidator
} from "../middlewares/proveedor-validators.js";

import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";

const router = Router();

// Crear proveedor
router.post(
    "/crearProveedor",
    crearProveedorValidator,
    crearAuditoriaMiddleware("CREAR", "PROVEEDORES", (req) => `Creación de nuevo proveedor: ${req.body.nombreEmpresa || req.body.nombre}`),
    crearProveedor
);

// Buscar proveedores activos
router.get("/buscarProveedoresActivos", buscarProveedoresActivosValidator, buscarProveedoresActivos);

// Exportar proveedores
router.get(
    "/exportarProveedores/excel",
    exportarProveedoresValidator,
    exportarProveedores
);

// Obtener todos los proveedores
router.get("/listarProveedores", obtenerProveedoresValidator, obtenerProveedores);

// Obtener saldo del proveedor
router.get("/listarProveedor/:id/saldo", obtenerSaldoProveedorValidator, obtenerSaldoProveedor);

// Obtener proveedor por ID
router.get("/listarProveedorPorId/:id", obtenerProveedorPorIdValidator, obtenerProveedorPorId);

// Actualizar proveedor
router.put(
    "/actualizarProveedor/:id",
    actualizarProveedorValidator,
    crearAuditoriaMiddleware("ACTUALIZAR", "PROVEEDORES", (req) => `Actualización de proveedor: ${req.params.id}`),
    actualizarProveedor
);

// Desactivar proveedor (soft delete)
router.delete(
    "/desactivarProveedor/:id",
    desactivarProveedorValidator,
    crearAuditoriaMiddleware("ELIMINAR", "PROVEEDORES", (req) => `Desactivación de proveedor: ${req.params.id}`),
    desactivarProveedor
);

// Eliminar proveedor (hard delete)
router.delete(
    "/eliminarProveedor/:id",
    eliminarProveedorValidator,
    crearAuditoriaMiddleware("ELIMINAR", "PROVEEDORES", (req) => `Eliminación de proveedor: ${req.params.id}`),
    eliminarProveedor
);

export default router;
