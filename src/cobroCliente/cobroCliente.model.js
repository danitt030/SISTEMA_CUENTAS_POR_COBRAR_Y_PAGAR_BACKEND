import { Schema, model } from "mongoose";

const cobroClienteSchema = new Schema({
    numeroComprobante: {
        type: String,
        required: [true, "El número de comprobante es requerido"],
        unique: true,
        trim: true
    },
    facturaPorCobrar: {
        type: Schema.Types.ObjectId,
        ref: "FacturaPorCobrar",
        required: [true, "La factura es requerida"]
    },
    cliente: {
        type: Schema.Types.ObjectId,
        ref: "Cliente",
        required: [true, "El cliente es requerido"]
    },
    montoFactura: {
        type: Number,
        required: [true, "El monto de la factura es requerido"],
        min: [0, "El monto debe ser mayor o igual a 0"]
    },
    montoCobrado: {
        type: Number,
        required: [true, "El monto cobrado es requerido"],
        min: [0, "El monto debe ser mayor o igual a 0"]
    },
    moneda: {
        type: String,
        enum: ["GTQ", "USD", "EUR"],
        default: "GTQ"
    },
    metodoPago: {
        type: String,
        enum: ["TRANSFERENCIA", "EFECTIVO", "CHEQUE", "TARJETA"],
        required: [true, "El método de pago es requerido"]
    },
    fechaCobro: {
        type: Date,
        required: [true, "La fecha de cobro es requerida"]
    },
    referencia: {
        type: String,
        trim: true,
        maxlength: [100, "La referencia no puede exceder 100 caracteres"]
    },
    comision: {
        type: Number,
        default: 0,
        min: [0, "La comisión no puede ser negativa"]
    },
    netoCobrado: {
        type: Number,
        required: [true, "El neto cobrado es requerido"]
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [300, "La descripción no puede exceder 300 caracteres"]
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

export default model("CobroCliente", cobroClienteSchema);
