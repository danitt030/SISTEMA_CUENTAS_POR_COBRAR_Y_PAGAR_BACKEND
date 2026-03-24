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
    exportarClientes
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
    exportarClientesValidator
} from "../middlewares/cliente-validators.js";

const router = Router();

// Crear cliente
router.post("/crearCliente", crearClienteValidator, crearCliente);

// Buscar clientes activos
router.get("/buscarClientesActivos", buscarClientesActivosValidator, buscarClientesActivos);

// Exportar clientes
router.get("/exportarClientes/excel", exportarClientesValidator, exportarClientes);

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
router.put("/actualizarCliente/:id", actualizarClienteValidator, actualizarCliente);

// Desactivar cliente (soft delete)
router.delete("/desactivarCliente/:id", desactivarClienteValidator, desactivarCliente);

// Eliminar cliente (hard delete)
router.delete("/eliminarCliente/:id", eliminarClienteValidator, eliminarCliente);

export default router;
