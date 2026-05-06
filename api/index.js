import { config } from "dotenv";
import { createServerlessApp } from "../configs/server.js";

config();

const app = createServerlessApp();

export default app;
