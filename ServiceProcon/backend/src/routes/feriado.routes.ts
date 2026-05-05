// src/routes/feriado.routes.ts
import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { FeriadoController } from "../controller/feriado.controller";

const router = Router();
const feriadoController = new FeriadoController();

// 🟢 Rotas PÚBLICAS (qualquer um pode ver)
// ⚠️ IMPORTANTE: Rotas ESPECÍFICAS devem vir antes de rotas com PARÂMETROS
router.get("/feriados", feriadoController.listarFeriados);
router.get("/feriado/verificar", feriadoController.verificarFeriado); // ⬅️ ANTES de /:id
router.get("/feriado/:id", feriadoController.buscarFeriadoPorId);      // ⬅️ DEPOIS

// 🔒 Rotas PROTEGIDAS (apenas COORDENADOR, DIRETOR, DEV)
router.post("/feriado", AuthMiddleware.authenticateToken, feriadoController.createFeriado);
router.put("/feriado/:id", AuthMiddleware.authenticateToken, feriadoController.atualizarFeriado);
router.delete("/feriado/:id", AuthMiddleware.authenticateToken, feriadoController.excluirFeriado);

export default router;