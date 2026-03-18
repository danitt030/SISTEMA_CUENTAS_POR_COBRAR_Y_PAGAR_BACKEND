import { hash } from "argon2";
import Usuario from "../src/user/user.model.js";

/**
 * Crea un usuario administrador por defecto si no existe
 * Credenciales por defecto:
 * - Usuario: admin
 * - Correo: admin@empresa.gt
 * - Contraseña: admin123
 */
export const crearAdmin = async () => {
    try {
        // Verificar si ya existe un admin
        const adminExistente = await Usuario.findOne({ rol: "ADMINISTRADOR_ROLE" });

        if (adminExistente) {
            console.log("✅ Admin ya existe en la base de datos");
            return;
        }

        // Crear admin por defecto
        const contraseñaEncriptada = await hash("admin123");

        const adminDefault = {
            nombre: "Administrador",
            apellido: "Sistema",
            correo: "admin@empresa.gt",
            usuario: "admin",
            contraseña: contraseñaEncriptada,
            telefono: "+502 7800-0000",
            tipoDocumento: "DPI",
            numeroDocumento: "0000000000000",
            nit: "0000000-0",
            departamento: "Administración",
            puesto: "Administrador del Sistema",
            rol: "ADMINISTRADOR_ROLE",
            direccion: "Dirección Principal",
            departamentoGeografico: "Guatemala",
            estado: true
        };

        const nuevoAdmin = await Usuario.create(adminDefault);

        return nuevoAdmin;
    } catch (err) {
        console.error("Error al crear admin:", err.message);
    }
};
