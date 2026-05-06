// src/routes/procon.routes.ts
import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ProconController } from "../controller/procon.controller";

const router = Router();
const proconController = new ProconController();

// ============ ROTAS PÚBLICAS (WhatsApp) ============
// ✅ ROTA PÚBLICA - Buscar Procon por número do WhatsApp
router.get("/procons/whatsapp/:whatsapp_number", proconController.buscarPorWhatsApp);

// 🔒 ROTAS AUTENTICADAS (apenas COORDENADOR, DIRETOR, DEV)

// Criar Procon
router.post("/procon", AuthMiddleware.authenticateToken, proconController.createProcon);

// Listar todos os Procons
router.get("/procons", AuthMiddleware.authenticateToken, proconController.listarProcons);

// Buscar Procon por ID
router.get("/procon/:id", AuthMiddleware.authenticateToken, proconController.buscarProconPorId);

// Atualizar Procon
router.put("/procon/:id", AuthMiddleware.authenticateToken, proconController.atualizarProcon);

// Deletar Procon (apenas DIRETOR, DEV)
router.delete("/procon/:id", AuthMiddleware.authenticateToken, proconController.deletarProcon);

router.put("/procon/:id/desativar", AuthMiddleware.authenticateToken, proconController.desativarProcon);

// Ativar Procon
router.put("/procon/:id/ativar", AuthMiddleware.authenticateToken, proconController.ativarProcon);
router.get("/procons-ativos", proconController.listarProconsAtivos);

export default router;