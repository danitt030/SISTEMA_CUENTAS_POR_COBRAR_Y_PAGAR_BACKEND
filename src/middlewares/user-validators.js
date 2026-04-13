import { body, param } from "express-validator";
import { correoExists, usuarioExists, numeroDocumentoExists, usuarioIdExists } from "../helpers/db-validators.js";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";
import { handleErrors } from "./handle-errors.js";

export const registrarValidator = [
    // Campos básicos requeridos SIEMPRE
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

    // ==================== VALIDACIÓN INTELIGENTE POR CONTEXTO ====================
    // Detectar contexto: ¿JWT presente? ¿Es ADMINISTRADOR?
    
    // Si viene "rol" en body, requiere JWT de ADMINISTRADOR
    body("rol").custom((value, { req }) => {
        if (!value) {
            // No viene rol en body - es registro público, será asignado como CLIENTE_ROLE
            return true;
        }
        
        // Viene "rol" explícitamente - validar permiso
        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token || !req.usuario) {
            throw new Error("Se requiere autenticación de ADMINISTRADOR para especificar un rol");
        }
        
        if (req.usuario.rol !== "ADMINISTRADOR_ROLE") {
            throw new Error("Solo ADMINISTRADOR puede crear usuarios con roles específicos");
        }
        
        // Validar que sea rol válido
        const rolesValidos = [
            "ADMINISTRADOR_ROLE",
            "GERENTE_GENERAL_ROLE",
            "CONTADOR_ROLE",
            "GERENTE_ROLE",
            "VENDEDOR_ROLE",
            "AUXILIAR_ROLE"
        ];
        
        if (!rolesValidos.includes(value)) {
            throw new Error("Rol no válido");
        }
        
        return true;
    }),

    // Campos adicionales: SOLO si ADMINISTRADOR especificó role
    body("departamento").if((value, { req }) => {
        return req.body.rol && req.usuario && req.usuario.rol === "ADMINISTRADOR_ROLE";
    }).notEmpty().withMessage("El departamento es requerido para crear usuarios"),
    
    body("puesto").if((value, { req }) => {
        return req.body.rol && req.usuario && req.usuario.rol === "ADMINISTRADOR_ROLE";
    }).notEmpty().withMessage("El puesto es requerido para crear usuarios"),
    
    body("direccion").if((value, { req }) => {
        return req.body.rol && req.usuario && req.usuario.rol === "ADMINISTRADOR_ROLE";
    }).notEmpty().withMessage("La dirección es requerida para crear usuarios"),
    
    body("departamentoGeografico").if((value, { req }) => {
        return req.body.rol && req.usuario && req.usuario.rol === "ADMINISTRADOR_ROLE";
    }).notEmpty().withMessage("El departamento geográfico es requerido para crear usuarios"),

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

export const obtenerPerfilPropioValidator = [
    validateJWT,
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    // MATRIZ DE PERMISOS:
    // - ADMINISTRADOR: ve TODOS
    // - GERENTE_GENERAL: ve TODOS
    // - CONTADOR: ve TODOS
    // - Otros: solo su propio perfil
    param("uid").custom((value, { req }) => {
        const usuarioIdDelToken = req.usuario._id.toString();
        const rolDelUsuario = req.usuario.rol;
        const esAdmin = rolDelUsuario === "ADMINISTRADOR_ROLE";
        const esGerencial = ["GERENTE_GENERAL_ROLE", "CONTADOR_ROLE"].includes(rolDelUsuario);
        
        // Los que pueden ver todos
        if (esAdmin || esGerencial) {
            return true;
        }
        
        // Los demás solo pueden ver su propio perfil
        if (usuarioIdDelToken !== value) {
            throw new Error("No tienes permiso para ver este perfil");
        }
        return true;
    }),
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
    // NOTA: USA actualizarPerfilPropioValidator EN LUGAR DE ESTE para actualizar perfiles de usuarios
    // Este validador es para cambios administrativos solamente
    hasRoles("ADMINISTRADOR_ROLE", "GERENTE_GENERAL_ROLE", "CONTADOR_ROLE"),
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    validateField,
    handleErrors
];

export const obtenerTodosUsuariosValidator = [
    validateJWT,
    // MATRIZ: ADMINISTRADOR, GERENTE_GENERAL y CONTADOR ven TODOS
    hasRoles("ADMINISTRADOR_ROLE", "GERENTE_GENERAL_ROLE", "CONTADOR_ROLE"),
    validateField,
    handleErrors
];

export const obtenerUsuariosPorRolValidator = [
    validateJWT,
    // MATRIZ: Solo ADMINISTRADOR, GERENTE_GENERAL y CONTADOR ven usuarios por rol
    hasRoles("ADMINISTRADOR_ROLE", "GERENTE_GENERAL_ROLE", "CONTADOR_ROLE"),
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
    // MATRIZ:
    // - Cualquiera: puede cambiar su PROPIA contraseña
    // - ADMINISTRADOR: puede cambiar TODAS
    // - GERENTE_GENERAL: puede cambiar TODAS EXCEPTO ADMINISTRADOR
    param("uid").custom((value, { req }) => {
        const usuarioIdDelToken = req.usuario._id.toString();
        const rolDelToken = req.usuario.rol;
        
        // Si es su propia contraseña, siempre permitir
        if (usuarioIdDelToken === value) {
            return true;
        }
        
        // ADMINISTRADOR: puede cambiar la de TODOS
        if (rolDelToken === "ADMINISTRADOR_ROLE") {
            return true;
        }
        
        // GERENTE_GENERAL: puede cambiar la de TODOS EXCEPTO ADMINISTRADOR
        if (rolDelToken === "GERENTE_GENERAL_ROLE") {
            return true;
        }
        
        // Otros roles NO pueden cambiar contraseña de otros usuarios
        throw new Error("No tienes permiso para cambiar la contraseña de otro usuario");
    }),
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

// Validador para editar perfil SEGUN MATRIZ DE ROLES:
// - ADMINISTRADOR: edita TODOS
// - GERENTE_GENERAL: edita TODOS EXCEPTO ADMINISTRADOR
// - CONTADOR: edita TODOS EXCEPTO ADMINISTRADOR y GERENTE_GENERAL
// - Otros: solo su propio perfil
export const actualizarPerfilPropioValidator = [
    validateJWT,
    param("uid").isMongoId().withMessage("No es un ID válido"),
    param("uid").custom(usuarioIdExists),
    param("uid").custom((value, { req }) => {
        const usuarioIdDelToken = req.usuario._id.toString();
        const usuarioIdEnParams = value;
        const rolDelToken = req.usuario.rol;
        
        // Si es tu propio perfil, siempre puedes editar
        if (usuarioIdDelToken === usuarioIdEnParams) {
            return true;
        }
        
        // ADMINISTRADOR: puede editar a TODOS
        if (rolDelToken === "ADMINISTRADOR_ROLE") {
            return true;
        }
        
        // GERENTE_GENERAL: puede editar a TODOS EXCEPTO ADMINISTRADOR
        if (rolDelToken === "GERENTE_GENERAL_ROLE") {
            return true;
        }
        
        // CONTADOR: puede editar TODOS EXCEPTO ADMINISTRADOR y GERENTE_GENERAL
        if (rolDelToken === "CONTADOR_ROLE") {
            return true;
        }
        
        // Otros roles (GERENTE, VENDEDOR, AUXILIAR, CLIENTE): NO pueden editar otros
        throw new Error("No tienes permiso para actualizar el perfil de otro usuario");
    }),
    validateField,
    handleErrors
];