import Usuario from "../user/user.model.js";

export const correoExists = async (correo) => {
    const existeCorreo = await Usuario.findOne({ correo });
    if (existeCorreo) {
        throw new Error(`El correo ${correo} ya está registrado`);
    }
};

export const usuarioExists = async (usuario) => {
    const existeUsuario = await Usuario.findOne({ usuario });
    if (existeUsuario) {
        throw new Error(`El usuario ${usuario} ya está registrado`);
    }
};

export const numeroDocumentoExists = async (numeroDocumento) => {
    const existeDocumento = await Usuario.findOne({ numeroDocumento });
    if (existeDocumento) {
        throw new Error(`El número de documento ${numeroDocumento} ya está registrado`);
    }
};

export const usuarioIdExists = async (uid) => {
    const existeUsuario = await Usuario.findById(uid);
    if (!existeUsuario) {
        throw new Error(`El usuario con id ${uid} no existe`);
    }
};