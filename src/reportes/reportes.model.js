import { Schema, model } from "mongoose";

const reporteSchema = new Schema({
    tipo: {
        type: String,
        enum: ["SALDOS", "VENCIDAS", "COBRABILIDAD", "PAGABILIDAD", "COMISIONES"],
        required: true
    },
    descripcion: String,
    datos: {
        type: Schema.Types.Object,
        default: {}
    },
    generadoPor: {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },
    fechaGeneracion: {
        type: Date,
        default: Date.now
    }
});

export default model("Reporte", reporteSchema);
