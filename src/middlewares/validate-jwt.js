import jwt from "jsonwebtoken"
import User from "../user/user.model.js"

export const validateJWT = async (req, res, next) => {
    try{
        let token = req.headers["authorization"]

        if(!token){
            return res.status(400).json({
                success: false,
                message: "No existe token en la petición"
            })
        }

        token = token.replace(/^Bearer\s+/i, "")

        const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY)

        const user = await User.findById(uid)

        if(!user){
           return res.status(400).json({
                success: false,
                message: "usuario no existe en la DB"
           }) 
        }

        if(user.estado === false){
            return res.status(400).json({
                success: false,
                message: "Usuario desactivado previamente"
            })
        }

        req.usuario = user
        next()
    }catch(err){
        return res.status(500).json({
            success: false,
            message : "Error al validar el token",
            error: err.message
        })
    }
}

// ==================== JWT OPCIONAL ====================
// Intenta validar JWT si existe, pero NO falla si no existe
// Útil para rutas públicas que permiten autenticación opcional
export const validateJWTOptional = async (req, res, next) => {
    try {
        let token = req.headers["authorization"]
        
        // Si no hay token, continuar sin problema
        if (!token) {
            return next()
        }

        token = token.replace(/^Bearer\s+/i, "")
        const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY)
        const user = await User.findById(uid)

        if (user && user.estado !== false) {
            req.usuario = user
        }
        // Si hay error, simplemente continuar sin usuario
        next()
    } catch (err) {
        // Si hay error al validar JWT, simplemente continuar
        // El validador decidirá si es crítico
        next()
    }
}