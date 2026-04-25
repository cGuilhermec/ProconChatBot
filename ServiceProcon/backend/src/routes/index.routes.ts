// src/routes/index.routes.ts
import { Router } from "express";
import devRoutes from "./dev.routes";

const router = Router();

// Rotas de desenvolvimento
router.use("/dev", devRoutes);

export default router;