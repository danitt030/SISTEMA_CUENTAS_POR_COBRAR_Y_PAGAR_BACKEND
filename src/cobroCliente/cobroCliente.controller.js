import CobroCliente from "./cobroCliente.model.js";
import FacturaPorCobrar from "../facturaPorCobrar/facturaPorCobrar.model.js";
import Cliente from "../cliente/cliente.model.js";
import XLSX from "xlsx";
import { descargarExcel } from "../helpers/excel-generator.js";

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

        // ACTUALIZAR ESTADO DE FACTURA: Verificar si está completamente pagada
        const totalCobrado = await CobroCliente.aggregate([
            {
                $match: { facturaPorCobrar: facturaExiste._id, activo: true }
            },
            {
                $group: {
                    _id: null,
                    montoCobradoTotal: { $sum: "$montoCobrado" }
                }
            }
        ]);

        if (totalCobrado.length > 0 && totalCobrado[0].montoCobradoTotal >= facturaExiste.monto) {
            // Si está totalmente pagada, cambiar estado a COBRADA
            await FacturaPorCobrar.findByIdAndUpdate(
                facturaPorCobrar,
                { estado: "COBRADA" },
                { new: true }
            );
        } else if (totalCobrado.length > 0 && totalCobrado[0].montoCobradoTotal > 0) {
            // Si está parcialmente pagada, cambiar a PARCIAL
            await FacturaPorCobrar.findByIdAndUpdate(
                facturaPorCobrar,
                { estado: "PARCIAL" },
                { new: true }
            );
        }

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
        let filtro = {};

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            // VENDEDOR solo ve sus propios cobros
            filtro.creadoPor = req.usuario._id;
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            // GERENTE ve cobros de clientes asignados a él
            const clientesAsignados = await Cliente
                .find({ gerenteAsignado: req.usuario._id })
                .select("_id");
            
            if (clientesAsignados.length > 0) {
                filtro.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                // Si no tiene clientes asignados, devuelve vacío
                return res.status(200).json({
                    success: true,
                    total: 0,
                    listaObtenida: 0,
                    cobros: []
                });
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

        // Validar acceso por rol
        if (req.usuario.rol === "VENDEDOR_ROLE" && cobro.creadoPor._id.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver este cobro"
            });
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            const cliente = await require("../cliente/cliente.model.js").default.findById(cobro.cliente);
            if (!cliente || cliente.gerenteAsignado.toString() !== req.usuario._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "No tiene permisos para ver este cobro"
                });
            }
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
        const { montoCobrado, comision, fechaCobro, referencia, metodoPago, descripcion, activo } = req.body;

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
        if (activo !== undefined) cobro.activo = activo;

        cobro.netoCobrado = (montoCobrado || cobro.montoCobrado) - (comision !== undefined ? comision : cobro.comision);
        cobro.actualizadoEn = new Date();

        await cobro.save();

        // ACTUALIZAR ESTADO DE FACTURA después de actualizar el cobro
        const factura = await FacturaPorCobrar.findById(cobro.facturaPorCobrar);
        if (factura) {
            const totalCobrado = await CobroCliente.aggregate([
                {
                    $match: { facturaPorCobrar: factura._id, activo: true }
                },
                {
                    $group: {
                        _id: null,
                        montoCobradoTotal: { $sum: "$montoCobrado" }
                    }
                }
            ]);

            let nuevoEstado = "PENDIENTE";
            if (totalCobrado.length > 0 && totalCobrado[0].montoCobradoTotal > 0) {
                if (totalCobrado[0].montoCobradoTotal >= factura.monto) {
                    nuevoEstado = "COBRADA";
                } else {
                    nuevoEstado = "PARCIAL";
                }
            }

            await FacturaPorCobrar.findByIdAndUpdate(
                factura._id,
                { estado: nuevoEstado },
                { new: true }
            );
        }

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
        const { cliente, fechaInicio, fechaFin, metodoPago, limite = 10, desde = 0 } = req.query;

        let filtro = { activo: true };

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            filtro.creadoPor = req.usuario._id;
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            // GERENTE ve cobros de clientes asignados
            const clientesAsignados = await require("../cliente/cliente.model.js").default
                .find({ gerenteAsignado: req.usuario._id })
                .select("_id");
            
            if (clientesAsignados.length > 0) {
                filtro.cliente = { $in: clientesAsignados.map(c => c._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    listaObtenida: 0,
                    cobros: []
                });
            }
        }

        if (cliente) {
            filtro.cliente = cliente;
        }

        if (metodoPago) {
            filtro.metodoPago = metodoPago;
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

        // ACTUALIZAR ESTADO DE FACTURA después de desactivar el cobro
        const factura = await FacturaPorCobrar.findById(cobro.facturaPorCobrar);
        if (factura) {
            const totalCobrado = await CobroCliente.aggregate([
                {
                    $match: { facturaPorCobrar: factura._id, activo: true }
                },
                {
                    $group: {
                        _id: null,
                        montoCobradoTotal: { $sum: "$montoCobrado" }
                    }
                }
            ]);

            let nuevoEstado = "PENDIENTE";
            if (totalCobrado.length > 0 && totalCobrado[0].montoCobradoTotal > 0) {
                if (totalCobrado[0].montoCobradoTotal >= factura.monto) {
                    nuevoEstado = "COBRADA";
                } else {
                    nuevoEstado = "PARCIAL";
                }
            }

            await FacturaPorCobrar.findByIdAndUpdate(
                factura._id,
                { estado: nuevoEstado },
                { new: true }
            );
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

        // ACTUALIZAR ESTADO DE FACTURA después de eliminar el cobro
        const factura = await FacturaPorCobrar.findById(cobro.facturaPorCobrar);
        if (factura) {
            const totalCobrado = await CobroCliente.aggregate([
                {
                    $match: { facturaPorCobrar: factura._id, activo: true }
                },
                {
                    $group: {
                        _id: null,
                        montoCobradoTotal: { $sum: "$montoCobrado" }
                    }
                }
            ]);

            let nuevoEstado = "PENDIENTE";
            if (totalCobrado.length > 0 && totalCobrado[0].montoCobradoTotal > 0) {
                if (totalCobrado[0].montoCobradoTotal >= factura.monto) {
                    nuevoEstado = "COBRADA";
                } else {
                    nuevoEstado = "PARCIAL";
                }
            }

            await FacturaPorCobrar.findByIdAndUpdate(
                factura._id,
                { estado: nuevoEstado },
                { new: true }
            );
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

        // Validar acceso por rol
        if (req.usuario.rol === "VENDEDOR_ROLE" && clienteExiste.vendedorAsignado?.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver los cobros de este cliente"
            });
        } else if (req.usuario.rol === "GERENTE_ROLE" && clienteExiste.gerenteAsignado?.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver los cobros de este cliente"
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

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            filtro.creadoPor = req.usuario._id;
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            // GERENTE ve comisiones de clientes asignados
            const clientesAsignados = await require("../cliente/cliente.model.js").default
                .find({ gerenteAsignado: req.usuario._id })
                .select("_id");
            
            if (clientesAsignados.length === 0) {
                return res.status(200).json({
                    success: true,
                    comisiones: {
                        totalComisiones: 0,
                        totalCobros: 0,
                        totalNeto: 0,
                        cantidadCobros: 0,
                        comisionPromedio: 0
                    }
                });
            }
            filtro.cliente = { $in: clientesAsignados.map(c => c._id) };
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

        // NUEVO: Descargar directamente sin guardar
        descargarExcel(datos, "Cobros de Clientes", "Cobros_Clientes", res);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const registrarMiPagoCliente = async (req, res) => {
    try {
        const { facturaId } = req.params;
        const { montoAbono, fechaCobro, formaPago, referencias } = req.body;
        const usuarioId = req.usuario._id;

        // 1. Verificar que la factura existe
        const factura = await FacturaPorCobrar.findById(facturaId)
            .populate("cliente", "_id usuarioAsociado");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura no encontrada"
            });
        }

        // 2. Verificar que la factura pertenece al cliente autenticado
        if (factura.cliente.usuarioAsociado.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para pagar esta factura"
            });
        }

        // 3. Validar que el monto no exceda el monto de la factura
        if (montoAbono <= 0) {
            return res.status(400).json({
                success: false,
                message: "El monto debe ser mayor a 0"
            });
        }

        if (montoAbono > factura.monto) {
            return res.status(400).json({
                success: false,
                message: `No puedes pagar más que el monto de la factura (${factura.monto})`
            });
        }

        // 4. Verificar si ya está completamente pagada
        if (factura.estado === "COBRADA") {
            return res.status(400).json({
                success: false,
                message: "Esta factura ya ha sido completamente pagada"
            });
        }

        // 5. Obtener los cobros previos de esta factura
        const cobrosPrevios = await CobroCliente.aggregate([
            { $match: { facturaPorCobrar: factura._id, activo: true } },
            { $group: { _id: null, total: { $sum: "$montoCobrado" } } }
        ]);

        const montoCobradoPrevio = cobrosPrevios[0]?.total || 0;
        const montoTotalCobrado = montoCobradoPrevio + montoAbono;

        // 6. Crear el nuevo registro de cobro
        const clienteId = factura.cliente._id;
        const cobro = new CobroCliente({
            numeroComprobante: `PAGO-CLI-${Date.now()}`,
            facturaPorCobrar: facturaId,
            cliente: clienteId,
            montoFactura: factura.monto,
            montoCobrado: montoAbono,
            moneda: factura.moneda || "GTQ",
            metodoPago: formaPago,
            fechaCobro: new Date(fechaCobro),
            referencia: referencias || "",
            comision: 0,
            netoCobrado: montoAbono,
            descripcion: `Pago registrado por cliente - ${referencias || "Sin referencia"}`,
            creadoPor: usuarioId,
            activo: true
        });

        await cobro.save();

        // 7. Actualizar el estado de la factura
        let nuevoEstado = "COBRADA";
        if (montoTotalCobrado < factura.monto) {
            nuevoEstado = "PARCIAL";
        }

        await FacturaPorCobrar.findByIdAndUpdate(
            facturaId,
            { 
                estado: nuevoEstado,
                actualizadoEn: new Date()
            },
            { new: true }
        );

        return res.status(201).json({
            success: true,
            message: `Pago registrado exitosamente. Factura actualizada a estado: ${nuevoEstado}`,
            cobro: {
                _id: cobro._id,
                numeroComprobante: cobro.numeroComprobante,
                montoCobrado: cobro.montoCobrado,
                fechaCobro: cobro.fechaCobro,
                formaPago: cobro.metodoPago
            },
            facturaEstado: nuevoEstado,
            totalCobrado: montoTotalCobrado
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
