import Auditoria from "./auditoria.model.js";
import Usuario from "../user/user.model.js";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. REGISTRAR EVENTO DE AUDITORIA
export const registrarEvento = async (req, res) => {
    try {
        const { accion, modulo, descripcion, objetoAfectado, detallesAntes, detallesDespues } = req.body;
        const usuarioId = req.usuario._id;

        const evento = await Auditoria.create({
            usuario: usuarioId,
            accion,
            modulo,
            descripcion,
            objetoAfectado: objetoAfectado || null,
            detallesAntes: detallesAntes || {},
            detallesDespues: detallesDespues || {},
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            estado: "EXITOSO"
        });

        return res.status(201).json({
            success: true,
            message: "Evento registrado exitosamente",
            evento
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 2. OBTENER TODOS LOS LOGS DE AUDITORIA
export const obtenerLogs = async (req, res) => {
    try {
        const { limite = 50, pagina = 1 } = req.query;
        const skip = (pagina - 1) * limite;

        const logs = await Auditoria.find()
            .populate("usuario", "usuario correo nombre apellido rol")
            .sort({ timestamp: -1 })
            .limit(parseInt(limite))
            .skip(skip)
            .exec();

        const total = await Auditoria.countDocuments();
        const totalPaginas = Math.ceil(total / limite);

        return res.status(200).json({
            success: true,
            logs,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            total,
            totalPaginas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 3. FILTRAR LOGS POR USUARIO
export const filtrarPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { limite = 50, pagina = 1 } = req.query;
        const skip = (pagina - 1) * limite;

        // Validar que el usuario existe
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const logs = await Auditoria.find({ usuario: usuarioId })
            .populate("usuario", "usuario correo nombre apellido rol")
            .sort({ timestamp: -1 })
            .limit(parseInt(limite))
            .skip(skip)
            .exec();

        const total = await Auditoria.countDocuments({ usuario: usuarioId });
        const totalPaginas = Math.ceil(total / limite);

        return res.status(200).json({
            success: true,
            usuario: {
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo
            },
            logs,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            total,
            totalPaginas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 4. FILTRAR LOGS POR RANGO DE FECHA Y ACCION
export const filtrarPorFechaYAccion = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, accion, limite = 50, pagina = 1 } = req.query;
        const skip = (pagina - 1) * limite;

        let filtro = {};

        if (fechaInicio && String(fechaInicio).trim() !== "") {
            const fechaInicioParsed = new Date(String(fechaInicio).trim());
            if (!isNaN(fechaInicioParsed.getTime())) {
                filtro.timestamp = filtro.timestamp || {};
                filtro.timestamp.$gte = fechaInicioParsed;
            }
        }

        if (fechaFin && String(fechaFin).trim() !== "") {
            const fechaFinParsed = new Date(String(fechaFin).trim());
            fechaFinParsed.setHours(23, 59, 59, 999);
            if (!isNaN(fechaFinParsed.getTime())) {
                filtro.timestamp = filtro.timestamp || {};
                filtro.timestamp.$lte = fechaFinParsed;
            }
        }

        if (accion && String(accion).trim() !== "") {
            filtro.accion = String(accion).trim();
        }

        const logs = await Auditoria.find(filtro)
            .populate("usuario", "usuario correo nombre apellido rol")
            .sort({ timestamp: -1 })
            .limit(parseInt(limite))
            .skip(skip)
            .exec();

        const total = await Auditoria.countDocuments(filtro);
        const totalPaginas = Math.ceil(total / parseInt(limite));

        return res.status(200).json({
            success: true,
            filtros: {
                fechaInicio: (fechaInicio && String(fechaInicio).trim() !== "") ? fechaInicio : null,
                fechaFin: (fechaFin && String(fechaFin).trim() !== "") ? fechaFin : null,
                accion: (accion && String(accion).trim() !== "") ? accion : null
            },
            logs,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            total,
            totalPaginas
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// 5. EXPORTAR LOGS A EXCEL
export const exportarLogs = async (req, res) => {
    try {
        let { fechaInicio, fechaFin, accion } = req.query;

        let filtro = {};

        if (fechaInicio && fechaInicio.trim()) {
            const fechaInicioParsed = new Date(fechaInicio);
            if (!isNaN(fechaInicioParsed.getTime())) {
                filtro.timestamp = filtro.timestamp || {};
                filtro.timestamp.$gte = fechaInicioParsed;
            }
        }

        if (fechaFin && fechaFin.trim()) {
            const fechaFinParsed = new Date(fechaFin);
            // Establecer a fin de día
            fechaFinParsed.setHours(23, 59, 59, 999);
            if (!isNaN(fechaFinParsed.getTime())) {
                filtro.timestamp = filtro.timestamp || {};
                filtro.timestamp.$lte = fechaFinParsed;
            }
        }

        if (accion && accion.trim()) {
            filtro.accion = accion.trim();
        }

        const logs = await Auditoria.find(filtro)
            .populate("usuario", "usuario correo nombre apellido rol")
            .sort({ timestamp: -1 })
            .exec();

        if (logs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No hay logs para exportar"
            });
        }

        const datos = logs.map(log => ({
            "Usuario": log.usuario?.usuario || "N/A",
            "Correo": log.usuario?.correo || "N/A",
            "Acción": log.accion,
            "Módulo": log.modulo,
            "Descripción": log.descripcion,
            "Estado": log.estado,
            "IP Address": log.ipAddress || "N/A",
            "Fecha": new Date(log.timestamp).toLocaleString("es-MX"),
            "Timestamp": log.timestamp
        }));

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Auditoría");

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `Auditoria_${timestamp}.xlsx`;
        const excelDir = path.join(__dirname, "../../public/EXCEL");

        if (!fs.existsSync(excelDir)) {
            fs.mkdirSync(excelDir, { recursive: true });
        }

        const filepath = path.join(excelDir, filename);
        XLSX.writeFile(wb, filepath);

        return res.status(200).json({
            success: true,
            message: "Logs exportados exitosamente",
            archivo: filename,
            ruta: `public/EXCEL/${filename}`,
            rutaCompleta: filepath,
            totalRegistros: logs.length
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
