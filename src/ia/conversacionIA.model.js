import { Schema, model } from "mongoose";

const conversacionIASchema = new Schema(
  {
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    titulo: {
      type: String,
      default: "Nueva Conversación",
    },
    modulo: {
      type: String,
      enum: ["cliente", "facturaPorCobrar", "cobroCliente", "reportes"],
      default: "general",
    },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      default: null,
    },
    mensajes: [
      {
        tipo: {
          type: String,
          enum: ["usuario", "asistente"],
          required: true,
        },
        contenido: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    creadoEn: {
      type: Date,
      default: Date.now,
    },
    actualizadoEn: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default model("ConversacionIA", conversacionIASchema);
