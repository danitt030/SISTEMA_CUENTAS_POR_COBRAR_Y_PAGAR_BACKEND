import { Router } from "express";
import {
    resumenSaldos,
    resumenPorProveedor,
    resumenPorCliente,
    facturasPorVencer,
    facturasVencidas,
    cobrabilidad,
    pagabilidad,
    facturasPorEstado,
    topClientesDeudores,
    topProveedoresAcreedores,
    analisisComisiones,
    exportarReporte
} from "../reportes/reportes.controller.js";
import {
    validarResumenSaldos,
    validarResumenPorProveedor,
    validarResumenPorCliente,
    validarFacturasPorVencer,
    validarFacturasVencidas,
    validarCobrabilidad,
    validarPagabilidad,
    validarFacturasPorEstado,
    validarTopClientesDeudores,
    validarTopProveedoresAcreedores,
    validarAnalisisComisiones,
    validarExportarReporte
} from "../middlewares/reportes-validators.js";

const router = Router();

// Resumen general de saldos
router.get("/resumen/saldos", validarResumenSaldos, resumenSaldos);

// Resumen por proveedor
router.get("/resumen/proveedores", validarResumenPorProveedor, resumenPorProveedor);

// Resumen por cliente
router.get("/resumen/clientes", validarResumenPorCliente, resumenPorCliente);

// Facturas por vencer (próximos 30 días)
router.get("/facturas/porVencer", validarFacturasPorVencer, facturasPorVencer);

// Facturas vencidas
router.get("/facturas/vencidas", validarFacturasVencidas, facturasVencidas);

// Análisis de cobrabilidad
router.get("/analisis/cobrabilidad", validarCobrabilidad, cobrabilidad);

// Análisis de pagabilidad
router.get("/analisis/pagabilidad", validarPagabilidad, pagabilidad);

// Facturas por estado
router.get("/facturas/estado", validarFacturasPorEstado, facturasPorEstado);

// Top 10 clientes deudores
router.get("/top/deudores", validarTopClientesDeudores, topClientesDeudores);

// Top 10 proveedores acreedores
router.get("/top/acreedores", validarTopProveedoresAcreedores, topProveedoresAcreedores);

// Análisis de comisiones
router.get("/analisis/comisiones", validarAnalisisComisiones, analisisComisiones);

// Exportar reporte completo en Excel
router.get("/exportar/excel", validarExportarReporte, exportarReporte);

export default router;
