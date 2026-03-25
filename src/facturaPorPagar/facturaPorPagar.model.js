import { Schema, model } from "mongoose";

const facturaPorPagarSchema = new Schema({
    numeroFactura: {
        type: String,
        required: [true, "El número de factura es requerido"],
        unique: true,
        trim: true
    },
    proveedor: {
        type: Schema.Types.ObjectId,
        ref: "Proveedor",
        required: [true, "El proveedor es requerido"]
    },
    monto: {
        type: Number,
        required: [true, "El monto es requerido"],
        min: [0, "El monto debe ser mayor o igual a 0"]
    },
    moneda: {
        type: String,
        enum: ["GTQ", "USD", "EUR"],
        default: "GTQ"
    },
    estado: {
        type: String,
        enum: ["PENDIENTE", "PARCIAL", "PAGADA", "VENCIDA"],
        default: "PENDIENTE"
    },
    fechaEmision: {
        type: Date,
        required: [true, "La fecha de emisión es requerida"]
    },
    fechaVencimiento: {
        type: Date,
        required: [true, "La fecha de vencimiento es requerida"]
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, "La descripción no puede exceder 500 caracteres"]
    },
    activo: {
        type: Boolean,
        default: true
    },
    creadoPor: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },
    creadoEn: {
        type: Date,
        default: Date.now
    },
    actualizadoEn: {
        type: Date,
        default: Date.now
    }
});

export default model("FacturaPorPagar", facturaPorPagarSchema);
