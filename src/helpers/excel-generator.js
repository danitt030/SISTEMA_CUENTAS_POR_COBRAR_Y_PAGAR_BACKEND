import XLSX from "xlsx";

/**
 * Genera y descarga un archivo Excel directamente al cliente sin guardarlo en servidor
 * @param {Array} datos - Array de objetos con los datos a exportar
 * @param {String} nombreHoja - Nombre de la hoja del Excel
 * @param {String} nombreArchivo - Nombre del archivo a descargar (sin .xlsx)
 * @param {Response} res - Objeto response de Express
 */
export const descargarExcel = (datos, nombreHoja, nombreArchivo, res) => {
    try {
        // Crear workbook y worksheet
        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

        // Generar buffer en lugar de guardar en disco
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

        // Configurar headers para descarga automática
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
        const nombreFinal = `${nombreArchivo}_${timestamp}.xlsx`;

        res.setHeader("Content-Disposition", `attachment; filename="${nombreFinal}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Length", buffer.length);

        // Enviar archivo directamente
        return res.status(200).send(buffer);
    } catch (err) {
        console.error("❌ Error al generar Excel:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error al generar Excel: " + err.message
        });
    }
};

/**
 * Genera múltiples hojas en un solo Excel y lo descarga automáticamente
 * @param {Object} hojas - Objeto con { nombreHoja: datos, ... }
 * @param {String} nombreArchivo - Nombre del archivo a descargar
 * @param {Response} res - Objeto response de Express
 */
export const descargarExcelMultiple = (hojas, nombreArchivo, res) => {
    try {
        const wb = XLSX.utils.book_new();

        // Agregar cada hoja
        Object.entries(hojas).forEach(([nombreHoja, datos]) => {
            const ws = XLSX.utils.json_to_sheet(datos);
            XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
        });

        // Generar buffer
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

        // Configurar headers
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
        const nombreFinal = `${nombreArchivo}_${timestamp}.xlsx`;

        res.setHeader("Content-Disposition", `attachment; filename="${nombreFinal}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Length", buffer.length);

        return res.status(200).send(buffer);
    } catch (err) {
        console.error("❌ Error al generar Excel múltiple:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error al generar Excel: " + err.message
        });
    }
};
