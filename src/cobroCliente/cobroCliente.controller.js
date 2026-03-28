import CobroCliente from "./cobroCliente.model.js";
import FacturaPorCobrar from "../facturaPorCobrar/facturaPorCobrar.model.js";
import Cliente from "../cliente/cliente.model.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const crearCobroCliente = async (req, res) => {
    try {
        const { numeroComprobante, facturaPorCobrar, cliente, montoFactura, montoCobrado, moneda, metodoPago, fechaCobro, referencia, comision, descripcion } = req.body;

        const facturaExiste = await FacturaPorCobrar.findById(facturaPorCobrar);
        if (!facturaExiste) {
            return res.status(404).json({
                success: false,
                message: "Factura no encontrada"
            });
        }

        const clienteExiste = await Cliente.findById(cliente);
        if (!clienteExiste) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        const netoCobrado = montoCobrado - (comision || 0);

        const cobro = new CobroCliente({
            numeroComprobante,
            facturaPorCobrar,
            cliente,
            montoFactura,
            montoCobrado,
            moneda,
            metodoPago,
            fechaCobro: fechaCobro || new Date(),
            referencia,
            comision: comision || 0,
            netoCobrado,
            descripcion,
            creadoPor: req.usuario._id
        });

        await cobro.save();

        return res.status(201).json({
            success: true,
            message: "Cobro creado exitosamente",
            cobro
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerCobrosClientes = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;

        const [total, cobros] = await Promise.all([
            CobroCliente.countDocuments(),
            CobroCliente.find()
                .populate("facturaPorCobrar", "numeroFactura monto")
                .populate("cliente", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
                .sort({ creadoEn: -1 })
        ]);

        return res.status(200).json({
            success: true,
            total,
            listaObtenida: cobros.length,
            cobros
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerCobroPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const cobro = await CobroCliente.findById(id)
            .populate("facturaPorCobrar", "numeroFactura monto fechaVencimiento")
            .populate("cliente", "nombre numeroDocumento correo telefono")
            .populate("creadoPor", "nombre usuario");

        if (!cobro) {
            return res.status(404).json({
                success: false,
                message: "Cobro no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            cobro
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const actualizarCobro = async (req, res) => {
    try {
        const { id } = req.params;
        const { montoCobrado, comision, fechaCobro, referencia, metodoPago, descripcion } = req.body;

        const cobro = await CobroCliente.findById(id);
        if (!cobro) {
            return res.status(404).json({
                success: false,
                message: "Cobro no encontrado"
            });
        }

        if (montoCobrado !== undefined) cobro.montoCobrado = montoCobrado;
        if (comision !== undefined) cobro.comision = comision;
        if (fechaCobro) cobro.fechaCobro = fechaCobro;
        if (referencia) cobro.referencia = referencia;
        if (metodoPago) cobro.metodoPago = metodoPago;
        if (descripcion) cobro.descripcion = descripcion;

        cobro.netoCobrado = (montoCobrado || cobro.montoCobrado) - (comision !== undefined ? comision : cobro.comision);
        cobro.actualizadoEn = new Date();

        await cobro.save();

        return res.status(200).json({
            success: true,
            message: "Cobro actualizado exitosamente",
            cobro
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const buscarCobrosActivos = async (req, res) => {
    try {
        const { cliente, fechaInicio, fechaFin, limite = 10, desde = 0 } = req.query;

        let filtro = { activo: true };

        if (cliente) {
            filtro.cliente = cliente;
        }

        if (fechaInicio || fechaFin) {
            filtro.fechaCobro = {};
            if (fechaInicio) {
                filtro.fechaCobro.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                filtro.fechaCobro.$lte = new Date(fechaFin);
            }
        }

        const [total, cobros] = await Promise.all([
            CobroCliente.countDocuments(filtro),
            CobroCliente.find(filtro)
                .populate("facturaPorCobrar", "numeroFactura monto")
                .populate("cliente", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
                .sort({ fechaCobro: -1 })
        ]);

        return res.status(200).json({
            success: true,
            total,
            listaObtenida: cobros.length,
            cobros
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const desactivarCobro = async (req, res) => {
    try {
        const { id } = req.params;

        const cobro = await CobroCliente.findByIdAndUpdate(
            id,
            { activo: false, actualizadoEn: new Date() },
            { new: true }
        );

        if (!cobro) {
            return res.status(404).json({
                success: false,
                message: "Cobro no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cobro desactivado exitosamente",
            cobro
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const eliminarCobro = async (req, res) => {
    try {
        const { id } = req.params;

        const cobro = await CobroCliente.findByIdAndDelete(id);

        if (!cobro) {
            return res.status(404).json({
                success: false,
                message: "Cobro no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cobro eliminado exitosamente",
            cobro
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerSaldoCobro = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorCobrar.findById(id)
            .populate("cliente", "nombre")
            .populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura no encontrada"
            });
        }

        const [totalCobrado] = await CobroCliente.aggregate([
            { $match: { facturaPorCobrar: factura._id, activo: true } },
            { $group: { _id: null, total: { $sum: "$montoCobrado" } } }
        ]);

        const montoCobrado = totalCobrado?.total || 0;
        const montoPendiente = factura.monto - montoCobrado;

        return res.status(200).json({
            success: true,
            factura: {
                id: factura._id,
                numeroFactura: factura.numeroFactura,
                cliente: factura.cliente.nombre
            },
            saldo: {
                montoFactura: factura.monto,
                montoCobrado,
                montoPendiente,
                porcentajeCobrado: ((montoCobrado / factura.monto) * 100).toFixed(2) + "%"
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerCobrosPorCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { limite = 10, desde = 0 } = req.query;

        const clienteExiste = await Cliente.findById(id);
        if (!clienteExiste) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        const [total, cobros] = await Promise.all([
            CobroCliente.countDocuments({ cliente: id, activo: true }),
            CobroCliente.find({ cliente: id, activo: true })
                .populate("facturaPorCobrar", "numeroFactura monto")
                .populate("cliente", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        const totalCobrado = cobros.reduce((sum, cobro) => sum + cobro.montoCobrado, 0);

        return res.status(200).json({
            success: true,
            total,
            cliente: clienteExiste.nombre,
            totalCobrado,
            cobros
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerComisionesTotales = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let filtro = { activo: true };

        if (fechaInicio || fechaFin) {
            filtro.fechaCobro = {};
            if (fechaInicio) {
                filtro.fechaCobro.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                filtro.fechaCobro.$lte = new Date(fechaFin);
            }
        }

        const resultado = await CobroCliente.aggregate([
            { $match: filtro },
            {
                $group: {
                    _id: null,
                    totalComisiones: { $sum: "$comision" },
                    totalCobros: { $sum: "$montoCobrado" },
                    totalNeto: { $sum: "$netoCobrado" },
                    cantidad: { $sum: 1 }
                }
            }
        ]);

        const datos = resultado[0] || {
            totalComisiones: 0,
            totalCobros: 0,
            totalNeto: 0,
            cantidad: 0
        };

        return res.status(200).json({
            success: true,
            comisiones: {
                totalComisiones: datos.totalComisiones,
                totalCobros: datos.totalCobros,
                totalNeto: datos.totalNeto,
                cantidadCobros: datos.cantidad,
                comisionPromedio: datos.cantidad > 0 ? (datos.totalComisiones / datos.cantidad).toFixed(2) : 0
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const exportarCobrosClientes = async (req, res) => {
    try {
        const cobros = await CobroCliente.aggregate([
            { $match: { activo: true } },
            {
                $lookup: {
                    from: "facturaporcobrar",
                    localField: "facturaPorCobrar",
                    foreignField: "_id",
                    as: "factura"
                }
            },
            {
                $lookup: {
                    from: "cliente",
                    localField: "cliente",
                    foreignField: "_id",
                    as: "clienteInfo"
                }
            },
            {
                $lookup: {
                    from: "usuarios",
                    localField: "creadoPor",
                    foreignField: "_id",
                    as: "usuario"
                }
            },
            { $unwind: { path: "$factura", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$clienteInfo", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$usuario", preserveNullAndEmptyArrays: true } }
        ]);

        const datos = cobros.map(cobro => ({
            "Número Comprobante": cobro.numeroComprobante,
            "Factura": cobro.factura?.numeroFactura || "N/A",
            "Cliente": cobro.clienteInfo?.nombre || "N/A",
            "Monto Factura": cobro.montoFactura,
            "Monto Cobrado": cobro.montoCobrado,
            "Moneda": cobro.moneda,
            "Comisión": cobro.comision,
            "Neto Cobrado": cobro.netoCobrado,
            "Método Pago": cobro.metodoPago,
            "Fecha Cobro": new Date(cobro.fechaCobro).toLocaleDateString(),
            "Referencia": cobro.referencia || "N/A",
            "Descripción": cobro.descripcion || "N/A",
            "Registrado Por": cobro.usuario?.nombre || "N/A"
        }));

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cobros de Clientes");

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `Cobros_Clientes_${timestamp}.xlsx`;
        const excelDir = path.join(__dirname, "../../public/EXCEL");

        if (!fs.existsSync(excelDir)) {
            fs.mkdirSync(excelDir, { recursive: true });
        }

        const filepath = path.join(excelDir, filename);
        XLSX.writeFile(wb, filepath);

        return res.status(200).json({
            success: true,
            message: "Archivo exportado exitosamente",
            archivo: filename,
            total: datos.length,
            ruta: `public/EXCEL/${filename}`,
            rutaCompleta: filepath
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
