"use strict";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cron from "node-cron";
import axios from "axios";
import apiLimiter from "../src/middlewares/rate-limit-validator.js";
import { dbConnection } from "./mongo.js";

// Importar rutas
import authRoutes from "../src/auth/auth.routes.js";
import usuariosRoutes from "../src/user/user.routes.js";
import proveedoresRoutes from "../src/proveedor/proveedor.routes.js";
import { crearAdmin } from "./admin-default.js";

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(cors());
    app.use(helmet());
    app.use(morgan("dev"));
    app.use(apiLimiter);
};

const routes = (app) => {
    app.get("/ping", (req, res) => {
        res.status(200).json({ message: "pong" });
    })

    // Rutas de autenticación
    app.use("/sistemasCuentasPorPagarYCobrar/v1/auth", authRoutes);

    // Rutas de usuarios
    app.use("/sistemasCuentasPorPagarYCobrar/v1/usuarios", usuariosRoutes);

    // Rutas de proveedores
    app.use("/sistemasCuentasPorPagarYCobrar/v1/proveedores", proveedoresRoutes);
};

const conectarDB = async () => {
    try {
        await dbConnection();        
        // Crear admin por defecto
        await crearAdmin();
        
    } catch (err) {
        console.log(`Database connection failed: ${err}`);
        process.exit(1);
    }
};

export const initServer = () => {
    const app = express()
    try{
        middlewares(app)
        conectarDB()
        routes(app)
        app.listen(process.env.PORT)
        console.log(`\n🚀 Servidor ejecutándose en puerto ${process.env.PORT}\n`)
        cron.schedule("*/5 * * * *", async () => {
            try {
                await axios.get(`http://localhost:${process.env.PORT}/ping`);
                console.log("Ping interno enviado para mantener el servidor activo");
            }catch(err){
                console.error("Error al enviar ping:", err.message);
            }
        });
    }catch(err){
        console.log(`Server init failed: ${err}`)
    }
}