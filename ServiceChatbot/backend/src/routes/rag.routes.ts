// src/routes/rag.routes.ts
import { Router } from "express";
import { RagController } from "../controllers/rag.controller";

const router = Router();
const ragController = new RagController();

// Rotas RAG
router.get("/", ragController.healthCheck);
router.post("/perguntar", ragController.perguntar);
router.get("/temas", ragController.listarTemas);
router.get("/tema/:id", ragController.buscarPorId);
router.get("/stats", ragController.estatisticas);
router.use("*", ragController.notFound);

export default router;
