// src/routes/dev.routes.ts
import { Router } from "express";
import { ProconController } from "../controller/procon.controller";

const router = Router();
const proconController = new ProconController();

// Rotas Procon
router.post("/procon-dev", proconController.createProconDev);


export default router;