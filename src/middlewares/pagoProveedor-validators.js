import { body, param, query } from "express-validator";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";
import { handleErrors } from "./handle-errors.js";

export const crearPagoProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    body("numeroRecibo", "El número de recibo es requerido").trim().notEmpty(),
    body("facturaPorPagar", "La factura es requerida").notEmpty(),
    body("proveedor", "El proveedor es requerido").notEmpty(),
    body("monto", "El monto es requerido y debe ser un número").isNumeric(),
    body("moneda", "La moneda debe ser GTQ, USD o EUR").isIn(["GTQ", "USD", "EUR"]),
    body("metodoPago", "El método de pago es requerido").isIn(["TRANSFERENCIA", "EFECTIVO", "CHEQUE", "TARJETA"]),
    body("fechaPago", "La fecha de pago es requerida").notEmpty(),
    validateField,
    handleErrors
];

export const obtenerPagosProveedoresValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const obtenerPagoPorIdValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const actualizarPagoValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    body("numeroRecibo", "El número de recibo debe ser válido").optional().trim().notEmpty(),
    body("monto", "El monto debe ser un número").optional().isNumeric(),
    body("moneda", "La moneda debe ser GTQ, USD o EUR").optional().isIn(["GTQ", "USD", "EUR"]),
    body("metodoPago", "El método de pago debe ser válido").optional().isIn(["TRANSFERENCIA", "EFECTIVO", "CHEQUE", "TARJETA"]),
    validateField,
    handleErrors
];

export const buscarPagosActivosValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    query("proveedor").optional().isMongoId().withMessage("ID de proveedor no válido"),
    query("fechaInicio").optional().isISO8601().withMessage("Fecha inicio no válida"),
    query("fechaFin").optional().isISO8601().withMessage("Fecha fin no válida"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const desactivarPagoValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const eliminarPagoValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const obtenerSaldoPagoValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const obtenerPagosPorProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const exportarPagosProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    validateField,
    handleErrors
];
