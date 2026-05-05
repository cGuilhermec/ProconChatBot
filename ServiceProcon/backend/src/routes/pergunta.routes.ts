// src/routes/pergunta.routes.ts
import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { PerguntaController } from "../controller/pergunta.controller";

const router = Router();
const perguntaController = new PerguntaController();

// ============ ROTAS PÚBLICAS (RAG - WhatsApp) ============
router.post("/perguntas/buscar", perguntaController.buscarRag);
router.get("/perguntas", perguntaController.listarPublicas);
router.get("/pergunta/:id", perguntaController.buscarPublicaPorId);

// ============ ROTAS ADMINISTRATIVAS ============
router.post("/pergunta", AuthMiddleware.authenticateToken, perguntaController.criarPergunta);
router.get("/admin/perguntas", AuthMiddleware.authenticateToken, perguntaController.listarPerguntasAdmin);
router.put("/pergunta/:id", AuthMiddleware.authenticateToken, perguntaController.atualizarPergunta);
router.put("/pergunta/:id/desativar", AuthMiddleware.authenticateToken, perguntaController.desativarPergunta);
router.put("/pergunta/:id/ativar", AuthMiddleware.authenticateToken, perguntaController.ativarPergunta);
router.put("/admin/pergunta/:id/revisar", AuthMiddleware.authenticateToken, perguntaController.revisarPergunta);
router.delete("/pergunta/:id", AuthMiddleware.authenticateToken, perguntaController.excluirPergunta);
router.get("/admin/perguntas/pendentes", AuthMiddleware.authenticateToken, perguntaController.listarPerguntasPendentes);

export default router;