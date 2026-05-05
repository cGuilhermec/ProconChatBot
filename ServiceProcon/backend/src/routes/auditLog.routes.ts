// src/routes/auditLog.routes.ts
import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { AuditLogController } from "../controller/auditLog.controller";

const router = Router();
const auditLogController = new AuditLogController();

// Usuário vê seus próprios logs
router.get("/meus-logs", AuthMiddleware.authenticateToken, auditLogController.meusLogs);

// Admin: listar todos os logs (apenas COORDENADOR, DIRETOR, DEV)
router.get("/admin/logs", AuthMiddleware.authenticateToken, auditLogController.listarTodos);

// Admin: buscar logs por ação
router.get("/admin/logs/acao/:acao", AuthMiddleware.authenticateToken, auditLogController.logsPorAcao);

export default router;