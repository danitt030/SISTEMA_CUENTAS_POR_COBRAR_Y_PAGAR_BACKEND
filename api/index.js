import { config } from "dotenv";
import { createServerlessApp } from "../configs/server.js";

config();

const appPromise = createServerlessApp();

export default async (req, res) => {
	const app = await appPromise;
	return app(req, res);
};
