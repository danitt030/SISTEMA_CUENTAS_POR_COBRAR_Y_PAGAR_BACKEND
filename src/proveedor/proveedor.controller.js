import Proveedor from "./proveedor.model.js";
import XLSX from "xlsx";
import { descargarExcel } from "../helpers/excel-generator.js";

export const crearProveedor = async (req, res) => {
    try {
        const { _id, contraseña, rol, ...resto } = req.body;
        
        const proveedor = new Proveedor({
            ...resto,
            creadoPor: req.usuario._id
        });

        await proveedor.save();

        return res.status(201).json({
            success: true,
            message: "Proveedor creado correctamente",
            proveedor: proveedor.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al crear proveedor",
            error: err.message
        });
    }
};

export const obtenerProveedores = async (req, res) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        let query = {};

        // Filtro por rol
        if (req.usuario.rol === "VENDEDOR_ROLE") {
            query.vendedorAsignado = req.usuario._id;
        } else if (req.usuario.rol === "GERENTE_ROLE") {
            query.gerenteAsignado = req.usuario._id;
        }

        const [total, proveedores] = await Promise.all([
            Proveedor.countDocuments(query),
            Proveedor.find(query)
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
            proveedores: proveedores.map(p => p.toJSON())
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener proveedores",
            error: err.message
        });
    }
};

export const obtenerProveedorPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedor.findById(id)
            .populate("creadoPor", "nombre apellido usuario")
            .populate("gerenteAsignado", "nombre usuario")
            .populate("vendedorAsignado", "nombre usuario");

        if (!proveedor) {
            return res.status(404).json({
                success: false,
                message: "Proveedor no encontrado"
            });
        }

        // Validar acceso por rol
        if (req.usuario.rol === "VENDEDOR_ROLE" && proveedor.vendedorAsignado?._id.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver este proveedor"
            });
        } else if (req.usuario.rol === "GERENTE_ROLE" && proveedor.gerenteAsignado?._id.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para ver este proveedor"
            });
        }

        return res.status(200).json({
            success: true,
            proveedor: proveedor.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al obtener proveedor",
            error: err.message
        });
    }
};

export const actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { _id, creadoPor, creadoEn, ...resto } = req.body;

        // Limpiar valores vacíos en campos opcionales
        if (resto.gerenteAsignado === "" || resto.gerenteAsignado === null) {
            resto.gerenteAsignado = null;
        }

        const proveedor = await Proveedor.findByIdAndUpdate(
            id,
            resto,
            { new: true }
        )
        .populate("creadoPor", "nombre apellido usuario")
        .populate("gerenteAsignado", "nombre usuario");

        if (!proveedor) {
            return res.status(404).json({
                success: false,
                message: "Proveedor no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Proveedor actualizado correctamente",
            proveedor: proveedor.toJSON()
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al actualizar proveedor",
            error: err.message
        });
    }
};

export const desactivarProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const proveedor = await Proveedor.findByIdAndUpdate(
            id,
            { estado: false },
            { new: true }
        );

        if (!proveedor) {
            return res.status(404).json({
                success: false,
                message: "Proveedor no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Proveedor desactivado correctamente"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al desactivar proveedor",
            error: err.message
        });
    }
};

export const eliminarProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const proveedor = await Proveedor.findByIdAndDelete(id);

        if (!proveedor) {
            return res.status(404).json({
                success: false,
                message: "Proveedor no encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Proveedor eliminado correctamente"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al eliminar proveedor",
            error: err.message
        });
    }
};

export const buscarProveedoresActivos = async (req, res) => {
    try {
        const { busqueda, limite = 10, desde = 0 } = req.query;
        const query = {};

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

        const [total, proveedores] = await Promise.all([
            Proveedor.countDocuments(query),
            Proveedor.find(query)
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
            proveedores: proveedores.map(p => p.toJSON())
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al buscar proveedores",
            error: err.message
        });
    }
};

export const obtenerSaldoProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedor.findById(id);

        if (!proveedor) {
            return res.status(404).json({
                success: false,
                message: "Proveedor no encontrado"
            });
        }

        // Aquí se puede implementar lógica para traer cuentas por pagar
        // y calcular el saldo pendiente basado en documentos relacionados
        const saldo = {
            proveedor: proveedor.toJSON(),
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
            message: "Error al obtener saldo del proveedor",
            error: err.message
        });
    }
};

export const exportarProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.find({ estado: true })
            .select("nombre tipoDocumento numeroDocumento nit correo telefono ciudad departamento condicionPago diasCredito limiteCreditoMes")
            .sort({ nombre: 1 });

        if (proveedores.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No hay proveedores para exportar"
            });
        }

        const datos = proveedores.map(p => ({
            "Nombre": p.nombre,
            "Tipo Documento": p.tipoDocumento,
            "Número Documento": p.numeroDocumento,
            "NIT": p.nit || "N/A",
            "Correo": p.correo,
            "Teléfono": p.telefono,
            "Ciudad": p.ciudad,
            "Departamento": p.departamento,
            "Condición Pago": p.condicionPago,
            "Días Crédito": p.diasCredito,
            "Límite Crédito": p.limiteCreditoMes
        }));

        // NUEVO: Descargar directamente sin guardar
        descargarExcel(datos, "Proveedores", "Proveedores", res);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al exportar proveedores",
            error: err.message
        });
    }
};
