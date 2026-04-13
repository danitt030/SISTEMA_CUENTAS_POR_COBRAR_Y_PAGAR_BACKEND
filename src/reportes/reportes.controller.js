import FacturaPorPagar from "../facturaPorPagar/facturaPorPagar.model.js";
import FacturaPorCobrar from "../facturaPorCobrar/facturaPorCobrar.model.js";
import PagoProveedor from "../pagoProveedor/pagoProveedor.model.js";
import CobroCliente from "../cobroCliente/cobroCliente.model.js";
import Proveedor from "../proveedor/proveedor.model.js";
import Cliente from "../cliente/cliente.model.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. RESUMEN DE SALDOS - Deuda total a pagar y a cobrar
export const resumenSaldos = async (req, res) => {
    try {
        const facturasPagar = await FacturaPorPagar.find({ activo: true });
        const facturasCobar = await FacturaPorCobrar.find({ activo: true });
        
        const pagos = await PagoProveedor.aggregate([
            { $match: { activo: true } },
            { $group: { _id: null, totalPagado: { $sum: "$monto" } } }
        ]);
        
        const cobros = await CobroCliente.aggregate([
            { $match: { activo: true } },
            { $group: { _id: null, totalCobrado: { $sum: "$montoCobrado" } } }
        ]);

        const totalFacturasPagar = facturasPagar.reduce((sum, f) => sum + f.monto, 0);
        const totalFacturasCobar = facturasCobar.reduce((sum, f) => sum + f.monto, 0);
        const totalPagado = pagos[0]?.totalPagado || 0;
        const totalCobrado = cobros[0]?.totalCobrado || 0;

        const saldoPendientePagar = totalFacturasPagar - totalPagado;
        const saldoPendienteCobar = totalFacturasCobar - totalCobrado;

        return res.status(200).json({
            success: true,
            resumen: {
                facturasPorPagar: {
                    total: totalFacturasPagar,
                    pagado: totalPagado,
                    pendiente: saldoPendientePagar,
                    porcentajePagado: totalFacturasPagar > 0 ? ((totalPagado / totalFacturasPagar) * 100).toFixed(2) + "%" : "0%"
                },
                facturasPorCobrar: {
                    total: totalFacturasCobar,
                    cobrado: totalCobrado,
                    pendiente: saldoPendienteCobar,
                    porcentajeCobrado: totalFacturasCobar > 0 ? ((totalCobrado / totalFacturasCobar) * 100).toFixed(2) + "%" : "0%"
                },
                posicionFinanciera: {
                    debeRecibir: saldoPendienteCobar,
                    debePagar: saldoPendientePagar,
                    diferencia: saldoPendienteCobar - saldoPendientePagar
                }
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 2. RESUMEN POR PROVEEDOR - Facturación por proveedor
export const resumenPorProveedor = async (req, res) => {
    try {
        const facturas = await FacturaPorPagar.find()
            .populate("proveedor", "nombre");

        const resultado = facturas.reduce((acc, factura) => {
            const proveedor = acc.find(p => p._id === factura.proveedor._id);
            if (proveedor) {
                proveedor.totalFacturas += factura.monto;
                proveedor.cantidad += 1;
            } else {
                acc.push({
                    _id: factura.proveedor._id,
                    nombreProveedor: factura.proveedor.nombre,
                    totalFacturas: factura.monto,
                    cantidad: 1
                });
            }
            return acc;
        }, []);

        resultado.sort((a, b) => b.totalFacturas - a.totalFacturas);

        return res.status(200).json({
            success: true,
            cantidad: resultado.length,
            proveedores: resultado
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 3. RESUMEN POR CLIENTE - Facturación por cliente
export const resumenPorCliente = async (req, res) => {
    try {
        const facturas = await FacturaPorCobrar.find()
            .populate("cliente", "nombre");

        const resultado = facturas.reduce((acc, factura) => {
            const cliente = acc.find(c => c._id === factura.cliente._id);
            if (cliente) {
                cliente.totalFacturas += factura.monto;
                cliente.cantidad += 1;
            } else {
                acc.push({
                    _id: factura.cliente._id,
                    nombreCliente: factura.cliente.nombre,
                    totalFacturas: factura.monto,
                    cantidad: 1
                });
            }
            return acc;
        }, []);

        resultado.sort((a, b) => b.totalFacturas - a.totalFacturas);

        return res.status(200).json({
            success: true,
            cantidad: resultado.length,
            clientes: resultado
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 4. FACTURAS POR VENCER - Próximas 30 días
export const facturasPorVencer = async (req, res) => {
    try {
        const hoy = new Date();
        const proximoMes = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

        const facturasCobar = await FacturaPorCobrar.find({
            fechaVencimiento: { $gte: hoy, $lte: proximoMes }
        })
            .populate("cliente", "nombre numeroDocumento")
            .populate("creadoPor", "nombre")
            .sort({ fechaVencimiento: 1 });

        const facturasPagar = await FacturaPorPagar.find({
            fechaVencimiento: { $gte: hoy, $lte: proximoMes }
        })
            .populate("proveedor", "nombre numeroDocumento")
            .populate("creadoPor", "nombre")
            .sort({ fechaVencimiento: 1 });

        const montoTotalPorCobrar = facturasCobar.reduce((sum, f) => sum + f.monto, 0);
        const montoTotalPorPagar = facturasPagar.reduce((sum, f) => sum + f.monto, 0);

        return res.status(200).json({
            success: true,
            porCobrar: facturasCobar,
            porPagar: facturasPagar,
            totalPorCobrar: facturasCobar.length,
            totalPorPagar: facturasPagar.length,
            montoTotalPorCobrar,
            montoTotalPorPagar
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 5. FACTURAS VENCIDAS - Análisis de vencimiento (por fecha)
export const facturasVencidas = async (req, res) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Reset a medianoche para comparar solo fechas

        // Buscar facturas cuyo vencimiento pasó (fecha vencimiento < hoy)
        const facturasCobar = await FacturaPorCobrar.find({
            fechaVencimiento: { $lt: hoy },
            activo: true,  // Solo facturas activas
            estado: { $ne: "COBRADA" }  // Y que no estén completamente cobradas
        })
            .populate("cliente", "nombre numeroDocumento")
            .populate("creadoPor", "nombre")
            .sort({ fechaVencimiento: 1 });

        const facturasPagar = await FacturaPorPagar.find({
            fechaVencimiento: { $lt: hoy },
            activo: true,  // Solo facturas activas
            estado: { $ne: "PAGADA" }  // Y que no estén completamente pagadas
        })
            .populate("proveedor", "nombre numeroDocumento")
            .populate("creadoPor", "nombre")
            .sort({ fechaVencimiento: 1 });

        const montoVencidoPorCobrar = facturasCobar.reduce((sum, f) => sum + f.monto, 0);
        const montoVencidoPorPagar = facturasPagar.reduce((sum, f) => sum + f.monto, 0);

        // Calcular días promedio de vencimiento
        const diasPromedioPorCobrar = facturasCobar.length > 0
            ? Math.floor(facturasCobar.reduce((sum, f) => sum + Math.floor((hoy - new Date(f.fechaVencimiento)) / (1000 * 60 * 60 * 24)), 0) / facturasCobar.length)
            : 0;
        const diasPromedioPorPagar = facturasPagar.length > 0
            ? Math.floor(facturasPagar.reduce((sum, f) => sum + Math.floor((hoy - new Date(f.fechaVencimiento)) / (1000 * 60 * 60 * 24)), 0) / facturasPagar.length)
            : 0;

        return res.status(200).json({
            success: true,
            porCobrar: facturasCobar,
            porPagar: facturasPagar,
            totalVencidasPorCobrar: facturasCobar.length,
            totalVencidasPorPagar: facturasPagar.length,
            montoVencidoPorCobrar,
            montoVencidoPorPagar,
            diasPromedioPorCobrar,
            diasPromedioPorPagar
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 6. COBRABILIDAD - Análisis de cobro
export const cobrabilidad = async (req, res) => {
    try {
        const facturasCobar = await FacturaPorCobrar.find();
        const cobros = await CobroCliente.find();

        const totalFacturas = facturasCobar.reduce((sum, f) => sum + f.monto, 0);
        const totalCobrado = cobros.reduce((sum, c) => sum + (c.montoCobrado || 0), 0);
        const totalComisiones = cobros.reduce((sum, c) => sum + (c.comision || 0), 0);

        return res.status(200).json({
            success: true,
            analisisCobrabilidad: {
                totalFacturas: facturasCobar.length,
                montoTotalFacturas: totalFacturas,
                montoCobrado: totalCobrado,
                montoPendiente: totalFacturas - totalCobrado,
                porcentajeCobrabilidad: totalFacturas > 0 ? ((totalCobrado / totalFacturas) * 100).toFixed(2) + "%" : "0%",
                totalComisiones: totalComisiones,
                montoNetoCobrado: totalCobrado - totalComisiones,
                tasaComision: totalCobrado > 0 ? ((totalComisiones / totalCobrado) * 100).toFixed(2) + "%" : "0%"
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 7. PAGABILIDAD - Análisis de pagos
export const pagabilidad = async (req, res) => {
    try {
        const facturasPagar = await FacturaPorPagar.find();
        const pagos = await PagoProveedor.find();

        const totalFacturas = facturasPagar.reduce((sum, f) => sum + f.monto, 0);
        const totalPagado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);

        return res.status(200).json({
            success: true,
            analisisPagabilidad: {
                totalFacturas: facturasPagar.length,
                montoTotalFacturas: totalFacturas,
                montoPagado: totalPagado,
                montoPendiente: totalFacturas - totalPagado,
                porcentajePagabilidad: totalFacturas > 0 ? ((totalPagado / totalFacturas) * 100).toFixed(2) + "%" : "0%",
                cantidadPagos: pagos.length
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 8. FACTURAS POR ESTADO - Agrupadas por estado
export const facturasPorEstado = async (req, res) => {
    try {
        const porCobrar = await FacturaPorCobrar.find();
        const porPagar = await FacturaPorPagar.find();

        // Agrupar por estado
        const estadoPorCobrar = porCobrar.reduce((acc, f) => {
            const existing = acc.find(e => e.estado === f.estado);
            if (existing) {
                existing.cantidad += 1;
                existing.monto += f.monto;
            } else {
                acc.push({ estado: f.estado, cantidad: 1, monto: f.monto });
            }
            return acc;
        }, []);

        const estadoPorPagar = porPagar.reduce((acc, f) => {
            const existing = acc.find(e => e.estado === f.estado);
            if (existing) {
                existing.cantidad += 1;
                existing.monto += f.monto;
            } else {
                acc.push({ estado: f.estado, cantidad: 1, monto: f.monto });
            }
            return acc;
        }, []);

        return res.status(200).json({
            success: true,
            porCobrar: estadoPorCobrar,
            porPagar: estadoPorPagar
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 9. TOP CLIENTES DEUDORES - Clientes con más deuda
export const topClientesDeudores = async (req, res) => {
    try {
        const { limite = 10 } = req.query;
        const facturas = await FacturaPorCobrar.find()
            .populate("cliente", "nombre numeroDocumento")
            .sort({ monto: -1 })
            .limit(Number(limite));

        const resultado = facturas.reduce((acc, factura) => {
            const cliente = acc.find(c => c._id === factura.cliente._id);
            if (cliente) {
                cliente.totalDeuda += factura.monto;
                cliente.cantidadFacturas += 1;
            } else {
                acc.push({
                    _id: factura.cliente._id,
                    nombreCliente: factura.cliente.nombre,
                    totalDeuda: factura.monto,
                    cantidadFacturas: 1
                });
            }
            return acc;
        }, []);

        resultado.sort((a, b) => b.totalDeuda - a.totalDeuda);

        return res.status(200).json({
            success: true,
            cantidad: resultado.length,
            topDeudores: resultado
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 10. TOP PROVEEDORES ACREEDORES - Proveedores a los que más se debe
export const topProveedoresAcreedores = async (req, res) => {
    try {
        const { limite = 10 } = req.query;
        const facturas = await FacturaPorPagar.find()
            .populate("proveedor", "nombre numeroDocumento")
            .sort({ monto: -1 })
            .limit(Number(limite));

        const resultado = facturas.reduce((acc, factura) => {
            const proveedor = acc.find(p => p._id === factura.proveedor._id);
            if (proveedor) {
                proveedor.totalDeuda += factura.monto;
                proveedor.cantidadFacturas += 1;
            } else {
                acc.push({
                    _id: factura.proveedor._id,
                    nombreProveedor: factura.proveedor.nombre,
                    totalDeuda: factura.monto,
                    cantidadFacturas: 1
                });
            }
            return acc;
        }, []);

        resultado.sort((a, b) => b.totalDeuda - a.totalDeuda);

        return res.status(200).json({
            success: true,
            cantidad: resultado.length,
            topAcreedores: resultado
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 11. ANÁLISIS DE COMISIONES - Resumen de comisiones
export const analisisComisiones = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let filtro = { activo: true };
        if (fechaInicio || fechaFin) {
            filtro.fechaCobro = {};
            if (fechaInicio) filtro.fechaCobro.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fechaCobro.$lte = new Date(fechaFin);
        }

        const resultado = await CobroCliente.aggregate([
            { $match: filtro },
            {
                $group: {
                    _id: null,
                    totalComisiones: { $sum: "$comision" },
                    totalCobros: { $sum: "$montoCobrado" },
                    totalNeto: { $sum: "$netoCobrado" },
                    cantidadCobros: { $sum: 1 }
                }
            }
        ]);

        const datos = resultado[0] || { totalComisiones: 0, totalCobros: 0, totalNeto: 0, cantidadCobros: 0 };

        return res.status(200).json({
            success: true,
            comisiones: {
                totalComisiones: datos.totalComisiones,
                totalCobros: datos.totalCobros,
                totalNeto: datos.totalNeto,
                cantidadCobros: datos.cantidadCobros,
                comisionPromedio: datos.cantidadCobros > 0 ? (datos.totalComisiones / datos.cantidadCobros).toFixed(2) : 0,
                tasaComisionPromedio: datos.totalCobros > 0 ? ((datos.totalComisiones / datos.totalCobros) * 100).toFixed(2) + "%" : "0%"
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const exportarReporte = async (req, res) => {
    try {
        // Obtener datos generales
        const facturasPagar = await FacturaPorPagar.find();
        const facturasCobar = await FacturaPorCobrar.find();
        const pagos = await PagoProveedor.find();
        const cobros = await CobroCliente.find();

        const totalFacturasPagar = facturasPagar.reduce((sum, f) => sum + f.monto, 0);
        const totalFacturasCobar = facturasCobar.reduce((sum, f) => sum + f.monto, 0);
        const totalPagado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
        const totalCobrado = cobros.reduce((sum, c) => sum + (c.montoCobrado || 0), 0);
        const totalComisiones = cobros.reduce((sum, c) => sum + (c.comision || 0), 0);

        const porcentajePagabilidad = totalFacturasPagar > 0 ? ((totalPagado / totalFacturasPagar) * 100).toFixed(2) : 0;
        const porcentajeCobrabilidad = totalFacturasCobar > 0 ? ((totalCobrado / totalFacturasCobar) * 100).toFixed(2) : 0;

        const datos = [{
            "Concepto": "Facturas por Pagar",
            "Total": totalFacturasPagar,
            "Pagado": totalPagado,
            "Pendiente": totalFacturasPagar - totalPagado,
            "Porcentaje": porcentajePagabilidad + "%"
        }, {
            "Concepto": "Facturas por Cobrar",
            "Total": totalFacturasCobar,
            "Pagado": totalCobrado,
            "Pendiente": totalFacturasCobar - totalCobrado,
            "Porcentaje": porcentajeCobrabilidad + "%"
        }, {
            "Concepto": "Comisiones Totales",
            "Total": totalComisiones,
            "Pagado": "-",
            "Pendiente": "-",
            "Porcentaje": "-"
        }];

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Resumen General");

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `Reporte_${timestamp}.xlsx`;
        const excelDir = path.join(__dirname, "../../public/EXCEL");

        if (!fs.existsSync(excelDir)) {
            fs.mkdirSync(excelDir, { recursive: true });
        }

        const filepath = path.join(excelDir, filename);
        XLSX.writeFile(wb, filepath);

        return res.status(200).json({
            success: true,
            message: "Reporte exportado exitosamente",
            archivo: filename,
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
