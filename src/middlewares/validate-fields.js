import { validationResult } from "express-validator";

export const validateField = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.mapped()
        });
    }
    next();
};