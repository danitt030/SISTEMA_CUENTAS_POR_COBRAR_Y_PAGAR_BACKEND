import { Schema, model } from "mongoose";

const auditoriaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },
    accion: {
        type: String,
        enum: ["CREAR", "ACTUALIZAR", "ELIMINAR", "LEER", "EXPORTAR", "DESCARGAR", "LOGIN", "LOGOUT"],
        required: true
    },
    modulo: {
        type: String,
        enum: ["USUARIOS", "PROVEEDORES", "CLIENTES", "FACTURAS_PAGAR", "FACTURAS_COBRAR", "PAGOS_PROVEEDORES", "COBROS_CLIENTES", "REPORTES", "AUDITORIA"],
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    objetoAfectado: {
        type: Schema.Types.ObjectId,
        default: null
    },
    detallesAntes: {
        type: Object,
        default: {}
    },
    detallesDespues: {
        type: Object,
        default: {}
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    estado: {
        type: String,
        enum: ["EXITOSO", "ERROR", "PENDIENTE"],
        default: "EXITOSO"
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: "auditorias"
});

export default model("Auditoria", auditoriaSchema);
