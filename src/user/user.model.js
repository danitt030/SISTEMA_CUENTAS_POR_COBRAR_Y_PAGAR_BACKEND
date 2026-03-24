import { Schema, model } from "mongoose";

const usuarioSchema = Schema({
    // Información Personal
    nombre: {
        type: String,
        required: [true, "El nombre es requerido"],
        maxLength: [50, "El nombre no puede exceder 50 caracteres"]
    },
    apellido: {
        type: String,
        required: [true, "El apellido es requerido"],
        maxLength: [50, "El apellido no puede exceder 50 caracteres"]
    },
    correo: {
        type: String,
        required: [true, "El correo es requerido"],
        unique: true,
        lowercase: true
    },
    usuario: {
        type: String,
        required: [true, "El usuario es requerido"],
        unique: true
    },
    contraseña: {
        type: String,
        required: [true, "La contraseña es requerida"]
    },
    telefono: {
        type: String,
        required: [true, "El teléfono es requerido"]
    },

    // Identificación (Guatemala)
    tipoDocumento: {
        type: String,
        required: [true, "El tipo de documento es requerido"],
        enum: ["DPI", "NIT", "PASAPORTE"]
    },
    numeroDocumento: {
        type: String,
        required: [true, "El número de documento es requerido"],
        unique: true
    },
    nit: {
        type: String,
        unique: true,
        sparse: true
    },

    // Información Empresarial (Opcional para clientes)
    departamento: {
        type: String,
        default: null
    },
    puesto: {
        type: String,
        default: null
    },
    rol: {
        type: String,
        required: [true, "El rol es requerido"],
        enum: [
            "ADMINISTRADOR_ROLE",
            "GERENTE_GENERAL_ROLE",
            "CONTADOR_ROLE",
            "GERENTE_ROLE",
            "VENDEDOR_ROLE",
            "AUXILIAR_ROLE",
            "CLIENTE_ROLE"
        ]
    },

    // Ubicación (Guatemala) - Opcional para clientes
    direccion: {
        type: String,
        default: null
    },
    departamentoGeografico: {
        type: String,
        default: null
    },

    // Estado
    estado: {
        type: Boolean,
        default: true
    }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "creadoEn",
        updatedAt: "actualizadoEn"
    }
});

usuarioSchema.methods.toJSON = function() {
    const { contraseña, _id, ...usuario } = this.toObject();
    usuario.uid = _id;
    return usuario;
}

export default model("Usuario", usuarioSchema); 