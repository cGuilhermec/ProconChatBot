// src/routes/agendamento.routes.ts
import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { AgendamentoController } from "../controller/agendamento.controller";

const router = Router();
const agendamentoController = new AgendamentoController();

// ============ ROTAS PÚBLICAS (WhatsApp - sem autenticação) ============
router.get("/agendamento/dias-disponiveis", agendamentoController.buscarProximosDias);
router.get("/agendamento/horarios-disponiveis", agendamentoController.buscarHorarios);
router.post("/agendamento", agendamentoController.criarAgendamento);
router.get("/agendamento/buscar-por-cpf", agendamentoController.buscarPorCpf);
router.delete("/agendamento/:id", agendamentoController.cancelarAgendamento);

// ============ ROTAS ADMINISTRATIVAS (Funcionários - com autenticação) ============
router.get("/admin/agendamentos", AuthMiddleware.authenticateToken, agendamentoController.listarAgendamentos);
router.get("/admin/agendamento/:id", AuthMiddleware.authenticateToken, agendamentoController.buscarAgendamentoPorId);
router.put("/admin/agendamento/:id/status", AuthMiddleware.authenticateToken, agendamentoController.atualizarStatus);

export default router;