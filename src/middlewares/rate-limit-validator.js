import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
        success: false,
        message: "Demasiadas peticiones, por favor intenta de nuevo más tarde"
    }
})

export default apiLimiter