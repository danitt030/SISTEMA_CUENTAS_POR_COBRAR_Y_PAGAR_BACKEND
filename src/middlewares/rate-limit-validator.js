import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 2000,                  // 2000 peticiones (aumentado significativamente)
    message: {
        success: false,
        message: "Demasiadas peticiones, por favor intenta de nuevo más tarde"
    },
    standardHeaders: true,
    legacyHeaders: false,
})

export default apiLimiter