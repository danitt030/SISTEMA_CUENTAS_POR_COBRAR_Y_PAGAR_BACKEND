import { body, param, query } from "express-validator";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";
import { handleErrors } from "./handle-errors.js";

export const crearFacturaCobrarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    body("numeroFactura", "El número de factura es requerido").trim().notEmpty(),
    body("cliente", "El cliente es requerido").notEmpty(),
    body("monto", "El monto es requerido y debe ser un número").isNumeric(),
    body("moneda", "La moneda debe ser GTQ, USD o EUR").isIn(["GTQ", "USD", "EUR"]),
    body("estado", "El estado debe ser PENDIENTE, PARCIAL, COBRADA o VENCIDA").isIn(["PENDIENTE", "PARCIAL", "COBRADA", "VENCIDA"]),
    body("fechaEmision", "La fecha de emisión es requerida").notEmpty(),
    body("fechaVencimiento", "La fecha de vencimiento es requerida").notEmpty(),
    validateField,
    handleErrors
];

export const obtenerFacturasCobrarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const obtenerFacturaCobrarPorIdValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const actualizarFacturaCobrarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    body("numeroFactura", "El número de factura debe ser válido").optional().trim().notEmpty(),
    body("cliente", "El cliente debe ser válido").optional().notEmpty(),
    body("monto", "El monto debe ser un número").optional().isNumeric(),
    body("moneda", "La moneda debe ser GTQ, USD o EUR").optional().isIn(["GTQ", "USD", "EUR"]),
    body("estado", "El estado debe ser PENDIENTE, PARCIAL, COBRADA o VENCIDA").optional().isIn(["PENDIENTE", "PARCIAL", "COBRADA", "VENCIDA"]),
    validateField,
    handleErrors
];

export const buscarFacturasActivasCobrarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    query("estado").optional().isIn(["PENDIENTE", "PARCIAL", "COBRADA", "VENCIDA"]),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const desactivarFacturaCobrarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const eliminarFacturaCobrarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const obtenerSaldoFacturaCobrarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const obtenerFacturasPorClienteValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const obtenerFacturasVencidasValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const obtenerFacturasProximasValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE"),
    query("dias").optional().isNumeric().withMessage("Días debe ser número"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const marcarFacturaVencidaValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const enviarRecordatorioValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const exportarFacturasCobrarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    validateField,
    handleErrors
];
