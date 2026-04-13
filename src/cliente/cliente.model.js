import { Schema, model } from "mongoose";

const clienteSchema = Schema({
    // Información Básica
    nombre: {
        type: String,
        required: [true, "El nombre del cliente es requerido"],
        maxLength: [100, "El nombre no puede exceder 100 caracteres"]
    },
    nombreContacto: {
        type: String,
        maxLength: [80, "El nombre de contacto no puede exceder 80 caracteres"]
    },
    telefonoContacto: {
        type: String
    },
    correoContacto: {
        type: String
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

    // Ubicación (Guatemala)
    direccion: {
        type: String,
        required: [true, "La dirección es requerida"]
    },
    ciudad: {
        type: String,
        required: [true, "La ciudad es requerida"]
    },
    departamento: {
        type: String,
        required: [true, "El departamento es requerido"]
    },
    codigoPostal: {
        type: String,
        default: null
    },

    // Contacto
    correo: {
        type: String,
        required: [true, "El correo es requerido"],
        unique: true,
        lowercase: true
    },
    telefono: {
        type: String,
        required: [true, "El teléfono es requerido"]
    },
    telefonoSecundario: {
        type: String,
        default: null
    },

    // Información Comercial
    condicionPago: {
        type: String,
        required: [true, "La condición de pago es requerida"],
        enum: ["CONTADO", "CREDITO"],
        default: "CONTADO"
    },
    diasCredito: {
        type: Number,
        default: 0
    },
    limiteCreditoMes: {
        type: Number,
        default: 0
    },
    banco: {
        type: String,
        default: null
    },
    numeroCuenta: {
        type: String,
        default: null
    },
    tipoCuenta: {
        type: String,
        enum: ["AHORRO", "CORRIENTE"],
        default: "CORRIENTE"
    },

    // Asignación de personal
    gerenteAsignado: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        default: null
    },
    vendedorAsignado: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        default: null
    },

    // Auditoría
    estado: {
        type: Boolean,
        default: true
    },
    creadoPor: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "creadoEn",
        updatedAt: "actualizadoEn"
    }
});

clienteSchema.methods.toJSON = function() {
    const { _id, ...cliente } = this.toObject();
    cliente.id = _id;
    return cliente;
}

export default model("Cliente", clienteSchema);
