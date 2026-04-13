import Auditoria from "./auditoria.model.js";
import Usuario from "../user/user.model.js";
import XLSX from "xlsx";
import { descargarExcel } from "../helpers/excel-generator.js";

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
        const skip = (pagina - 1) * parseInt(limite);

        let filtro = {};
        
        console.log("📋 Query params recibidos:", { fechaInicio, fechaFin, accion, limite, pagina });

        // Procesar fechas con mejor validación
        if (fechaInicio && String(fechaInicio).trim() !== "") {
            try {
                const fechaInicioParsed = new Date(String(fechaInicio).trim());
                if (!isNaN(fechaInicioParsed.getTime())) {
                    filtro.timestamp = filtro.timestamp || {};
                    filtro.timestamp.$gte = fechaInicioParsed;
                    console.log(`✅ Filtro fechaInicio: ${fechaInicioParsed}`);
                }
            } catch (e) {
                console.warn(`⚠️ Error parseando fechaInicio: ${fechaInicio}`);
            }
        }

        if (fechaFin && String(fechaFin).trim() !== "") {
            try {
                const fechaFinParsed = new Date(String(fechaFin).trim());
                if (!isNaN(fechaFinParsed.getTime())) {
                    // Asegurar que llegue hasta el final del día
                    fechaFinParsed.setHours(23, 59, 59, 999);
                    filtro.timestamp = filtro.timestamp || {};
                    filtro.timestamp.$lte = fechaFinParsed;
                    console.log(`✅ Filtro fechaFin: ${fechaFinParsed}`);
                }
            } catch (e) {
                console.warn(`⚠️ Error parseando fechaFin: ${fechaFin}`);
            }
        }

        // ⭐ FILTRO DE ACCIÓN - MÁS ROBUSTO
        if (accion && String(accion).trim() !== "") {
            const accionTrimmed = String(accion).trim().toUpperCase();
            
            // Validar que sea una acción válida
            const accionesValidas = ["CREAR", "ACTUALIZAR", "ELIMINAR", "LEER", "EXPORTAR", "DESCARGAR", "LOGIN", "LOGOUT"];
            
            if (accionesValidas.includes(accionTrimmed)) {
                filtro.accion = accionTrimmed;
                console.log(`✅ Filtro acción (VÁLIDA): ${accionTrimmed}`);
            } else {
                console.warn(`⚠️ Acción NO válida: ${accionTrimmed}`);
            }
        }

        console.log(`🔍 Filtro FINAL aplicado:`, JSON.stringify(filtro, null, 2));

        const logs = await Auditoria.find(filtro)
            .populate("usuario", "usuario correo nombre apellido rol")
            .sort({ timestamp: -1 })
            .limit(parseInt(limite))
            .skip(skip)
            .exec();

        const total = await Auditoria.countDocuments(filtro);
        const totalPaginas = Math.ceil(total / parseInt(limite));

        console.log(`📊 Resultados: ${logs.length} de ${total} registros`);

        return res.status(200).json({
            success: true,
            filtros: {
                fechaInicio: (fechaInicio && String(fechaInicio).trim() !== "") ? fechaInicio : null,
                fechaFin: (fechaFin && String(fechaFin).trim() !== "") ? fechaFin : null,
                accion: (accion && String(accion).trim() !== "") ? accion.toUpperCase() : null
            },
            logs,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            total,
            totalPaginas
        });
    } catch (err) {
        console.error("❌ Error en filtrarPorFechaYAccion:", err.message);
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
        
        console.log("📋 Exportar - Query params recibidos:", { fechaInicio, fechaFin, accion });

        // Procesar fechas con mejor validación
        if (fechaInicio && fechaInicio.trim()) {
            try {
                const fechaInicioParsed = new Date(fechaInicio);
                if (!isNaN(fechaInicioParsed.getTime())) {
                    filtro.timestamp = filtro.timestamp || {};
                    filtro.timestamp.$gte = fechaInicioParsed;
                    console.log(`✅ Exportar - Filtro fechaInicio: ${fechaInicioParsed}`);
                }
            } catch (e) {
                console.warn(`⚠️ Error parseando fechaInicio en export: ${fechaInicio}`);
            }
        }

        if (fechaFin && fechaFin.trim()) {
            try {
                const fechaFinParsed = new Date(fechaFin);
                // Asegurar que llegue hasta el final del día
                fechaFinParsed.setHours(23, 59, 59, 999);
                if (!isNaN(fechaFinParsed.getTime())) {
                    filtro.timestamp = filtro.timestamp || {};
                    filtro.timestamp.$lte = fechaFinParsed;
                    console.log(`✅ Exportar - Filtro fechaFin: ${fechaFinParsed}`);
                }
            } catch (e) {
                console.warn(`⚠️ Error parseando fechaFin en export: ${fechaFin}`);
            }
        }

        // ⭐ FILTRO DE ACCIÓN - MÁS ROBUSTO
        if (accion && accion.trim()) {
            const accionTrimmed = String(accion).trim().toUpperCase();
            
            // Validar que sea una acción válida
            const accionesValidas = ["CREAR", "ACTUALIZAR", "ELIMINAR", "LEER", "EXPORTAR", "DESCARGAR", "LOGIN", "LOGOUT"];
            
            if (accionesValidas.includes(accionTrimmed)) {
                filtro.accion = accionTrimmed;
                console.log(`✅ Exportar - Filtro acción (VÁLIDA): ${accionTrimmed}`);
            } else {
                console.warn(`⚠️ Exportar - Acción NO válida: ${accionTrimmed}`);
            }
        }

        console.log(`📥 Filtro FINAL para exportar:`, JSON.stringify(filtro, null, 2));

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

        // ✅ NUEVO: Descargar directamente sin guardar
        descargarExcel(datos, "Auditoría", "Auditoria", res);
    } catch (err) {
        console.error("❌ Error en exportarLogs:", err.message);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
