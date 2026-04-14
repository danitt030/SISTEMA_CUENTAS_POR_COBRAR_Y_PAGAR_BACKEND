import Anthropic from "@anthropic-ai/sdk";
import Cliente from "../cliente/cliente.model.js";
import FacturaPorCobrar from "../facturaPorCobrar/facturaPorCobrar.model.js";
import CobroCliente from "../cobroCliente/cobroCliente.model.js";
import HistorialIA from "./historialIA.model.js";
import ConversacionIA from "./conversacionIA.model.js";
import { esPreguntaSobrePermisos, obtenerPermisosDeRol, generarResumenPermisos } from "../helpers/ia-helpers.js";

/**
 * Función para obtener métricas del cliente
 */
const obtenerMetricasCliente = async (clienteId) => {
    try {
        const cliente = await Cliente.findById(clienteId).select("nombre nit limiteCreditoMes condicionPago diasCredito estado");
        
        if (!cliente) {
            return null;
        }

        // Obtener facturas por cobrar
        const facturas = await FacturaPorCobrar.find({ cliente: clienteId, activo: true }).select("monto estado fechaVencimiento fechaEmision");
        
        // Obtener cobros
        const cobros = await CobroCliente.find({ cliente: clienteId, activo: true }).select("montoCobrado fechaCobro comision");

        // Calcular métricas
        const hoy = new Date();
        const montoTotal = facturas.reduce((sum, f) => sum + (f.monto || 0), 0);
        const montoCobrado = cobros.reduce((sum, c) => sum + (c.montoCobrado || 0), 0);
        const saldoPendiente = montoTotal - montoCobrado;

        const facturasVencidas = facturas.filter(f => f.fechaVencimiento < hoy && f.estado !== "COBRADA");
        const diasAtrasoPromedio = facturasVencidas.length > 0 
            ? Math.round(facturasVencidas.reduce((sum, f) => {
                const dias = Math.floor((hoy - f.fechaVencimiento) / (1000 * 60 * 60 * 24));
                return sum + dias;
            }, 0) / facturasVencidas.length)
            : 0;

        // Calcular riesgo crediticio (0-100)
        let riesgoScore = 0;
        if (facturasVencidas.length > 0) riesgoScore += Math.min(30, facturasVencidas.length * 10);
        if (diasAtrasoPromedio > 30) riesgoScore += 30;
        if (diasAtrasoPromedio > 60) riesgoScore += 20;
        const tasaPago = montoTotal > 0 ? (montoCobrado / montoTotal) * 100 : 0;
        if (tasaPago < 50) riesgoScore += 20;
        riesgoScore = Math.min(100, riesgoScore);

        const riesgoNivel = riesgoScore < 33 ? "BAJO" : riesgoScore < 67 ? "MEDIO" : "ALTO";

        return {
            cliente: {
                nombre: cliente.nombre,
                nit: cliente.nit,
                limiteCrédito: cliente.limiteCreditoMes,
                estado: cliente.estado ? "Activo" : "Inactivo"
            },
            metricas: {
                riesgoScore,
                riesgoNivel,
                montoTotal,
                montoCobrado,
                saldoPendiente,
                porcentajePagado: tasaPago.toFixed(2),
                facturasVencidas: facturasVencidas.length,
                diasAtrasoPromedio,
                totalFacturas: facturas.length,
                totalCobros: cobros.length
            },
            detalles: {
                facturas: facturas.map(f => ({
                    monto: f.monto,
                    estado: f.estado,
                    fechaVencimiento: f.fechaVencimiento,
                    diasAtraso: f.fechaVencimiento < hoy ? Math.floor((hoy - f.fechaVencimiento) / (1000 * 60 * 60 * 24)) : 0
                })),
                ultimosCobros: cobros.slice(-5).map(c => ({
                    monto: c.montoCobrado,
                    fecha: c.fechaCobro
                }))
            }
        };
    } catch (err) {
        console.error("Error obtener métricas cliente:", err.message);
        return null;
    }
};

/**
 * Función principal: Preguntar al asistente de IA
 */
export const preguntarAsistenteIA = async (req, res) => {
    try {
        // Inicializar cliente de Anthropic aquí para garantizar que la API key está cargada
        const client = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY
        });

        const { pregunta, modulo, documentoId, conversacionId } = req.body;
        const usuarioId = req.usuario._id;
        const usuarioRol = req.usuario.rol;
        const usuarioNombre = req.usuario.nombre;

        // Normalizamos documentoId (si es una string vacía, convertir a null)
        const documentoIdValido = documentoId && documentoId.trim() ? documentoId : null;

        // VALIDACIÓN: Si hay documentoId, verificar permisos
        if (documentoIdValido && (modulo === "cliente" || modulo === "facturaPorCobrar" || modulo === "cobroCliente")) {
            const cliente = await Cliente.findById(documentoIdValido);
            
            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: "Cliente no encontrado"
                });
            }

            // Validar acceso por rol
            if (usuarioRol === "GERENTE_ROLE") {
                if (cliente.gerenteAsignado?.toString() !== usuarioId.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: "No tienes permisos para analizar este cliente"
                    });
                }
            } else if (usuarioRol === "VENDEDOR_ROLE") {
                if (cliente.vendedorAsignado?.toString() !== usuarioId.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: "No tienes permisos para analizar este cliente"
                    });
                }
            }
            // ADMINISTRADOR, CONTADOR, GERENTE_GENERAL: Acceso total
        }

        // OBTENER DATOS SEGÚN MÓDULO
        let contextoIA = {
            usuario: {
                nombre: usuarioNombre,
                rol: usuarioRol
            },
            pregunta: pregunta,
            modulo: modulo || "general"
        };

        // DETECTAR SI ES PREGUNTA SOBRE PERMISOS
        const esPreguntaPermisos = esPreguntaSobrePermisos(pregunta);
        if (esPreguntaPermisos) {
            const permisosUsuario = obtenerPermisosDeRol(usuarioRol);
            contextoIA.permisosDelUsuario = permisosUsuario;
        }

        if (documentoIdValido && (modulo === "cliente" || modulo === "facturaPorCobrar" || modulo === "cobroCliente")) {
            const metricas = await obtenerMetricasCliente(documentoIdValido);
            
            if (!metricas) {
                return res.status(500).json({
                    success: false,
                    message: "Error al obtener datos del cliente"
                });
            }

            contextoIA.datosCliente = metricas;
        }

        // PREPARAR PROMPT PARA CLAUDE
        const systemPrompt = `Eres un asistente de supervisión crediticia para un sistema de cuentas por pagar y cobrar.
Tu rol es responder preguntas sobre clientes, facturas, cobros y proporcionar análisis financiero cuando sea necesario.

Rol del usuario: ${usuarioRol}
Nombre del usuario: ${usuarioNombre}
Módulo: ${modulo || "general"}

INSTRUCCIONES:
1. Responde SOLO acerca de los datos proporcionados.
2. Si la pregunta es simple (ej: "¿Cuál es el nombre?"), responde directamente sin análisis extenso.
3. Si la pregunta pide análisis, proporciona análisis detallado con recomendaciones.
4. Sé profesional, conciso y directo.
5. Si notas patrones de atraso o riesgo, señálalos claramente.
6. Responde en español.
${esPreguntaPermisos ? `
7. El usuario pregunta sobre sus permisos/funcionalidades. 
   - Basándote en su rol (${usuarioRol}), explica claramente qué puede y no puede hacer.
   - Sé específico sobre los módulos y acciones disponibles.
   - Usa la estructura de permisos proporcionada para dar una respuesta precisa.
` : ''}`;

        const userMessage = `
Contexto de datos:
${JSON.stringify(contextoIA, null, 2)}

Pregunta del usuario: ${pregunta}

Responde de manera directa y apropiada a lo que se pregunta.`;

        // LLAMAR A CLAUDE
        const response = await client.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: userMessage
                }
            ]
        });

        const respuestaClaudia = response.content[0].type === "text" ? response.content[0].text : "No se pudo obtener respuesta";

        // GUARDAR EN CONVERSACIÓN si existe conversacionId
        if (conversacionId) {
            try {
                const conversacion = await ConversacionIA.findById(conversacionId);
                
                if (!conversacion) {
                    return res.status(404).json({
                        success: false,
                        message: "Conversación no encontrada"
                    });
                }

                // Verificar que el usuario sea el propietario
                if (conversacion.usuario.toString() !== usuarioId.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: "No tienes acceso a esta conversación"
                    });
                }

                // Agregar mensajes: primero la pregunta del usuario, luego la respuesta
                conversacion.mensajes.push(
                    {
                        tipo: "usuario",
                        contenido: pregunta,
                        timestamp: new Date()
                    },
                    {
                        tipo: "asistente",
                        contenido: respuestaClaudia,
                        timestamp: new Date()
                    }
                );

                conversacion.actualizadoEn = new Date();
                await conversacion.save();
            } catch (errConversacion) {
                console.error("Error guardando en conversación:", errConversacion.message);
                // No retornamos error, solo continuamos
            }
        } else {
            // GUARDAR EN HISTORIAL (BD) si no hay conversacionId
            try {
                const nuevoHistorial = new HistorialIA({
                    usuario: usuarioId,
                    pregunta,
                    respuesta: respuestaClaudia,
                    modulo: modulo || "general",
                    documentoId: documentoIdValido || null,
                    contexto: contextoIA.datosCliente || null
                });
                await nuevoHistorial.save();
            } catch (errHistorial) {
                console.error("Error guardando historial en BD:", errHistorial.message);
                // No retornamos error, solo continuamos
            }
        }

        // RETORNAR RESPUESTA
        return res.status(200).json({
            success: true,
            respuesta: respuestaClaudia,
            contexto: {
                usuario: contextoIA.usuario,
                modulo: modulo || "general",
                datosAnalizados: contextoIA.datosCliente ? {
                    cliente: contextoIA.datosCliente.cliente.nombre,
                    riesgo: contextoIA.datosCliente.metricas.riesgoNivel,
                    riesgoScore: contextoIA.datosCliente.metricas.riesgoScore
                } : null
            }
        });

    } catch (err) {
        console.error("[ERROR] preguntarAsistenteIA:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error al procesar la pregunta",
            error: err.message
        });
    }
};

/**
 * Obtener historial de preguntas del usuario
 */
export const obtenerHistorialIA = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { limite = 10, desde = 0, modulo } = req.query;

        let query = { usuario: usuarioId };
        if (modulo && modulo !== "todos") {
            query.modulo = modulo;
        }

        const [total, historial] = await Promise.all([
            HistorialIA.countDocuments(query),
            HistorialIA.find(query)
                .sort({ creadoEn: -1 })
                .skip(Number(desde))
                .limit(Number(limite))
                .lean()
        ]);

        return res.status(200).json({
            success: true,
            total,
            historial
        });
    } catch (err) {
        console.error("[ERROR] obtenerHistorialIA:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error al obtener historial",
            error: err.message
        });
    }
};

/**
 * Eliminar entrada del historial
 */
export const eliminarHistorialIA = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const historial = await HistorialIA.findById(id);
        
        if (!historial) {
            return res.status(404).json({
                success: false,
                message: "Entrada no encontrada"
            });
        }

        if (historial.usuario.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para eliminar esto"
            });
        }

        await HistorialIA.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Entrada eliminada"
        });
    } catch (err) {
        console.error("[ERROR] eliminarHistorialIA:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error al eliminar historial",
            error: err.message
        });
    }
};
