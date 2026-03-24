import { body, param, query } from "express-validator";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";
import { handleErrors } from "./handle-errors.js";

export const crearProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "AUXILIAR_ROLE", "GERENTE_GENERAL_ROLE"),
    body("nombre").notEmpty().withMessage("El nombre es requerido"),
    body("tipoDocumento").isIn(["DPI", "NIT", "PASAPORTE"]).withMessage("Tipo de documento no válido"),
    body("numeroDocumento").notEmpty().withMessage("El número de documento es requerido"),
    body("nit").optional(),
    body("direccion").notEmpty().withMessage("La dirección es requerida"),
    body("ciudad").notEmpty().withMessage("La ciudad es requerida"),
    body("departamento").notEmpty().withMessage("El departamento es requerido"),
    body("correo").isEmail().withMessage("El correo no es válido"),
    body("telefono").notEmpty().withMessage("El teléfono es requerido"),
    body("condicionPago").isIn(["CONTADO", "CREDITO"]).withMessage("Condición de pago no válida"),
    body("diasCredito").optional().isNumeric().withMessage("Días de crédito debe ser número"),
    body("limiteCreditoMes").optional().isNumeric().withMessage("Límite de crédito debe ser número"),
    body("tipoCuenta").optional().isIn(["AHORRO", "CORRIENTE"]).withMessage("Tipo de cuenta no válido"),
    validateField,
    handleErrors
];

export const obtenerProveedoresValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const obtenerProveedorPorIdValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const actualizarProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    body("nombre").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
    body("condicionPago").optional().isIn(["CONTADO", "CREDITO"]).withMessage("Condición de pago no válida"),
    body("diasCredito").optional().isNumeric().withMessage("Días de crédito debe ser número"),
    body("limiteCreditoMes").optional().isNumeric().withMessage("Límite de crédito debe ser número"),
    validateField,
    handleErrors
];

export const desactivarProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const eliminarProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const buscarProveedoresActivosValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    query("busqueda").optional().isString().trim(),
    query("limite").optional().isNumeric().withMessage("Límite debe ser número"),
    query("desde").optional().isNumeric().withMessage("Desde debe ser número"),
    validateField,
    handleErrors
];

export const obtenerSaldoProveedorValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "AUXILIAR_ROLE"),
    param("id").isMongoId().withMessage("No es un ID válido"),
    validateField,
    handleErrors
];

export const exportarProveedoresValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE"),
    validateField,
    handleErrors
];
