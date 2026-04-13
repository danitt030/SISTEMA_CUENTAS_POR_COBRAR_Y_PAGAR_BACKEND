import { hash, verify } from "argon2";
import Usuario from "../user/user.model.js";
import { generateJWT } from "../helpers/generate-jwt.js";
import { crearClienteAutomatico } from "../cliente/cliente.controller.js";

export const registrar = async (req, res) => {
    try {
        const data = req.body;
        const contraseñaEncriptada = await hash(data.contraseña);
        data.contraseña = contraseñaEncriptada;

        // ==================== ASIGNACIÓN INTELIGENTE DE ROL ====================
        // Si hay JWT y es ADMINISTRADOR: puede usar el rol del body
        // Si NO hay JWT: es registro público, SOLO CLIENTE_ROLE
        
        const hasJWT = req.usuario !== undefined; // Existe si pasó validación JWT
        const isAdmin = hasJWT && req.usuario.rol === "ADMINISTRADOR_ROLE";

        if (!hasJWT) {
            // Registro público - SOLO CLIENTE_ROLE
            data.rol = "CLIENTE_ROLE";
        } else if (isAdmin && data.rol) {
            // ADMINISTRADOR especificó un rol - USE el del body (ya validado en registrarValidator)
            // data.rol ya está en el body, no cambiar
        } else if (!isAdmin) {
            // JWT existe pero NO es ADMINISTRADOR - error (debería haber sido bloqueado por validador)
            return res.status(403).json({
                success: false,
                message: "Solo ADMINISTRADOR puede crear usuarios con roles específicos"
            });
        } else {
            // JWT existe, es ADMIN, pero no especificó rol - asignar CLIENTE_ROLE por defecto
            data.rol = "CLIENTE_ROLE";
        }

        const usuario = await Usuario.create(data);

        // Auto-crear Cliente si el rol es CLIENTE_ROLE
        if (usuario.rol === "CLIENTE_ROLE") {
            try {
                await crearClienteAutomatico(
                    usuario._id,
                    usuario.nombre,
                    usuario.correo,
                    usuario.telefono,
                    usuario.tipoDocumento,
                    usuario.numeroDocumento
                );
            } catch (err) {
                console.error("Error al crear Cliente automático:", err.message);
                // No fallar el registro del usuario si falla la creación del Cliente
            }
        }

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

        const token = await generateJWT(usuarioEncontrado.id, usuarioEncontrado.rol);
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