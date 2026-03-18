import { hash, verify } from "argon2";
import Usuario from "./user.model.js";

export const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { uid } = req.params;
        const usuario = await Usuario.findById(uid);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            usuario: usuario.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener el usuario",
            error: err.message
        });
    }
};

export const obtenerUsuarios = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        const query = { estado: true };

        const [total, usuarios] = await Promise.all([
            Usuario.countDocuments(query),
            Usuario.find(query)
                .skip(Number(desde))
                .limit(Number(limite))
                .sort({ creadoEn: -1 })
        ]);

        return res.status(200).json({
            success: true,
            total,
            usuarios: usuarios.map(usuario => usuario.toJSON())
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener los usuarios",
            error: err.message
        });
    }
};

export const obtenerUsuariosPorRol = async (req, res) => {
    try {
        const { rol } = req.params;
        const { limite = 10, desde = 0 } = req.query;

        const query = { estado: true, rol };

        const [total, usuarios] = await Promise.all([
            Usuario.countDocuments(query),
            Usuario.find(query)
                .skip(Number(desde))
                .limit(Number(limite))
                .sort({ creadoEn: -1 })
        ]);

        return res.status(200).json({
            success: true,
            total,
            usuarios: usuarios.map(usuario => usuario.toJSON())
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener usuarios por rol",
            error: err.message
        });
    }
};

export const actualizarUsuario = async (req, res) => {
    try {
        const { uid } = req.params;
        const { _id, contraseña, rol, estado, numeroDocumento, ...resto } = req.body;

        const usuarioActualizado = await Usuario.findByIdAndUpdate(uid, resto, { new: true });

        if (!usuarioActualizado) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Usuario actualizado correctamente",
            usuario: usuarioActualizado.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al actualizar usuario",
            error: err.message
        });
    }
};

export const actualizarContraseña = async (req, res) => {
    try {
        const { uid } = req.params;
        const { nuevaContraseña } = req.body;

        const usuario = await Usuario.findById(uid);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const coincideContraseñaAnterior = await verify(usuario.contraseña, nuevaContraseña);
        if (coincideContraseñaAnterior) {
            return res.status(400).json({
                success: false,
                message: "La nueva contraseña no puede ser igual a la anterior"
            });
        }

        const contraseñaEncriptada = await hash(nuevaContraseña);
        usuario.contraseña = contraseñaEncriptada;
        await usuario.save();

        return res.status(200).json({
            success: true,
            message: "Contraseña actualizada correctamente"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al actualizar contraseña",
            error: err.message
        });
    }
};

export const actualizarRol = async (req, res) => {
    try {
        const { uid } = req.params;
        const { nuevoRol } = req.body;

        const usuario = await Usuario.findById(uid);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        if (usuario.rol === nuevoRol) {
            return res.status(400).json({
                success: false,
                message: "El nuevo rol no puede ser igual al actual"
            });
        }

        const rolesValidos = [
            "ADMINISTRADOR_ROLE",
            "GERENTE_GENERAL_ROLE",
            "CONTADOR_ROLE",
            "GERENTE_ROLE",
            "VENDEDOR_ROLE",
            "AUXILIAR_ROLE",
            "CLIENTE_ROLE"
        ];
        if (!rolesValidos.includes(nuevoRol)) {
            return res.status(400).json({
                success: false,
                message: "Rol no válido"
            });
        }

        await Usuario.findByIdAndUpdate(uid, { rol: nuevoRol }, { new: true });

        return res.status(200).json({
            success: true,
            message: "Rol actualizado correctamente"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al actualizar rol",
            error: err.message
        });
    }
};

export const desactivarUsuario = async (req, res) => {
    try {
        const { uid } = req.params;

        const usuario = await Usuario.findById(uid);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // Desactivación lógica (cambiar estado a false)
        await Usuario.findByIdAndUpdate(uid, { estado: false });

        return res.status(200).json({
            success: true,
            message: "Usuario desactivado correctamente"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al desactivar el usuario",
            error: err.message
        });
    }
};

export const eliminarCuentaPropia = async (req, res) => {
    try {
        const { uid } = req.params;
        const { contraseña } = req.body;

        const usuario = await Usuario.findById(uid);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const contraseñaValida = await verify(usuario.contraseña, contraseña);
        if (!contraseñaValida) {
            return res.status(400).json({
                success: false,
                message: "La contraseña es incorrecta"
            });
        }

        // Eliminación física de la cuenta
        await Usuario.findByIdAndDelete(uid);

        return res.status(200).json({
            success: true,
            message: "Cuenta eliminada correctamente"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al eliminar la cuenta",
            error: err.message
        });
    }
};