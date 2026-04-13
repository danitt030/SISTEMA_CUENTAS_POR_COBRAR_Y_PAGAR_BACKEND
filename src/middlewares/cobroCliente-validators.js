import { body, param, query } from "express-validator";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";

export const validarCrearCobroCliente = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "VENDEDOR_ROLE"),
    body("numeroComprobante").notEmpty().withMessage("Número de comprobante requerido"),
    body("facturaPorCobrar").notEmpty().withMessage("Factura requerida").isMongoId().withMessage("ID factura inválido"),
    body("cliente").notEmpty().withMessage("Cliente requerido").isMongoId().withMessage("ID cliente inválido"),
    body("montoFactura").isFloat({ min: 0 }).withMessage("Monto de factura debe ser positivo"),
    body("montoCobrado").isFloat({ min: 0 }).withMessage("Monto cobrado debe ser positivo"),
    body("moneda").isIn(["GTQ", "USD", "EUR"]).withMessage("Moneda inválida"),
    body("metodoPago").isIn(["TRANSFERENCIA", "EFECTIVO", "CHEQUE", "TARJETA"]).withMessage("Método pago inválido"),
    body("fechaCobro").optional().isISO8601().withMessage("Fecha cobro inválida"),
    body("comision").optional().isFloat({ min: 0 }).withMessage("Comisión debe ser positiva"),
    body("referencia").optional().trim(),
    body("descripcion").optional().trim(),
    validateField
];

export const validarObtenerCobros = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    query("limite").optional().isInt({ min: 1 }).withMessage("Límite debe ser positivo"),
    query("desde").optional().isInt({ min: 0 }).withMessage("Desde debe ser no negativo"),
    validateField
];

export const validarObtenerCobroPorId = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    param("id").isMongoId().withMessage("ID inválido"),
    validateField
];

export const validarActualizarCobro = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("ID inválido"),
    body("montoCobrado").optional().isFloat({ min: 0 }).withMessage("Monto cobrado debe ser positivo"),
    body("comision").optional().isFloat({ min: 0 }).withMessage("Comisión debe ser positiva"),
    body("fechaCobro").optional().isISO8601().withMessage("Fecha cobro inválida"),
    body("metodoPago").optional().isIn(["TRANSFERENCIA", "EFECTIVO", "CHEQUE", "TARJETA"]).withMessage("Método pago inválido"),
    body("referencia").optional().trim(),
    body("descripcion").optional().trim(),
    validateField
];

export const validarBuscarCobrosActivos = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    query("cliente").optional().isMongoId().withMessage("ID cliente inválido"),
    query("fechaInicio").optional().isISO8601().withMessage("Fecha inicio inválida"),
    query("fechaFin").optional().isISO8601().withMessage("Fecha fin inválida"),
    query("metodoPago").optional().isIn(["TRANSFERENCIA", "EFECTIVO", "CHEQUE", "TARJETA"]).withMessage("Método pago inválido"),
    query("limite").optional().isInt({ min: 1 }).withMessage("Límite debe ser positivo"),
    query("desde").optional().isInt({ min: 0 }).withMessage("Desde debe ser no negativo"),
    validateField
];

export const validarDesactivarCobro = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("ID inválido"),
    validateField
];

export const validarEliminarCobro = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE"),
    param("id").isMongoId().withMessage("ID inválido"),
    validateField
];

export const validarObtenerSaldoCobro = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    param("id").isMongoId().withMessage("ID inválido"),
    validateField
];

export const validarObtenerCobrosPorCliente = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    param("id").isMongoId().withMessage("ID cliente inválido"),
    query("limite").optional().isInt({ min: 1 }).withMessage("Límite debe ser positivo"),
    query("desde").optional().isInt({ min: 0 }).withMessage("Desde debe ser no negativo"),
    validateField
];

export const validarObtenerComisiones = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    query("fechaInicio").optional().isISO8601().withMessage("Fecha inicio inválida"),
    query("fechaFin").optional().isISO8601().withMessage("Fecha fin inválida"),
    validateField
];

export const validarExportarCobros = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    validateField
];
