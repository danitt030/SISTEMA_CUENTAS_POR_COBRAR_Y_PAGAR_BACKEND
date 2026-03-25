import FacturaPorPagar from "./facturaPorPagar.model.js";
import Proveedor from "../proveedor/proveedor.model.js";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const crearFacturaPagar = async (req, res) => {
    try {
        const { numeroFactura, proveedor, monto, moneda, estado, fechaEmision, fechaVencimiento, descripcion } = req.body;
        
        const proveedorExiste = await Proveedor.findById(proveedor);
        if (!proveedorExiste) {
            return res.status(409).json({ success: false, message: "El proveedor no existe" });
        }

        const numeroFacturaExiste = await FacturaPorPagar.findOne({ numeroFactura });
        if (numeroFacturaExiste) {
            return res.status(409).json({ success: false, message: "El número de factura ya existe" });
        }

        const factura = new FacturaPorPagar({
            numeroFactura,
            proveedor,
            monto,
            moneda,
            estado,
            fechaEmision,
            fechaVencimiento,
            descripcion,
            creadoPor: req.usuario.id
        });

        await factura.save();
        return res.status(201).json({
            success: true,
            message: "Factura por pagar creada exitosamente",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerFacturasPagar = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        
        const [total, facturas] = await Promise.all([
            FacturaPorPagar.countDocuments({ activo: true }),
            FacturaPorPagar.find({ activo: true })
                .populate("proveedor", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        return res.status(200).json({
            success: true,
            total,
            facturas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerFacturaPagarPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await FacturaPorPagar.findById(id)
            .populate("proveedor")
            .populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por pagar no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const actualizarFacturaPagar = async (req, res) => {
    try {
        const { id } = req.params;
        const { numeroFactura, proveedor, monto, moneda, estado, fechaEmision, fechaVencimiento, descripcion } = req.body;

        const facturaExiste = await FacturaPorPagar.findById(id);
        if (!facturaExiste) {
            return res.status(404).json({
                success: false,
                message: "Factura por pagar no encontrada"
            });
        }

        if (proveedor) {
            const proveedorExiste = await Proveedor.findById(proveedor);
            if (!proveedorExiste) {
                return res.status(409).json({ success: false, message: "El proveedor no existe" });
            }
        }

        if (numeroFactura && numeroFactura !== facturaExiste.numeroFactura) {
            const numeroExiste = await FacturaPorPagar.findOne({ numeroFactura });
            if (numeroExiste) {
                return res.status(409).json({ success: false, message: "El número de factura ya existe" });
            }
        }

        const factura = await FacturaPorPagar.findByIdAndUpdate(
            id,
            {
                numeroFactura,
                proveedor,
                monto,
                moneda,
                estado,
                fechaEmision,
                fechaVencimiento,
                descripcion,
                actualizadoEn: new Date()
            },
            { returnDocument: "after" }
        ).populate("proveedor").populate("creadoPor", "nombre usuario");

        return res.status(200).json({
            success: true,
            message: "Factura por pagar actualizada exitosamente",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const buscarFacturasActivasPagar = async (req, res) => {
    try {
        const { estado, limite = 10, desde = 0 } = req.query;

        const condiciones = { activo: true };
        if (estado) condiciones.estado = estado;

        const [total, facturas] = await Promise.all([
            FacturaPorPagar.countDocuments(condiciones),
            FacturaPorPagar.find(condiciones)
                .populate("proveedor", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        return res.status(200).json({
            success: true,
            total,
            estado: estado || "TODAS",
            facturas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const desactivarFacturaPagar = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorPagar.findByIdAndUpdate(
            id,
            { activo: false, actualizadoEn: new Date() },
            { returnDocument: "after" }
        ).populate("proveedor").populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por pagar no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Factura por pagar desactivada exitosamente",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const eliminarFacturaPagar = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorPagar.findByIdAndDelete(id);

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por pagar no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Factura por pagar eliminada exitosamente",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerSaldoFacturaPagar = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorPagar.findById(id)
            .populate("proveedor", "nombre limiteCreditoMes")
            .populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por pagar no encontrada"
            });
        }

        const [totalAdeudado, totalPagado, totalPendiente] = await Promise.all([
            FacturaPorPagar.aggregate([
                { $match: { proveedor: factura.proveedor._id, activo: true } },
                { $group: { _id: null, total: { $sum: "$monto" } } }
            ]),
            FacturaPorPagar.aggregate([
                { $match: { proveedor: factura.proveedor._id, estado: "PAGADA", activo: true } },
                { $group: { _id: null, total: { $sum: "$monto" } } }
            ]),
            FacturaPorPagar.aggregate([
                { $match: { proveedor: factura.proveedor._id, estado: { $in: ["PENDIENTE", "PARCIAL"] }, activo: true } },
                { $group: { _id: null, total: { $sum: "$monto" } } }
            ])
        ]);

        return res.status(200).json({
            success: true,
            factura: {
                id: factura._id,
                numeroFactura: factura.numeroFactura,
                proveedor: factura.proveedor
            },
            saldo: {
                totalAdeudado: totalAdeudado[0]?.total || 0,
                totalPagado: totalPagado[0]?.total || 0,
                totalPendiente: totalPendiente[0]?.total || 0,
                limiteCreditoProveedor: factura.proveedor.limiteCreditoMes || 0
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerFacturasPorProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { limite = 10, desde = 0 } = req.query;

        const proveedorExiste = await Proveedor.findById(id);
        if (!proveedorExiste) {
            return res.status(404).json({
                success: false,
                message: "Proveedor no encontrado"
            });
        }

        const [total, facturas] = await Promise.all([
            FacturaPorPagar.countDocuments({ proveedor: id, activo: true }),
            FacturaPorPagar.find({ proveedor: id, activo: true })
                .populate("proveedor", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        return res.status(200).json({
            success: true,
            total,
            proveedor: proveedorExiste.nombre,
            facturas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const verificarLimiteCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const { montoNuevo } = req.body;

        const proveedor = await Proveedor.findById(id);
        if (!proveedor) {
            return res.status(404).json({
                success: false,
                message: "Proveedor no encontrado"
            });
        }

        const [totalPendiente] = await FacturaPorPagar.aggregate([
            { $match: { proveedor: proveedor._id, estado: { $in: ["PENDIENTE", "PARCIAL", "VENCIDA"] }, activo: true } },
            { $group: { _id: null, total: { $sum: "$monto" } } }
        ]);

        const saldoPendiente = totalPendiente?.total || 0;
        const nuevoTotal = saldoPendiente + (montoNuevo || 0);
        const puedeComprar = nuevoTotal <= proveedor.limiteCreditoMes;

        return res.status(200).json({
            success: true,
            proveedor: {
                id: proveedor._id,
                nombre: proveedor.nombre
            },
            limiteCredito: proveedor.limiteCreditoMes,
            saldoPendiente,
            montoNuevo: montoNuevo || 0,
            nuevoTotal,
            puedeComprar,
            creditoDisponible: proveedor.limiteCreditoMes - saldoPendiente
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const exportarFacturasPagar = async (req, res) => {
    try {
        const facturas = await FacturaPorPagar.find({ activo: true })
            .populate("proveedor", "nombre numeroDocumento")
            .populate("creadoPor", "nombre usuario");

        const datos = facturas.map(factura => ({
            "Número Factura": factura.numeroFactura,
            "Proveedor": factura.proveedor?.nombre || "N/A",
            "Monto": factura.monto,
            "Moneda": factura.moneda,
            "Estado": factura.estado,
            "Fecha Emisión": new Date(factura.fechaEmision).toLocaleDateString(),
            "Fecha Vencimiento": new Date(factura.fechaVencimiento).toLocaleDateString(),
            "Descripción": factura.descripcion || "N/A",
            "Creado Por": factura.creadoPor?.nombre || "N/A"
        }));

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Facturas por Pagar");

        const timestamp = new Date().getTime();
        const filename = `Facturas_Pagar_${timestamp}.xlsx`;
        const filepath = path.join(__dirname, `../../public/EXCEL/${filename}`);

        XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
        XLSX.writeFile(wb, filepath);

        return res.status(200).json({
            success: true,
            message: "Archivo exportado exitosamente",
            archivo: filename
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
