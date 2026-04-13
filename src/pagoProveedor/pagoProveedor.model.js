import { Schema, model } from "mongoose";

const pagoProveedorSchema = new Schema({
    numeroRecibo: {
        type: String,
        required: [true, "El número de recibo es requerido"],
        unique: true,
        trim: true
    },
    facturaPorPagar: {
        type: Schema.Types.ObjectId,
        ref: "FacturaPorPagar",
        required: [true, "La factura es requerida"]
    },
    proveedor: {
        type: Schema.Types.ObjectId,
        ref: "Proveedor",
        required: [true, "El proveedor es requerido"]
    },
    monto: {
        type: Number,
        required: [true, "El monto es requerido"],
        min: [0.01, "El monto debe ser mayor a 0"]
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
    fechaPago: {
        type: Date,
        required: [true, "La fecha de pago es requerida"]
    },
    referencia: {
        type: String,
        trim: true,
        maxlength: [100, "La referencia no puede exceder 100 caracteres"]
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

export default model("PagoProveedor", pagoProveedorSchema);
