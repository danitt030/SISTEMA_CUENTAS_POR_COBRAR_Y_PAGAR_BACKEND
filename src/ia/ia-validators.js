import { body } from "express-validator";
import { validateJWT } from "../middlewares/validate-jwt.js";
import { hasRoles } from "../middlewares/validate-roles.js";
import { validateField } from "../middlewares/validate-fields.js";
import { handleErrors } from "../middlewares/handle-errors.js";

// Validador para la pregunta al asistente de IA
export const validarPreguntaIA = [
    validateJWT,
    hasRoles("ADMINISTRADOR_ROLE", "CONTADOR_ROLE", "GERENTE_GENERAL_ROLE", "GERENTE_ROLE", "VENDEDOR_ROLE"),
    body("pregunta")
        .notEmpty()
        .withMessage("La pregunta es requerida")
        .isLength({ min: 5, max: 500 })
        .withMessage("La pregunta debe tener entre 5 y 500 caracteres"),
    body("modulo")
        .optional()
        .isIn(["cliente", "facturaPorCobrar", "cobroCliente", "reportes"])
        .withMessage("El módulo debe ser: cliente, facturaPorCobrar, cobroCliente o reportes"),
    body("documentoId")
        .optional()
        .isMongoId()
        .withMessage("El ID del documento no es válido"),
    body("conversacionId")
        .optional()
        .isMongoId()
        .withMessage("El ID de la conversación no es válido"),
    validateField,
    handleErrors
];
