import { body, param, query } from "express-validator";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";
import { handleErrors } from "./handle-errors.js";

// 1. VALIDADORES PARA REGISTRAR EVENTO
export const validarRegistroEvento = [
    validateJWT,
    body("accion")
        .notEmpty()
        .withMessage("La acción es requerida")
        .isIn(["CREAR", "ACTUALIZAR", "ELIMINAR", "LEER", "EXPORTAR", "DESCARGAR", "LOGIN", "LOGOUT"])
        .withMessage("La acción no es válida"),
    body("modulo")
        .notEmpty()
        .withMessage("El módulo es requerido")
        .isIn(["USUARIOS", "PROVEEDORES", "CLIENTES", "FACTURAS_PAGAR", "FACTURAS_COBRAR", "PAGOS_PROVEEDORES", "COBROS_CLIENTES", "REPORTES", "AUDITORIA"])
        .withMessage("El módulo no es válido"),
    body("descripcion")
        .notEmpty()
        .withMessage("La descripción es requerida")
        .isLength({ min: 5, max: 500 })
        .withMessage("La descripción debe tener entre 5 y 500 caracteres"),
    validateField,
    handleErrors
];

// 2. VALIDADORES PARA OBTENER LOGS
export const validarObtenerLogs = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    query("limite")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("El límite debe estar entre 1 y 100"),
    query("pagina")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La página debe ser mayor a 0"),
    validateField,
    handleErrors
];

// 3. VALIDADORES PARA FILTRAR POR USUARIO
export const validarFiltrarPorUsuario = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    param("usuarioId")
        .isMongoId()
        .withMessage("El ID del usuario no es válido"),
    query("limite")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("El límite debe estar entre 1 y 100"),
    query("pagina")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La página debe ser mayor a 0"),
    validateField,
    handleErrors
];

// 4. VALIDADORES PARA FILTRAR POR FECHA Y ACCION
export const validarFiltrarPorFechaYAccion = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    query("fechaInicio")
        .optional()
        .trim(),
    query("fechaFin")
        .optional()
        .trim(),
    query("accion")
        .optional()
        .isIn(["CREAR", "ACTUALIZAR", "ELIMINAR", "LEER", "EXPORTAR", "DESCARGAR", "LOGIN", "LOGOUT"])
        .withMessage("La acción no es válida"),
    query("limite")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("El límite debe estar entre 1 y 100"),
    query("pagina")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La página debe ser mayor a 0"),
    validateField,
    handleErrors
];

// 5. VALIDADORES PARA EXPORTAR LOGS
export const validarExportarLogs = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE"),
    query("fechaInicio")
        .optional()
        .trim(),
    query("fechaFin")
        .optional()
        .trim(),
    query("accion")
        .optional()
        .isIn(["CREAR", "ACTUALIZAR", "ELIMINAR", "LEER", "EXPORTAR", "DESCARGAR", "LOGIN", "LOGOUT"])
        .withMessage("La acción no es válida"),
    validateField,
    handleErrors
];
