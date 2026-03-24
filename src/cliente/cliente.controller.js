import Cliente from "./cliente.model.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const query = { estado: true };

        const [total, clientes] = await Promise.all([
            Cliente.countDocuments(query),
            Cliente.find(query)
                .skip(Number(desde))
                .limit(Number(limite))
                .sort({ creadoEn: -1 })
                .populate("creadoPor", "nombre apellido usuario")
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
        const cliente = await Cliente.findById(id).populate("creadoPor", "nombre apellido usuario");

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: "Cliente no encontrado"
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

        const [total, clientes] = await Promise.all([
            Cliente.countDocuments({ creadoPor: id, estado: true }),
            Cliente.find({ creadoPor: id, estado: true })
                .skip(Number(desde))
                .limit(Number(limite))
                .sort({ nombre: 1 })
                .populate("creadoPor", "nombre apellido usuario")
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

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");

        ws["!cols"] = [
            { wch: 25 },
            { wch: 15 },
            { wch: 18 },
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 }
        ];

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `Clientes_${timestamp}.xlsx`;
        const excelDir = path.join(__dirname, "../../public/EXCEL");

        if (!fs.existsSync(excelDir)) {
            fs.mkdirSync(excelDir, { recursive: true });
        }

        const filepath = path.join(excelDir, filename);
        XLSX.writeFile(wb, filepath);

        return res.status(200).json({
            success: true,
            message: "Archivo Excel generado correctamente",
            total: clientes.length,
            archivo: filename,
            ruta: `public/EXCEL/${filename}`,
            rutaCompleta: filepath
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error al exportar clientes",
            error: err.message
        });
    }
};
