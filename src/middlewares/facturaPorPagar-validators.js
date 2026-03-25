import { body, param, query } from "express-validator";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";
import { handleErrors } from "./handle-errors.js";

export const crearFacturaPagarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    body("numeroFactura", "El número de factura es requerido").trim().notEmpty(),
    body("proveedor", "El proveedor es requerido").notEmpty(),
    body("monto", "El monto es requerido y debe ser un número").isNumeric(),
    body("moneda", "La moneda debe ser GTQ, USD o EUR").isIn(["GTQ", "USD", "EUR"]),
    body("estado", "El estado debe ser PENDIENTE, PARCIAL, PAGADA o VENCIDA").isIn(["PENDIENTE", "PARCIAL", "PAGADA", "VENCIDA"]),
    body("fechaEmision", "La fecha de emisión es requerida").notEmpty(),
    body("fechaVencimiento", "La fecha de vencimiento es requerida").notEmpty(),
    validateField,
    handleErrors
];

export const obtenerFacturasPagarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const obtenerFacturaPagarPorIdValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const actualizarFacturaPagarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    body("numeroFactura", "El número de factura debe ser válido").optional().trim().notEmpty(),
    body("proveedor", "El proveedor debe ser válido").optional().notEmpty(),
    body("monto", "El monto debe ser un número").optional().isNumeric(),
    body("moneda", "La moneda debe ser GTQ, USD o EUR").optional().isIn(["GTQ", "USD", "EUR"]),
    body("estado", "El estado debe ser PENDIENTE, PARCIAL, PAGADA o VENCIDA").optional().isIn(["PENDIENTE", "PARCIAL", "PAGADA", "VENCIDA"]),
    validateField,
    handleErrors
];

export const buscarFacturasActivasPagarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    query("estado").optional().isIn(["PENDIENTE", "PARCIAL", "PAGADA", "VENCIDA"]),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const desactivarFacturaPagarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const eliminarFacturaPagarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const obtenerSaldoFacturaPagarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const obtenerFacturasPorProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const verificarLimiteCompraValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    body("montoNuevo", "El monto nuevo debe ser un número").optional().isNumeric(),
    validateField,
    handleErrors
];

export const exportarFacturasPagarValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    validateField,
    handleErrors
];
