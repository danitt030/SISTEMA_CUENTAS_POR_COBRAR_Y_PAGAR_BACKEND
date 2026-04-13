import { body, param, query } from "express-validator";
import { validateField } from "./validate-fields.js";
import { validateJWT } from "./validate-jwt.js";
import { hasRoles } from "./validate-roles.js";
import { handleErrors } from "./handle-errors.js";
import Usuario from "../user/user.model.js";
import Auditoria from "../auditoria/auditoria.model.js";

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

// ===== FUNCIÓN PARA CAPTURA AUTOMÁTICA DE AUDITORÍA =====
/**
 * Middleware que captura automáticamente eventos CRUD después de ejecución exitosa
 * @param {string} accion - CREAR, ACTUALIZAR, ELIMINAR
 * @param {string} modulo - USUARIOS, CLIENTES, PROVEEDORES, etc.
 * @param {string} descripcion - Descripción del evento
 * @returns {Function} Middleware
 */
export const crearAuditoriaMiddleware = (accion, modulo, getDescripcion = null) => {
    return async (req, res, next) => {
        // Guardar métodos originales
        const originalStatus = res.status;
        const originalJson = res.json;
        const originalSend = res.send;

        let statusCode = 200;

        // Interceptar res.status() para capturar el status code
        res.status = function(code) {
            statusCode = code;
            return originalStatus.call(this, code);
        };

        // Función auxiliar para registrar auditoría
        const registrarAuditoria = async (data) => {
            // Solo registrar si fue exitoso (200-299)
            if (statusCode >= 200 && statusCode < 300) {
                try {
                    // Determinar descripción (puede ser dinámica)
                    let descripcionFinal = getDescripcion
                        ? getDescripcion(req, data)
                        : `${accion} en módulo ${modulo}`;

                    // Obtener usuarioId
                    let usuarioId = req.usuario?._id;
                    let usuarioAudit = req.usuario?.usuario;

                    // Si es LOGIN y no hay usuario autenticado, buscar en respuesta
                    if (!usuarioId && accion === "LOGIN" && data?.usuarioDetalles?.usuario) {
                        usuarioAudit = data.usuarioDetalles.usuario;
                        // Buscar el usuario en BD por nombre de usuario o correo
                        const usuarioEncontrado = await Usuario.findOne({
                            $or: [
                                { usuario: usuarioAudit },
                                { correo: req.body.correo || data.usuarioDetalles.correo }
                            ]
                        });
                        if (usuarioEncontrado) {
                            usuarioId = usuarioEncontrado._id;
                        }
                    }

                    usuarioAudit = usuarioAudit || "Sistema";

                    // No registrar si no hay usuarioId (seguridad)
                    if (!usuarioId) {
                        console.warn(`[AUDITORIA] No se encontró usuario para registrar ${accion} - ${modulo}`);
                        return;
                    }

                    // 🔥 GUARDAR DIRECTAMENTE EN LA BD (sin usar controller)
                    const evento = await Auditoria.create({
                        usuario: usuarioId,
                        accion,
                        modulo,
                        descripcion: descripcionFinal,
                        objetoAfectado: req.params.uid || req.params.id || null,
                        detallesAntes: req.body || {},
                        detallesDespues: data || {},
                        ipAddress: req.ip,
                        userAgent: req.headers["user-agent"],
                        estado: "EXITOSO"
                    });

                    console.log(`[AUDITORIA] ✅ Evento guardado en BD: ${accion} - ${modulo} por usuario: ${usuarioAudit}`);

                    // 🔥 EMITIR EVENTO EN TIEMPO REAL
                    if (global.io) {
                        global.io.emit("auditoria:nueva", {
                            accion,
                            modulo,
                            descripcion: descripcionFinal,
                            timestamp: new Date(),
                            usuario: usuarioAudit
                        });
                        console.log("📡 Evento emitido por WebSocket");
                    }
                } catch (err) {
                    console.error("❌ Error registrando auditoría:", err.message);
                    // No bloquea la respuesta al usuario
                }
            }
        };

        // Interceptar res.json()
        res.json = function(data) {
            registrarAuditoria(data);
            return originalJson.call(this, data);
        };

        // Interceptar res.send()
        res.send = function(data) {
            if (typeof data === 'object') {
                registrarAuditoria(data);
            }
            return originalSend.call(this, data);
        };

        next();
    };
};
