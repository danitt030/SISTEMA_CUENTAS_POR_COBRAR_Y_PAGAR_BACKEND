import { Router } from "express";
import {
    crearCliente,
    obtenerTodosClientes,
    obtenerClientePorId,
    actualizarCliente,
    desactivarCliente,
    eliminarCliente,
    buscarClientesActivos,
    obtenerSaldoCliente,
    obtenerClientesPorGerente,
    verificarLimiteCredito,
    exportarClientes,
    obtenerMiPerfil,
    obtenerMisFacturas,
    obtenerDetalleFactura,
    obtenerMisCobros,
    obtenerMiSaldo,
    obtenerMisFacturasVencidas
} from "./cliente.controller.js";

import {
    crearClienteValidator,
    obtenerTodosClientesValidator,
    obtenerClientePorIdValidator,
    actualizarClienteValidator,
    desactivarClienteValidator,
    eliminarClienteValidator,
    buscarClientesActivosValidator,
    obtenerSaldoClienteValidator,
    obtenerClientesPorGerenteValidator,
    verificarLimiteCreditoValidator,
    exportarClientesValidator,
    obtenerMiPerfilValidator,
    obtenerMisFacturasValidator,
    obtenerDetalleFacturaValidator,
    obtenerMisCobrosValidator,
    obtenerMiSaldoValidator,
    obtenerMisFacturasVencidasValidator
} from "../middlewares/cliente-validators.js";

import { crearAuditoriaMiddleware } from "../middlewares/auditoria-validators.js";

const router = Router();

// Crear cliente
router.post(
    "/crearCliente",
    crearClienteValidator,
    crearAuditoriaMiddleware("CREAR", "CLIENTES", (req) => `Creación de nuevo cliente: ${req.body.nombreEmpresa || req.body.nombre}`),
    crearCliente
);

// Buscar clientes activos
router.get("/buscarClientesActivos", buscarClientesActivosValidator, buscarClientesActivos);

// Exportar clientes
router.get(
    "/exportarClientes/excel",
    exportarClientesValidator,
    exportarClientes
);

// Obtener todos los clientes
router.get("/obtenerTodosClientes", obtenerTodosClientesValidator, obtenerTodosClientes);

// Obtener clientes por gerente
router.get("/gerenteClientes/:id", obtenerClientesPorGerenteValidator, obtenerClientesPorGerente);

// Obtener saldo del cliente
router.get("/obtenerCliente/:id/saldo", obtenerSaldoClienteValidator, obtenerSaldoCliente);

// Verificar límite de crédito
router.get("/verificarLimiteCredito/:id", verificarLimiteCreditoValidator, verificarLimiteCredito);

// Obtener cliente por ID
router.get("/obtenerClientePorId/:id", obtenerClientePorIdValidator, obtenerClientePorId);

// Actualizar cliente
router.put(
    "/actualizarCliente/:id",
    actualizarClienteValidator,
    crearAuditoriaMiddleware("ACTUALIZAR", "CLIENTES", (req) => `Actualización de cliente: ${req.params.id}`),
    actualizarCliente
);

// Desactivar cliente (soft delete)
router.delete(
    "/desactivarCliente/:id",
    desactivarClienteValidator,
    crearAuditoriaMiddleware("ELIMINAR", "CLIENTES", (req) => `Desactivación de cliente: ${req.params.id}`),
    desactivarCliente
);

// Eliminar cliente (hard delete)
router.delete(
    "/eliminarCliente/:id",
    eliminarClienteValidator,
    crearAuditoriaMiddleware("ELIMINAR", "CLIENTES", (req) => `Eliminación de cliente: ${req.params.id}`),
    eliminarCliente
);

// ============================================
// RUTAS PORTAL CLIENTE - Solo para CLIENTE_ROLE
// ============================================

/**
 * @route GET /api/clientes/portal/miPerfil
 * @desc Obtener perfil del cliente autenticado
 * @access Private - CLIENTE_ROLE
 */
router.get(
    "/portal/miPerfil",
    obtenerMiPerfilValidator,
    obtenerMiPerfil
);

/**
 * @route GET /api/clientes/portal/misFacturas
 * @desc Obtener todas las facturas del cliente
 * @access Private - CLIENTE_ROLE
 */
router.get(
    "/portal/misFacturas",
    obtenerMisFacturasValidator,
    obtenerMisFacturas
);

/**
 * @route GET /api/clientes/portal/miFactura/:id
 * @desc Obtener detalle de una factura con sus cobros
 * @access Private - CLIENTE_ROLE
 */
router.get(
    "/portal/miFactura/:id",
    obtenerDetalleFacturaValidator,
    obtenerDetalleFactura
);

/**
 * @route GET /api/clientes/portal/misCobros
 * @desc Obtener historial de cobros registrados
 * @access Private - CLIENTE_ROLE
 */
router.get(
    "/portal/misCobros",
    obtenerMisCobrosValidator,
    obtenerMisCobros
);

/**
 * @route GET /api/clientes/portal/miSaldo
 * @desc Obtener saldo total y resumen de pagos
 * @access Private - CLIENTE_ROLE
 */
router.get(
    "/portal/miSaldo",
    obtenerMiSaldoValidator,
    obtenerMiSaldo
);

/**
 * @route GET /api/clientes/portal/misFacturasVencidas
 * @desc Obtener facturas vencidas del cliente
 * @access Private - CLIENTE_ROLE
 */
router.get(
    "/portal/misFacturasVencidas",
    obtenerMisFacturasVencidasValidator,
    obtenerMisFacturasVencidas
);

export default router;
