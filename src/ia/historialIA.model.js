import { Schema, model } from "mongoose";

const historialIASchema = new Schema(
  {
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    pregunta: {
      type: String,
      required: true,
      trim: true,
    },
    respuesta: {
      type: String,
      required: true,
    },
    modulo: {
      type: String,
      enum: ["cliente", "facturaPorCobrar", "cobroCliente", "reportes"],
      default: "general",
    },
    documentoId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    contexto: {
      type: Schema.Types.Mixed,
      default: null,
    },
    creadoEn: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default model("HistorialIA", historialIASchema);
