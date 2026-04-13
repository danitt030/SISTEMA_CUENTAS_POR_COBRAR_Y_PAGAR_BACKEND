import Cliente from "./cliente.model.js";
import FacturaPorCobrar from "../facturaPorCobrar/facturaPorCobrar.model.js";
import CobroCliente from "../cobroCliente/cobroCliente.model.js";
import XLSX from "xlsx";
import { descargarExcel } from "../helpers/excel-generator.js";

// Función auxiliar para auto-crear Cliente cuando se registra un Usuario CLIENTE_ROLE
export const crearClienteAutomatico = async (usuarioId, nombreUsuario, correoUsuario, telefonoUsuario, tipoDocumento, numeroDocumento) => {
    try {
        const clienteExistente = await Cliente.findOne({ usuarioAsociado: usuarioId });
        
        if (clienteExistente) {
            return clienteExistente;
        }
        
        const nuevoCliente = new Cliente({
            nombre: nombreUsuario,
            correo: correoUsuario,
            telefono: telefonoUsuario,
            tipoDocumento: tipoDocumento,
            numeroDocumento: numeroDocumento,
            direccion: "Por especificar",
            ciudad: "Guatemala",
            departamento: "Guatemala",
            condicionPago: "CONTADO",
            usuarioAsociado: usuarioId,
            creadoPor: usuarioId,
            estado: true
        });
        
        const clienteCreado = await nuevoCliente.save();
        console.log("✅ Cliente automático creado:", clienteCreado._id);
        return clienteCreado;
    } catch (err) {
        console.error("❌ Error al crear Cliente automático:", err.message);
        throw err;
    }
};

export const crearCliente = async (req, res) => {
    try {
        const { _id, contraseña, rol, ...resto } = req.body;
        
        const cliente = new Cliente({
            ...resto,
            creadoPor: req.usuario._id
        });

        await cliente.save();

        return res.status(201).json({
            success: true,
            message: "Cliente creado correctamente",
            cliente: cliente.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al crear cliente",
            error: err.message
        });
    }
};

export const obtenerTodosClientes = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        let query = { estado: true };

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            query.vendedorAsignado = req.usuario._id;
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            query.gerenteAsignado = req.usuario._id;
        }

        const [total, clientes] = await Promise.all([
            Cliente.countDocuments(query),
            Cliente.find(query)
                .skip(Number(desde))
                .limit(Number(limite))
                .sort({ creadoEn: -1 })
                .populate("creadoPor", "nombre apellido usuario")
                .populate("gerenteAsignado", "nombre usuario")
                .populate("vendedorAsignado", "nombre usuario")
        ]);

        return res.status(200).json({
            success: true,
            total,
            clientes: clientes.map(c => c.toJSON())
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener clientes",
            error: err.message
        });
    }
};

export const obtenerClientePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Cliente.findById(id)
            .populate("creadoPor", "nombre apellido usuario")
            .populate("gerenteAsignado", "nombre usuario")
            .populate("vendedorAsignado", "nombre usuario");

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        // Validar acceso por rol
        if (req.usuario.rol === "VENDEDOR_ROLE" && cliente.vendedorAsignado?._id.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver este cliente"
            });
        } else if (req.usuario.rol === "GERENTE_ROLE" && cliente.gerenteAsignado?._id.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver este cliente"
            });
        }

        return res.status(200).json({
            success: true,
            cliente: cliente.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener cliente",
            error: err.message
        });
    }
};

export const actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { _id, creadoPor, creadoEn, ...resto } = req.body;

        const cliente = await Cliente.findByIdAndUpdate(
            id,
            resto,
            { new: true }
        ).populate("creadoPor", "nombre apellido usuario");

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cliente actualizado correctamente",
            cliente: cliente.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al actualizar cliente",
            error: err.message
        });
    }
};

export const buscarClientesActivos = async (req, res) => {
    try {
        const { busqueda, limite = 10, desde = 0 } = req.query;
        const query = { estado: true };

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            query.vendedorAsignado = req.usuario._id;
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            query.gerenteAsignado = req.usuario._id;
        }

        if (busqueda) {
            query.$or = [
                { nombre: { $regex: busqueda, $options: "i" } },
                { numeroDocumento: { $regex: busqueda, $options: "i" } },
                { nit: { $regex: busqueda, $options: "i" } },
                { correo: { $regex: busqueda, $options: "i" } },
                { ciudad: { $regex: busqueda, $options: "i" } }
            ];
        }

        const [total, clientes] = await Promise.all([
            Cliente.countDocuments(query),
            Cliente.find(query)
                .skip(Number(desde))
                .limit(Number(limite))
                .sort({ nombre: 1 })
                .populate("creadoPor", "nombre apellido usuario")
                .populate("gerenteAsignado", "nombre usuario")
                .populate("vendedorAsignado", "nombre usuario")
        ]);

        return res.status(200).json({
            success: true,
            total,
            clientes: clientes.map(c => c.toJSON())
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al buscar clientes",
            error: err.message
        });
    }
};

export const desactivarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = await Cliente.findByIdAndUpdate(
            id,
            { estado: false },
            { new: true }
        );

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cliente desactivado correctamente"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al desactivar cliente",
            error: err.message
        });
    }
};

export const eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = await Cliente.findByIdAndDelete(id);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cliente eliminado correctamente"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al eliminar cliente",
            error: err.message
        });
    }
};

export const obtenerSaldoCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Cliente.findById(id);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        const saldo = {
            cliente: cliente.toJSON(),
            saldoPendiente: 0,
            totalFacturas: 0,
            totalPagado: 0,
            detalles: []
        };

        return res.status(200).json({
            success: true,
            saldo: saldo
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener saldo del cliente",
            error: err.message
        });
    }
};

export const obtenerClientesPorGerente = async (req, res) => {
    try {
        const { id } = req.params;
        const { limite = 10, desde = 0 } = req.query;

        // Validar que el GERENTE ve solo sus clientes o que el CONTADOR/ADMIN ve los de cualquiera
        if (req.usuario.rol === "GERENTE_ROLE" && id !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver los clientes de otro gerente"
            });
        }

        const [total, clientes] = await Promise.all([
            Cliente.countDocuments({ gerenteAsignado: id, estado: true }),
            Cliente.find({ gerenteAsignado: id, estado: true })
                .skip(Number(desde))
                .limit(Number(limite))
                .sort({ nombre: 1 })
                .populate("creadoPor", "nombre apellido usuario")
                .populate("gerenteAsignado", "nombre usuario")
                .populate("vendedorAsignado", "nombre usuario")
        ]);

        return res.status(200).json({
            success: true,
            total,
            gerente: id,
            clientes: clientes.map(c => c.toJSON())
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener clientes del gerente",
            error: err.message
        });
    }
};

export const verificarLimiteCredito = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Cliente.findById(id);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
            });
        }

        const verificacion = {
            cliente: cliente.toJSON(),
            limiteCreditoMes: cliente.limiteCreditoMes,
            creditoDisponible: cliente.limiteCreditoMes,
            creditoUtilizado: 0,
            puedeCreditoAdicional: cliente.limiteCreditoMes > 0,
            condicionPago: cliente.condicionPago
        };

        return res.status(200).json({
            success: true,
            verificacion: verificacion
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al verificar límite de crédito",
            error: err.message
        });
    }
};

export const exportarClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find({ estado: true })
            .select("nombre tipoDocumento numeroDocumento nit correo telefono ciudad departamento condicionPago diasCredito limiteCreditoMes")
            .sort({ nombre: 1 });

        if (clientes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No hay clientes para exportar"
            });
        }

        const datos = clientes.map(c => ({
            "Nombre": c.nombre,
            "Tipo Documento": c.tipoDocumento,
            "Número Documento": c.numeroDocumento,
            "NIT": c.nit || "N/A",
            "Correo": c.correo,
            "Teléfono": c.telefono,
            "Ciudad": c.ciudad,
            "Departamento": c.departamento,
            "Condición Pago": c.condicionPago,
            "Días Crédito": c.diasCredito,
            "Límite Crédito": c.limiteCreditoMes
        }));

        // ✅ NUEVO: Descargar directamente sin guardar
        descargarExcel(datos, "Clientes", "Clientes", res);
    } catch (err) {
        console.error("❌ Error en exportarClientes:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error al exportar clientes",
            error: err.message
        });
    }
};

// ============================================
// PORTAL CLIENTE - Funciones para CLIENTE_ROLE
// ============================================

/**
 * Obtener mi perfil (Portal Cliente)
 */
export const obtenerMiPerfil = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;

        const cliente = await Cliente.findOne({ usuarioAsociado: usuarioId })
            .select("nombre nombreContacto telefonoContacto correoContacto tipoDocumento numeroDocumento nit direccion ciudad departamento correo telefono telefonoSecundario condicionPago diasCredito limiteCreditoMes banco numeroCuenta creadoEn")
            .populate("creadoPor", "nombre usuario");

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Perfil de cliente no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            cliente: cliente.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Obtener mis facturas (Portal Cliente)
 */
export const obtenerMisFacturas = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        const usuarioId = req.usuario._id;

        const cliente = await Cliente.findOne({ usuarioAsociado: usuarioId });
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Perfil de cliente no encontrado"
            });
        }

        const [total, facturas] = await Promise.all([
            FacturaPorCobrar.countDocuments({ cliente: cliente._id, activo: true }),
            FacturaPorCobrar.find({ cliente: cliente._id, activo: true })
                .select("numeroFactura monto moneda estado fechaEmision fechaVencimiento descripcion")
                .limit(Number(limite))
                .skip(Number(desde))
                .sort({ fechaEmision: -1 })
        ]);

        return res.status(200).json({
            success: true,
            total,
            listaObtenida: facturas.length,
            cliente: cliente.nombre,
            facturas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Obtener detalle de una factura (Portal Cliente)
 */
export const obtenerDetalleFactura = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario._id;

        const factura = await FacturaPorCobrar.findById(id)
            .select("numeroFactura monto moneda estado fechaEmision fechaVencimiento descripcion cliente");

        if (!factura) {
            return res.status(404).json({
                success: false,
                message: "Factura no encontrada"
            });
        }

        if (factura.cliente.toString() !== clienteId.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permiso para ver esta factura"
            });
        }

        const cobros = await CobroCliente.find({ facturaPorCobrar: id, activo: true })
            .select("numeroComprobante montoCobrado fechaCobro metodoPago comision");

        const totalCobrado = cobros.reduce((sum, cobro) => sum + cobro.montoCobrado, 0);
        const saldoPendiente = factura.monto - totalCobrado;

        return res.status(200).json({
            success: true,
            factura: {
                ...factura.toObject(),
                totalCobrado,
                saldoPendiente,
                porcentajePagado: ((totalCobrado / factura.monto) * 100).toFixed(2)
            },
            cobros
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Obtener mis cobros (Portal Cliente)
 */
export const obtenerMisCobros = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        const usuarioId = req.usuario._id;

        const cliente = await Cliente.findOne({ usuarioAsociado: usuarioId });
        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Perfil de cliente no encontrado"
            });
        }

        const cobros = await CobroCliente.find({ cliente: cliente._id, activo: true })
            .populate({
                path: "facturaPorCobrar",
                select: "numeroFactura monto"
            })
            .select("numeroComprobante montoCobrado fechaCobro metodoPago referencia comision netoCobrado")
            .limit(Number(limite))
            .skip(Number(desde))
            .sort({ fechaCobro: -1 });

        const total = await CobroCliente.countDocuments({ cliente: cliente._id, activo: true });

        const totalCobrado = cobros.reduce((sum, cobro) => sum + cobro.montoCobrado, 0);
        const totalComisiones = cobros.reduce((sum, cobro) => sum + (cobro.comision || 0), 0);

        return res.status(200).json({
            success: true,
            total,
            listaObtenida: cobros.length,
            resumen: {
                totalCobrado,
                totalComisiones,
                neto: totalCobrado - totalComisiones
            },
            cobros
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Obtener mi saldo (Portal Cliente)
 */
export const obtenerMiSaldo = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;

        const cliente = await Cliente.findOne({ usuarioAsociado: usuarioId })
            .select("nombre numeroDocumento correo telefono condicionPago limiteCreditoMes");

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Perfil de cliente no encontrado"
            });
        }

        const facturas = await FacturaPorCobrar.find({ cliente: cliente._id, activo: true })
            .select("monto estado fechaVencimiento");

        const cobros = await CobroCliente.find({ cliente: cliente._id, activo: true })
            .select("montoCobrado");

        const montoTotalFacturas = facturas.reduce((sum, f) => sum + f.monto, 0);
        const montoTotalCobrado = cobros.reduce((sum, c) => sum + c.montoCobrado, 0);
        const saldoPendiente = montoTotalFacturas - montoTotalCobrado;

        const hoy = new Date();
        const facturasVencidas = facturas.filter(f => {
            return (f.estado === "VENCIDA" || 
                   (f.estado === "PENDIENTE" && f.fechaVencimiento < hoy));
        }).length;

        return res.status(200).json({
            success: true,
            cliente: {
                nombre: cliente.nombre,
                documento: cliente.numeroDocumento,
                correo: cliente.correo,
                telefono: cliente.telefono,
                condicionPago: cliente.condicionPago
            },
            saldo: {
                totalFacturas: montoTotalFacturas,
                totalCobrado: montoTotalCobrado,
                saldoPendiente,
                porcentajePagado: montoTotalFacturas > 0 ? ((montoTotalCobrado / montoTotalFacturas) * 100).toFixed(2) : 0,
                facturasVencidas
            },
            creditoDisponible: {
                limite: cliente.limiteCreditoMes,
                utilizado: saldoPendiente,
                disponible: cliente.limiteCreditoMes - saldoPendiente
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Obtener facturas vencidas (Portal Cliente)
 */
export const obtenerMisFacturasVencidas = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        const clienteId = req.usuario._id;
        const hoy = new Date();

        const facturas = await FacturaPorCobrar.find({
            cliente: clienteId,
            $or: [
                { estado: "VENCIDA" },
                {
                    fechaVencimiento: { $lt: hoy },
                    estado: { $in: ["PENDIENTE", "PARCIAL"] }
                }
            ],
            activo: true
        })
            .select("numeroFactura monto moneda estado fechaEmision fechaVencimiento")
            .limit(Number(limite))
            .skip(Number(desde))
            .sort({ fechaVencimiento: 1 });

        const total = await FacturaPorCobrar.countDocuments({
            cliente: clienteId,
            $or: [
                { estado: "VENCIDA" },
                {
                    fechaVencimiento: { $lt: hoy },
                    estado: { $in: ["PENDIENTE", "PARCIAL"] }
                }
            ],
            activo: true
        });

        return res.status(200).json({
            success: true,
            total,
            listaObtenida: facturas.length,
            facturas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
