import { hash, verify } from "argon2";
import Usuario from "../user/user.model.js";
import { generateJWT } from "../helpers/generate-jwt.js";

export const registrar = async (req, res) => {
    try {
        const data = req.body;
        const contraseñaEncriptada = await hash(data.contraseña);
        data.contraseña = contraseñaEncriptada;

        const usuario = await Usuario.create(data);

        return res.status(201).json({
            success: true,
            message: "Usuario registrado exitosamente",
            usuario: {
                uid: usuario._id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                usuario: usuario.usuario,
                rol: usuario.rol,
                departamento: usuario.departamento,
                puesto: usuario.puesto
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al registrar usuario",
            error: err.message
        });
    }
};

export const iniciarSesion = async (req, res) => {
    const { correo, usuario, contraseña } = req.body;
    try {
        const usuarioEncontrado = await Usuario.findOne({
            $or: [{ correo: correo }, { usuario: usuario }]
        });

        if (!usuarioEncontrado) {
            return res.status(400).json({
                success: false,
                message: "Credenciales inválidas",
                error: "Usuario o correo no encontrado"
            });
        }

        if (!usuarioEncontrado.estado) {
            return res.status(400).json({
                success: false,
                message: "Usuario desactivado"
            });
        }

        const contraseñaValida = await verify(usuarioEncontrado.contraseña, contraseña);

        if (!contraseñaValida) {
            return res.status(400).json({
                success: false,
                message: "Credenciales inválidas",
                error: "Contraseña incorrecta"
            });
        }

        const token = await generateJWT(usuarioEncontrado.id);
        const usuarioJson = usuarioEncontrado.toJSON();

        return res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso",
            usuarioDetalles: {
                uid: usuarioJson.uid,
                nombre: usuarioJson.nombre,
                apellido: usuarioJson.apellido,
                usuario: usuarioJson.usuario,
                correo: usuarioJson.correo,
                telefono: usuarioJson.telefono,
                rol: usuarioJson.rol,
                departamento: usuarioJson.departamento,
                puesto: usuarioJson.puesto,
                token: token
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error en el inicio de sesión",
            error: err.message
        });
    }
};