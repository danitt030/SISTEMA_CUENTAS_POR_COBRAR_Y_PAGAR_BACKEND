import { body, param } from "express-validator";
import { correoExists, usuarioExists, numeroDocumentoExists, usuarioIdExists } from "../helpers/db-validators.js";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";
import { handleErrors } from "./handle-errors.js";

export const registrarValidator = [
    body("nombre").notEmpty().withMessage("El nombre es requerido"),
    body("apellido").notEmpty().withMessage("El apellido es requerido"),
    body("usuario").notEmpty().withMessage("El usuario es requerido"),
    body("correo").notEmpty().withMessage("El correo es requerido"),
    body("correo").isEmail().withMessage("No es un correo válido"),
    body("correo").custom(correoExists),
    body("usuario").custom(usuarioExists),
    body("contraseña").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("telefono").notEmpty().withMessage("El teléfono es requerido"),
    body("tipoDocumento").isIn(["DPI", "NIT", "PASAPORTE"]).withMessage("Tipo de documento no válido"),
    body("numeroDocumento").notEmpty().withMessage("El número de documento es requerido"),
    body("numeroDocumento").custom(numeroDocumentoExists),
    // Campos qué dependen del rol
    body("departamento").if((value, { req }) => req.body.rol !== "CLIENTE_ROLE").notEmpty().withMessage("El departamento es requerido"),
    body("puesto").if((value, { req }) => req.body.rol !== "CLIENTE_ROLE").notEmpty().withMessage("El puesto es requerido"),
    body("direccion").if((value, { req }) => req.body.rol !== "CLIENTE_ROLE").notEmpty().withMessage("La dirección es requerida"),
    body("departamentoGeografico").if((value, { req }) => req.body.rol !== "CLIENTE_ROLE").notEmpty().withMessage("El departamento geográfico es requerido"),
    body("rol").optional().isIn([
        "ADMINISTRADOR_ROLE",
        "GERENTE_GENERAL_ROLE",
        "CONTADOR_ROLE",
        "GERENTE_ROLE",
        "VENDEDOR_ROLE",
        "AUXILIAR_ROLE",
        "CLIENTE_ROLE"
    ]).withMessage("Rol no válido"),
    validateField,
    handleErrors
];

export const iniciarSesionValidator = [
    body("correo").optional().isEmail().withMessage("No es un correo válido"),
    body("usuario").optional().notEmpty().withMessage("El usuario no puede estar vacío"),
    body("contraseña").notEmpty().withMessage("La contraseña es requerida"),
    validateField,
    handleErrors
];

export const obtenerUsuarioPorIdValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "GERENTE_GENERAL_ROLE", "CONTADOR_ROLE", "GERENTE_ROLE"),
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    validateField,
    handleErrors
];

export const eliminarUsuarioValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE"),
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    validateField,
    handleErrors
];

export const actualizarUsuarioValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "GERENTE_GENERAL_ROLE", "CONTADOR_ROLE"),
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    validateField,
    handleErrors
];

export const obtenerTodosUsuariosValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "GERENTE_GENERAL_ROLE", "CONTADOR_ROLE", "GERENTE_ROLE"),
    validateField,
    handleErrors
];

export const obtenerUsuariosPorRolValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "GERENTE_GENERAL_ROLE", "CONTADOR_ROLE", "GERENTE_ROLE"),
    param("rol").isIn([
        "ADMINISTRADOR_ROLE",
        "GERENTE_GENERAL_ROLE",
        "CONTADOR_ROLE",
        "GERENTE_ROLE",
        "VENDEDOR_ROLE",
        "AUXILIAR_ROLE",
        "CLIENTE_ROLE"
    ]).withMessage("Rol no válido"),
    validateField,
    handleErrors
];

export const actualizarContraseñaValidator = [
    validateJWT,
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    body("nuevaContraseña").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    validateField,
    handleErrors
];

export const actualizarRolValidator = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE"),
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    body("nuevoRol").isIn([
        "ADMINISTRADOR_ROLE",
        "GERENTE_GENERAL_ROLE",
        "CONTADOR_ROLE",
        "GERENTE_ROLE",
        "VENDEDOR_ROLE",
        "AUXILIAR_ROLE",
        "CLIENTE_ROLE"
    ]).withMessage("Rol no válido"),
    validateField,
    handleErrors
];

export const eliminarCuentaValidator = [
    validateJWT,
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    body("contraseña").notEmpty().withMessage("La contraseña es requerida"),
    validateField,
    handleErrors
];