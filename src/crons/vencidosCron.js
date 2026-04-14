import cron from "node-cron";
import FacturaPorCobrar from "../facturaPorCobrar/facturaPorCobrar.model.js";
import FacturaPorPagar from "../facturaPorPagar/facturaPorPagar.model.js";

export const iniciarCronVencidos = () => {
    // Ejecuta cada día a las 00:00 (medianoche)
    cron.schedule("0 0 * * *", async () => {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            console.log(`[CRON] Iniciando actualización de facturas vencidas - ${new Date()}`);

            // Actualizar Facturas por Cobrar
            const resultadoCobrar = await FacturaPorCobrar.updateMany(
                {
                    fechaVencimiento: { $lt: hoy },
                    activo: true,
                    estado: { $ne: "VENCIDA" }  // Solo si no está ya marcada como vencida
                },
                {
                    $set: { estado: "VENCIDA" }
                }
            );

            // Actualizar Facturas por Pagar
            const resultadoPagar = await FacturaPorPagar.updateMany(
                {
                    fechaVencimiento: { $lt: hoy },
                    activo: true,
                    estado: { $ne: "VENCIDA" }  // Solo si no está ya marcada como vencida
                },
                {
                    $set: { estado: "VENCIDA" }
                }
            );

            console.log(`[CRON] Facturas por Cobrar actualizadas: ${resultadoCobrar.modifiedCount}`);
            console.log(`[CRON] Facturas por Pagar actualizadas: ${resultadoPagar.modifiedCount}`);
            console.log(`[CRON] Actualización completada exitosamente`);

        } catch (err) {
            console.error("[CRON ERROR] Error al actualizar facturas vencidas:", err.message);
        }
    });

    console.log("[CRON] Cron de facturas vencidas iniciado (se ejecuta diariamente a las 00:00)");
};
