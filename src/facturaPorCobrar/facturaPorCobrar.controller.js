import FacturaPorCobrar from "./facturaPorCobrar.model.js";
import Cliente from "../cliente/cliente.model.js";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const crearFacturaCobrar = async (req, res) => {
    try {
        const { numeroFactura, cliente, monto, moneda, estado, fechaEmision, fechaVencimiento, descripcion } = req.body;
        
        const clienteExiste = await Cliente.findById(cliente);
        if (!clienteExiste) {
            return res.status(409).json({ success: false, message: "El cliente no existe" });
        }

        const numeroFacturaExiste = await FacturaPorCobrar.findOne({ numeroFactura });
        if (numeroFacturaExiste) {
            return res.status(409).json({ success: false, message: "El número de factura ya existe" });
        }

        const factura = new FacturaPorCobrar({
            numeroFactura,
            cliente,
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
            message: "Factura por cobrar creada exitosamente",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerFacturasCobrar = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        let filtro = {};

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            // VENDEDOR solo ve facturas de clientes asignados
            const clientesAsignados = await Cliente.find({ vendedorAsignado: req.usuario._id }).select("_id");
            if (clientesAsignados.length > 0) {
                filtro.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    facturas: []
                });
            }
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            // GERENTE ve facturas de clientes asignados
            const clientesAsignados = await Cliente.find({ gerenteAsignado: req.usuario._id }).select("_id");
            if (clientesAsignados.length > 0) {
                filtro.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    facturas: []
                });
            }
        }
        
        const [total, facturas] = await Promise.all([
            FacturaPorCobrar.countDocuments(filtro),
            FacturaPorCobrar.find(filtro)
                .populate("cliente", "nombre numeroDocumento")
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

export const obtenerFacturaCobrarPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await FacturaPorCobrar.findById(id)
            .populate("cliente")
            .populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por cobrar no encontrada"
            });
        }

        // Validar acceso por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            const cliente = await Cliente.findById(factura.cliente);
            if (cliente.vendedorAsignado?.toString() !== req.usuario._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "No tiene permisos para ver esta factura"
                });
            }
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            const cliente = await Cliente.findById(factura.cliente);
            if (cliente.gerenteAsignado?.toString() !== req.usuario._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "No tiene permisos para ver esta factura"
                });
            }
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

export const actualizarFacturaCobrar = async (req, res) => {
    try {
        const { id } = req.params;
        const { numeroFactura, cliente, monto, moneda, estado, fechaEmision, fechaVencimiento, descripcion, activo } = req.body;

        const facturaExiste = await FacturaPorCobrar.findById(id);
        if (!facturaExiste) {
            return res.status(404).json({
                success: false,
                message: "Factura por cobrar no encontrada"
            });
        }

        if (cliente) {
            const clienteExiste = await Cliente.findById(cliente);
            if (!clienteExiste) {
                return res.status(409).json({ success: false, message: "El cliente no existe" });
            }
        }

        if (numeroFactura && numeroFactura !== facturaExiste.numeroFactura) {
            const numeroExiste = await FacturaPorCobrar.findOne({ numeroFactura });
            if (numeroExiste) {
                return res.status(409).json({ success: false, message: "El número de factura ya existe" });
            }
        }

        const factura = await FacturaPorCobrar.findByIdAndUpdate(
            id,
            {
                numeroFactura,
                cliente,
                monto,
                moneda,
                estado,
                fechaEmision,
                fechaVencimiento,
                descripcion,
                activo,
                actualizadoEn: new Date()
            },
            { returnDocument: "after" }
        ).populate("cliente").populate("creadoPor", "nombre usuario");

        return res.status(200).json({
            success: true,
            message: "Factura por cobrar actualizada exitosamente",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const buscarFacturasActivasCobrar = async (req, res) => {
    try {
        const { estado, limite = 10, desde = 0 } = req.query;

        const condiciones = { activo: true };
        if (estado) condiciones.estado = estado;

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            const clientesAsignados = await Cliente.find({ vendedorAsignado: req.usuario._id }).select("_id");
            if (clientesAsignados.length > 0) {
                condiciones.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    facturas: []
                });
            }
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            const clientesAsignados = await Cliente.find({ gerenteAsignado: req.usuario._id }).select("_id");
            if (clientesAsignados.length > 0) {
                condiciones.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    facturas: []
                });
            }
        }

        const [total, facturas] = await Promise.all([
            FacturaPorCobrar.countDocuments(condiciones),
            FacturaPorCobrar.find(condiciones)
                .populate("cliente", "nombre numeroDocumento")
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

export const desactivarFacturaCobrar = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorCobrar.findByIdAndUpdate(
            id,
            { activo: false, actualizadoEn: new Date() },
            { returnDocument: "after" }
        ).populate("cliente").populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por cobrar no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Factura por cobrar desactivada exitosamente",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const eliminarFacturaCobrar = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorCobrar.findByIdAndDelete(id);

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por cobrar no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Factura por cobrar eliminada exitosamente",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerSaldoFacturaCobrar = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorCobrar.findById(id)
            .populate("cliente", "nombre limiteCreditoMes")
            .populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por cobrar no encontrada"
            });
        }

        const [totalAsignado, totalCobrado, totalPendiente] = await Promise.all([
            FacturaPorCobrar.aggregate([
                { $match: { cliente: factura.cliente._id, activo: true } },
                { $group: { _id: null, total: { $sum: "$monto" } } }
            ]),
            FacturaPorCobrar.aggregate([
                { $match: { cliente: factura.cliente._id, estado: "COBRADA", activo: true } },
                { $group: { _id: null, total: { $sum: "$monto" } } }
            ]),
            FacturaPorCobrar.aggregate([
                { $match: { cliente: factura.cliente._id, estado: { $in: ["PENDIENTE", "PARCIAL"] }, activo: true } },
                { $group: { _id: null, total: { $sum: "$monto" } } }
            ])
        ]);

        return res.status(200).json({
            success: true,
            factura: {
                id: factura._id,
                numeroFactura: factura.numeroFactura,
                cliente: factura.cliente
            },
            saldo: {
                totalAsignado: totalAsignado[0]?.total || 0,
                totalCobrado: totalCobrado[0]?.total || 0,
                totalPendiente: totalPendiente[0]?.total || 0
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerFacturasPorCliente = async (req, res) => {
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

        // Validar acceso por rol
        if (req.usuario.rol === "VENDEDOR_ROLE" && clienteExiste.vendedorAsignado?.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver las facturas de este cliente"
            });
        } else if (req.usuario.rol === "GERENTE_ROLE" && clienteExiste.gerenteAsignado?.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver las facturas de este cliente"
            });
        }

        const [total, facturas] = await Promise.all([
            FacturaPorCobrar.countDocuments({ cliente: id, activo: true }),
            FacturaPorCobrar.find({ cliente: id, activo: true })
                .populate("cliente", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        return res.status(200).json({
            success: true,
            total,
            cliente: clienteExiste.nombre,
            facturas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerFacturasVencidas = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        const hoy = new Date();

        const condicion = {
            $or: [
                { estado: "VENCIDA" },  // Facturas marcadas como vencidas
                {
                    fechaVencimiento: { $lt: hoy },
                    estado: { $in: ["PENDIENTE", "PARCIAL"] }
                }  // O facturas pendientes cuya fecha ya pasó
            ],
            activo: true
        };

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            const clientesAsignados = await Cliente.find({ vendedorAsignado: req.usuario._id }).select("_id");
            if (clientesAsignados.length > 0) {
                condicion.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    facturas: []
                });
            }
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            const clientesAsignados = await Cliente.find({ gerenteAsignado: req.usuario._id }).select("_id");
            if (clientesAsignados.length > 0) {
                condicion.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    facturas: []
                });
            }
        }

        const [total, facturas] = await Promise.all([
            FacturaPorCobrar.countDocuments(condicion),
            FacturaPorCobrar.find(condicion)
                .populate("cliente", "nombre numeroDocumento correo")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        return res.status(200).json({
            success: true,
            total,
            fechaAlerta: hoy,
            facturas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerFacturasProximas = async (req, res) => {
    try {
        const { dias = 15, limite = 10, desde = 0 } = req.query;
        const hoy = new Date();
        const fechaLimite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000);

        let condicion = {
            fechaVencimiento: { $gte: hoy, $lte: fechaLimite },
            estado: { $in: ["PENDIENTE", "PARCIAL"] },
            activo: true
        };

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            const clientesAsignados = await Cliente.find({ vendedorAsignado: req.usuario._id }).select("_id");
            if (clientesAsignados.length > 0) {
                condicion.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    facturas: []
                });
            }
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            const clientesAsignados = await Cliente.find({ gerenteAsignado: req.usuario._id }).select("_id");
            if (clientesAsignados.length > 0) {
                condicion.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    facturas: []
                });
            }
        }

        const [total, facturas] = await Promise.all([
            FacturaPorCobrar.countDocuments(condicion),
            FacturaPorCobrar.find(condicion)
                .populate("cliente", "nombre numeroDocumento correo")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        return res.status(200).json({
            success: true,
            total,
            diasAlerta: Number(dias),
            facturas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const marcarFacturaVencida = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorCobrar.findByIdAndUpdate(
            id,
            { estado: "VENCIDA", actualizadoEn: new Date() },
            { returnDocument: "after" }
        ).populate("cliente").populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por cobrar no encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Factura marcada como vencida",
            factura
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const enviarRecordatorio = async (req, res) => {
    try {
        const { id } = req.params;

        const factura = await FacturaPorCobrar.findById(id)
            .populate("cliente", "nombre correo")
            .populate("creadoPor", "nombre usuario");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura por cobrar no encontrada"
            });
        }

        // Simulación de envío de email
        const recordatorio = {
            para: factura.cliente.correo,
            asunto: `Recordatorio: Factura ${factura.numeroFactura} por pagar`,
            cuerpo: `
                Estimado cliente ${factura.cliente.nombre},
                
                Le recordamos que la factura ${factura.numeroFactura}
                de Q${factura.monto} vence el ${new Date(factura.fechaVencimiento).toLocaleDateString()}
                
                Estado actual: ${factura.estado}
                
                Favor proceder al pago.
            `,
            enviado: new Date(),
            estado: "ENVIADO"
        };

        return res.status(200).json({
            success: true,
            message: "Recordatorio enviado exitosamente",
            recordatorio
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const exportarFacturasCobrar = async (req, res) => {
    try {
        const facturas = await FacturaPorCobrar.find({ activo: true })
            .populate("cliente", "nombre numeroDocumento")
            .populate("creadoPor", "nombre usuario");

        const datos = facturas.map(factura => ({
            "Número Factura": factura.numeroFactura,
            "Cliente": factura.cliente?.nombre || "N/A",
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
        XLSX.utils.book_append_sheet(wb, ws, "Facturas por Cobrar");

        const timestamp = new Date().getTime();
        const filename = `Facturas_Cobrar_${timestamp}.xlsx`;
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
