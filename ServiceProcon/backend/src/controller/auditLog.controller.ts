// src/controller/auditLog.controller.ts
import { Request, Response } from "express";
import { AuditLogService } from "../service/auditLog.service";

export class AuditLogController {
  private auditLogService: AuditLogService;

  constructor() {
    this.auditLogService = new AuditLogService();
  }

  // ============ ROTAS ============

  // Usuário ver seus próprios logs (apenas COORDENADOR, DIRETOR, DEV)
  meusLogs = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    // FUNCIONARIO não pode ver logs
    if (usuarioLogado.role === "FUNCIONARIO") {
      return res.status(403).json({
        sucesso: false,
        mensagem:
          "Acesso negado. Funcionários não têm permissão para visualizar logs.",
      });
    }

    try {
      const result = await this.auditLogService.meusLogs(usuarioLogado.id, 100);
      return res.status(200).json({
        sucesso: true,
        total: result.length,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  // Admin: listar todos os logs
  listarTodos = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;
    const { page, limit, acao, data_inicio, data_fim } = req.query;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    // FUNCIONARIO não pode
    if (usuarioLogado.role === "FUNCIONARIO") {
      return res.status(403).json({
        sucesso: false,
        mensagem:
          "Acesso negado. Funcionários não têm permissão para visualizar logs.",
      });
    }

    try {
      let filtros: any = {};

      if (acao) filtros.acao = acao as string;
      if (data_inicio) filtros.dataInicio = new Date(data_inicio as string);
      if (data_fim) filtros.dataFim = new Date(data_fim as string);

      // COORDENADOR vê apenas logs do seu Procon
      if (usuarioLogado.role === "COORDENADOR") {
        const { prisma } = await import("../config/database");
        const usuariosDoProcon = await prisma.usuario.findMany({
          where: { procon_id: usuarioLogado.procon_id },
          select: { USUARIO_ID: true },
        });
        const ids = usuariosDoProcon.map((u) => u.USUARIO_ID);
        filtros.usuario_id = { in: ids };
      }

      const result = await this.auditLogService.listarTodos(
        page ? Number(page) : 1,
        limit ? Number(limit) : 50,
        filtros,
      );

      return res.status(200).json({
        sucesso: true,
        ...result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  // Admin: buscar logs por ação
  logsPorAcao = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;
    const { acao } = req.params;
    const { limit } = req.query;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    if (usuarioLogado.role === "FUNCIONARIO") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Acesso negado.",
      });
    }

    try {
      let result = await this.auditLogService.logsPorAcao(
        acao,
        limit ? Number(limit) : 100,
      );

      // COORDENADOR filtra apenas logs do seu Procon
      if (usuarioLogado.role === "COORDENADOR") {
        const { prisma } = await import("../config/database");
        const usuariosDoProcon = await prisma.usuario.findMany({
          where: { procon_id: usuarioLogado.procon_id },
          select: { USUARIO_ID: true },
        });
        const ids = usuariosDoProcon.map((u) => u.USUARIO_ID);
        result = result.filter((log) => ids.includes(log.usuario_id));
      }

      return res.status(200).json({
        sucesso: true,
        total: result.length,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };
}
