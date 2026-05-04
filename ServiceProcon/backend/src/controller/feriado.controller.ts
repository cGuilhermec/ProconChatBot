// src/controller/feriado.controller.ts
import { Request, Response } from "express";
import { FeriadoService } from "../service/feriado.service";

export class FeriadoController {
  private feriadoService: FeriadoService;

  constructor() {
    this.feriadoService = new FeriadoService();
  }

  // 🔒 Criar feriado
  createFeriado = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;
    const { procon_id, data, nome, recorrente } = req.body;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.feriadoService.create(
        {
          procon_id,
          data: new Date(data),
          nome,
          recorrente: recorrente || false,
        },
        usuarioLogado,
      );

      return res.status(201).json({
        sucesso: true,
        dados: result,
        mensagem: `Feriado ${nome} criado com sucesso!`,
      });
    } catch (error: any) {
      console.error("❌ Erro ao criar feriado:", error);
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  // 🟢 Listar feriados (público)
  listarFeriados = async (req: Request, res: Response) => {
    const { procon_id } = req.query;

    try {
      const result = await this.feriadoService.listarFeriados(
        procon_id ? Number(procon_id) : undefined,
      );

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

  // 🟢 Buscar feriado por ID (público)
  buscarFeriadoPorId = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await this.feriadoService.buscarFeriadoPorId(Number(id));

      return res.status(200).json({
        sucesso: true,
        dados: result,
      });
    } catch (error: any) {
      return res.status(404).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  // 🔒 Atualizar feriado
  atualizarFeriado = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;
    const { data, nome, recorrente } = req.body;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const updateData: any = {};
      if (data) updateData.data = new Date(data);
      if (nome) updateData.nome = nome;
      if (recorrente !== undefined) updateData.recorrente = recorrente;

      const result = await this.feriadoService.atualizarFeriado(
        Number(id),
        updateData,
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        dados: result,
        mensagem: "Feriado atualizado com sucesso!",
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  // 🔒 Excluir feriado
  excluirFeriado = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.feriadoService.excluirFeriado(
        Number(id),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: `Feriado ${result.nome} excluído com sucesso!`,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  // 🟢 Verificar se é feriado (útil para o frontend)
  verificarFeriado = async (req: Request, res: Response) => {
    const { procon_id, data } = req.query;

    if (!procon_id || !data) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Procon ID e data são obrigatórios",
      });
    }

    try {
      const isFeriado = await this.feriadoService.isFeriado(
        Number(procon_id),
        new Date(data as string),
      );

      return res.status(200).json({
        sucesso: true,
        isFeriado,
      });
    } catch (error: any) {
      console.error("❌ Erro ao verificar feriado:", error);
      return res.status(500).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };
}
