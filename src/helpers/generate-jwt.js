import jwt from "jsonwebtoken"

export const generateJWT = (uid = " ", rol = null) => {
    return new Promise((resolve, reject) => {
        const payload = { uid, rol }

        jwt.sign(
            payload,
            process.env.SECRETORPRIVATEKEY,
            {
                expiresIn: "24h"
            },
            (err, token) =>{
                if(err){
                    reject({
                        success: false,
                        message: err
                    })
                }else{
                    resolve(token)
                }
            }
        )
    })
}