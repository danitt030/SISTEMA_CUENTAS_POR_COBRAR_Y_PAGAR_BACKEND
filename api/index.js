import { config } from "dotenv";
import { createServerlessApp } from "../configs/server.js";

config();

const appPromise = createServerlessApp();

export default async (req, res) => {
	// CORS fallback for serverless preflight and error paths
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.setHeader("Access-Control-Max-Age", "86400");

	if (req.method === "OPTIONS") {
		return res.status(204).end();
	}

	try {
		const app = await appPromise;
		return app(req, res);
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "Error al iniciar el servidor",
			error: err?.message
		});
	}
};
