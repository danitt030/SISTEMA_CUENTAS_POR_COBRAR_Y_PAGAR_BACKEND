import { query } from "express-validator";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";

export const validarResumenSaldos = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    validateField
];

export const validarResumenPorProveedor = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    validateField
];

export const validarResumenPorCliente = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    validateField
];

export const validarFacturasPorVencer = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    validateField
];

export const validarFacturasVencidas = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    validateField
];

export const validarCobrabilidad = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    validateField
];

export const validarPagabilidad = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    validateField
];

export const validarFacturasPorEstado = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    validateField
];

export const validarTopClientesDeudores = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    query("limite").optional().isInt({ min: 1 }).withMessage("Límite debe ser positivo"),
    validateField
];

export const validarTopProveedoresAcreedores = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    query("limite").optional().isInt({ min: 1 }).withMessage("Límite debe ser positivo"),
    validateField
];

export const validarAnalisisComisiones = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    query("fechaInicio").optional().isISO8601().withMessage("Fecha inicio inválida"),
    query("fechaFin").optional().isISO8601().withMessage("Fecha fin inválida"),
    validateField
];

export const validarExportarReporte = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    validateField
];
