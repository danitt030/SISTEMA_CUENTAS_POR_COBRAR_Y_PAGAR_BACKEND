import PagoProveedor from "./pagoProveedor.model.js";
import FacturaPorPagar from "../facturaPorPagar/facturaPorPagar.model.js";
import Proveedor from "../proveedor/proveedor.model.js";
import XLSX from "xlsx";
import { descargarExcel } from "../helpers/excel-generator.js";

/**
 * Validates and corrects invoice status based on actual payments made
 * Updates BD if status needs correction
 * Returns invoices with correct status
 */
const validarYCorregirEstadoFacturasPagar = async (facturas) => {
    try {
        for (let factura of facturas) {
            // Calculate total paid from PagoProveedor records
            const totalPagado = await PagoProveedor.aggregate([
                { $match: { facturaPorPagar: factura._id, activo: true } },
                { $group: { _id: null, montoPagadoTotal: { $sum: "$monto" } } }
            ]);

            const montoPagadoTotal = totalPagado[0]?.montoPagadoTotal || 0;
            let nuevoEstado = "PENDIENTE";

            // Determine correct status
            if (montoPagadoTotal >= factura.monto) {
                nuevoEstado = "PAGADA";
            } else if (montoPagadoTotal > 0) {
                nuevoEstado = "PARCIAL";
            }

            // Update if changed
            if (factura.estado !== nuevoEstado) {
                await FacturaPorPagar.findByIdAndUpdate(
                    factura._id,
                    { estado: nuevoEstado },
                    { new: true }
                );
                factura.estado = nuevoEstado;
            }
        }
        return facturas;
    } catch (error) {
        // Return unchanged if validation fails
        return facturas;
    }
};

export const crearPagoProveedor = async (req, res) => {
    try {
        const { numeroRecibo, facturaPorPagar, proveedor, monto, moneda, metodoPago, fechaPago, referencia, descripcion } = req.body;
        
        // Validar que el monto sea válido
        if (!monto || monto <= 0) {
            return res.status(400).json({ success: false, message: "El monto debe ser mayor a 0" });
        }
        
        const facturaExiste = await FacturaPorPagar.findById(facturaPorPagar);
        if (!facturaExiste) {
            return res.status(409).json({ success: false, message: "La factura por pagar no existe" });
        }

        const proveedorExiste = await Proveedor.findById(proveedor);
        if (!proveedorExiste) {
            return res.status(409).json({ success: false, message: "El proveedor no existe" });
        }

        const numeroReciboExiste = await PagoProveedor.findOne({ numeroRecibo });
        if (numeroReciboExiste) {
            return res.status(409).json({ success: false, message: "El número de recibo ya existe" });
        }

        const pago = new PagoProveedor({
            numeroRecibo,
            facturaPorPagar,
            proveedor,
            monto,
            moneda,
            metodoPago,
            fechaPago,
            referencia,
            descripcion,
            creadoPor: req.usuario.id
        });

        await pago.save();

        // Validar y actualizar estado de la factura
        const factura = await FacturaPorPagar.findById(facturaPorPagar);
        if (factura) {
            await validarYCorregirEstadoFacturasPagar([factura]);
        }

        return res.status(201).json({
            success: true,
            message: "Pago a proveedor registrado exitosamente",
            pago
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerPagosProveedores = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        let filtro = { activo: true };

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            // VENDEDOR solo ve pagos de proveedores asignados
            const proveedoresAsignados = await Proveedor.find({ vendedorAsignado: req.usuario._id }).select("_id");
            if (proveedoresAsignados.length > 0) {
                filtro.proveedor = { $in: proveedoresAsignados.map(p => p._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    pagos: []
                });
            }
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            // GERENTE ve pagos de proveedores asignados
            const proveedoresAsignados = await Proveedor.find({ gerenteAsignado: req.usuario._id }).select("_id");
            if (proveedoresAsignados.length > 0) {
                filtro.proveedor = { $in: proveedoresAsignados.map(p => p._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    pagos: []
                });
            }
        }
        
        const [total, pagos] = await Promise.all([
            PagoProveedor.countDocuments(filtro),
            PagoProveedor.find(filtro)
                .populate("facturaPorPagar", "numeroFactura monto")
                .populate("proveedor", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        return res.status(200).json({
            success: true,
            total,
            pagos
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerPagoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const pago = await PagoProveedor.findById(id)
            .populate("facturaPorPagar")
            .populate("proveedor")
            .populate("creadoPor", "nombre usuario");

        if (!pago) {
            return res.status(404).json({
                success: false,
                message: "Pago no encontrado"
            });
        }

        // Validar acceso por rol
        if (req.usuario.rol === "VENDEDOR_ROLE" || req.usuario.rol === "GERENTE_ROLE") {
            const proveedor = await Proveedor.findById(pago.proveedor._id);
            if (req.usuario.rol === "VENDEDOR_ROLE" && proveedor.vendedorAsignado?._id.toString() !== req.usuario._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "No tiene permisos para ver este pago"
                });
            } else if (req.usuario.rol === "GERENTE_ROLE" && proveedor.gerenteAsignado?._id.toString() !== req.usuario._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "No tiene permisos para ver este pago"
                });
            }
        }

        // Agregar información de saldo a la factura
        if (pago.facturaPorPagar) {
            console.log("📦 Calculando saldo para factura:", pago.facturaPorPagar._id);
            
            const [totalPagado] = await PagoProveedor.aggregate([
                { $match: { facturaPorPagar: pago.facturaPorPagar._id, activo: true } },
                { $group: { _id: null, montoPagado: { $sum: "$monto" } } }
            ]);
            
            const montoPagado = totalPagado?.montoPagado || 0;
            console.log("💰 Total pagado encontrado:", montoPagado, "Registros:", totalPagado);
            
            pago.facturaPorPagar.montoPagado = montoPagado;
            pago.facturaPorPagar.saldoPendiente = pago.facturaPorPagar.monto - montoPagado;
            
            console.log("✅ Factura con saldo calculado:", {
                numeroFactura: pago.facturaPorPagar.numeroFactura,
                montoFactura: pago.facturaPorPagar.monto,
                montoPagado: pago.facturaPorPagar.montoPagado,
                saldoPendiente: pago.facturaPorPagar.saldoPendiente
            });
        } else {
            console.log("⚠️ No hay factura populada");
        }

        return res.status(200).json({
            success: true,
            pago
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const actualizarPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { numeroRecibo, monto, moneda, metodoPago, fechaPago, referencia, descripcion } = req.body;

        const pagoExiste = await PagoProveedor.findById(id);
        if (!pagoExiste) {
            return res.status(404).json({
                success: false,
                message: "Pago no encontrado"
            });
        }

        if (numeroRecibo && numeroRecibo !== pagoExiste.numeroRecibo) {
            const numeroExiste = await PagoProveedor.findOne({ numeroRecibo });
            if (numeroExiste) {
                return res.status(409).json({ success: false, message: "El número de recibo ya existe" });
            }
        }

        const pago = await PagoProveedor.findByIdAndUpdate(
            id,
            {
                numeroRecibo,
                monto,
                moneda,
                metodoPago,
                fechaPago,
                referencia,
                descripcion,
                actualizadoEn: new Date()
            },
            { returnDocument: "after" }
        ).populate("facturaPorPagar").populate("proveedor").populate("creadoPor", "nombre usuario");

        // Validar y actualizar estado de la factura
        if (pago && pago.facturaPorPagar) {
            const factura = await FacturaPorPagar.findById(pago.facturaPorPagar._id);
            if (factura) {
                await validarYCorregirEstadoFacturasPagar([factura]);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Pago actualizado exitosamente",
            pago
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const buscarPagosActivos = async (req, res) => {
    try {
        const { proveedor, fechaInicio, fechaFin, limite = 10, desde = 0 } = req.query;

        const condiciones = { activo: true };

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            const proveedoresAsignados = await Proveedor.find({ vendedorAsignado: req.usuario._id }).select("_id");
            if (proveedoresAsignados.length > 0) {
                condiciones.proveedor = { $in: proveedoresAsignados.map(p => p._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    pagos: []
                });
            }
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            const proveedoresAsignados = await Proveedor.find({ gerenteAsignado: req.usuario._id }).select("_id");
            if (proveedoresAsignados.length > 0) {
                condiciones.proveedor = { $in: proveedoresAsignados.map(p => p._id) };
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    pagos: []
                });
            }
        } else if (proveedor) {
            condiciones.proveedor = proveedor;
        }

        if (fechaInicio && fechaFin) {
            condiciones.fechaPago = {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
            };
        }

        const [total, pagos] = await Promise.all([
            PagoProveedor.countDocuments(condiciones),
            PagoProveedor.find(condiciones)
                .populate("facturaPorPagar", "numeroFactura")
                .populate("proveedor", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        return res.status(200).json({
            success: true,
            total,
            pagos
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const desactivarPago = async (req, res) => {
    try {
        const { id } = req.params;

        const pago = await PagoProveedor.findByIdAndUpdate(
            id,
            { activo: false, actualizadoEn: new Date() },
            { returnDocument: "after" }
        ).populate("facturaPorPagar").populate("proveedor").populate("creadoPor", "nombre usuario");

        if (!pago) {
            return res.status(404).json({
                success: false,
                message: "Pago no encontrado"
            });
        }

        // Validar y actualizar estado de la factura
        if (pago && pago.facturaPorPagar) {
            const factura = await FacturaPorPagar.findById(pago.facturaPorPagar._id);
            if (factura) {
                await validarYCorregirEstadoFacturasPagar([factura]);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Pago desactivado exitosamente",
            pago
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const eliminarPago = async (req, res) => {
    try {
        const { id } = req.params;

        const pago = await PagoProveedor.findByIdAndDelete(id);

        if (!pago) {
            return res.status(404).json({
                success: false,
                message: "Pago no encontrado"
            });
        }

        // Validar y actualizar estado de la factura
        if (pago && pago.facturaPorPagar) {
            const factura = await FacturaPorPagar.findById(pago.facturaPorPagar);
            if (factura) {
                await validarYCorregirEstadoFacturasPagar([factura]);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Pago eliminado exitosamente",
            pago
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerSaldoPago = async (req, res) => {
    try {
        const { id } = req.params;

        // Log para debug
        console.log("obtenerSaldoPago - ID recibido:", id, "Tipo:", typeof id);

        const factura = await FacturaPorPagar.findById(id)
            .populate("proveedor", "nombre")
            .populate("creadoPor", "nombre usuario");

        if (!factura) {
            console.log("Factura no encontrada con ID:", id);
            return res.status(404).json({
                success: false,
                message: "Factura no encontrada"
            });
        }

        console.log("Factura encontrada:", factura.numeroFactura, "Monto:", factura.monto);

        // Validar y corregir estado de la factura
        const facturasCorregidas = await validarYCorregirEstadoFacturasPagar([factura]);
        const facturaCorregida = facturasCorregidas[0];

        // Validar que la factura tenga un monto válido
        if (!facturaCorregida.monto || facturaCorregida.monto <= 0) {
            return res.status(400).json({
                success: false,
                message: `La factura ${facturaCorregida.numeroFactura} no tiene un monto válido (${facturaCorregida.monto || 0}). Por favor, actualiza el monto de la factura.`
            });
        }

        // Agregación correcta - usar "montoPagado" consistentemente
        const agregarPagos = await PagoProveedor.aggregate([
            { $match: { facturaPorPagar: facturaCorregida._id, activo: true } },
            { $group: { _id: null, montoPagado: { $sum: "$monto" } } }
        ]);

        const montoPagado = agregarPagos[0]?.montoPagado || 0;
        const montoPendiente = facturaCorregida.monto - montoPagado;

        console.log("Saldo - Monto:", facturaCorregida.monto, "Pagado:", montoPagado, "Pendiente:", montoPendiente);

        return res.status(200).json({
            success: true,
            factura: {
                id: facturaCorregida._id,
                numeroFactura: facturaCorregida.numeroFactura,
                proveedor: facturaCorregida.proveedor.nombre,
                estado: facturaCorregida.estado
            },
            saldo: {
                montoFactura: facturaCorregida.monto,
                montoPagado,
                montoPendiente,
                porcentajePagado: ((montoPagado / facturaCorregida.monto) * 100).toFixed(2) + "%"
            }
        });
    } catch (err) {
        console.error("Error en obtenerSaldoPago:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const obtenerPagosPorProveedor = async (req, res) => {
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

        const [total, pagos] = await Promise.all([
            PagoProveedor.countDocuments({ proveedor: id, activo: true }),
            PagoProveedor.find({ proveedor: id, activo: true })
                .populate("facturaPorPagar", "numeroFactura monto")
                .populate("proveedor", "nombre numeroDocumento")
                .populate("creadoPor", "nombre usuario")
                .limit(Number(limite))
                .skip(Number(desde))
        ]);

        const totalPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);

        return res.status(200).json({
            success: true,
            total,
            proveedor: proveedorExiste.nombre,
            totalPagado,
            pagos
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const exportarPagosProveedor = async (req, res) => {
    try {
        const pagos = await PagoProveedor.aggregate([
            { $match: { activo: true } },
            {
                $lookup: {
                    from: "facturaporpagar",
                    localField: "facturaPorPagar",
                    foreignField: "_id",
                    as: "factura"
                }
            },
            {
                $lookup: {
                    from: "proveedor",
                    localField: "proveedor",
                    foreignField: "_id",
                    as: "proveedorInfo"
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
            { $unwind: { path: "$proveedorInfo", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$usuario", preserveNullAndEmptyArrays: true } }
        ]);

        const datos = pagos.map(pago => ({
            "Número Recibo": pago.numeroRecibo,
            "Factura": pago.factura?.numeroFactura || "N/A",
            "Proveedor": pago.proveedorInfo?.nombre || "N/A",
            "Monto": pago.monto,
            "Moneda": pago.moneda,
            "Método Pago": pago.metodoPago,
            "Fecha Pago": new Date(pago.fechaPago).toLocaleDateString(),
            "Referencia": pago.referencia || "N/A",
            "Descripción": pago.descripcion || "N/A",
            "Registrado Por": pago.usuario?.nombre || "N/A"
        }));

        // NUEVO: Descargar directamente sin guardar
        descargarExcel(datos, "Pagos a Proveedores", "Pagos_Proveedores", res);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
