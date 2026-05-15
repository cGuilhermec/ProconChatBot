// src/controller/pergunta.controller.ts
import { Request, Response } from "express";
import { PerguntaService } from "../service/pergunta.service";
import { StatusModeracao } from "@prisma/client";

export class PerguntaController {
  private perguntaService: PerguntaService;

  constructor() {
    this.perguntaService = new PerguntaService();
  }

  // ============ ROTAS PÚBLICAS (RAG - WhatsApp) ============

  buscarRag = async (req: Request, res: Response) => {
    const { procon_id, pergunta } = req.body;

    if (!procon_id || !pergunta) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "procon_id e pergunta são obrigatórios",
      });
    }

    try {
      const result = await this.perguntaService.buscarPerguntasRag(
        Number(procon_id),
        pergunta,
      );

      return res.status(200).json({
        sucesso: true,
        resultados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  listarPublicas = async (req: Request, res: Response) => {
    const { procon_id } = req.query;

    if (!procon_id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "procon_id é obrigatório",
      });
    }

    try {
      const result = await this.perguntaService.listarPerguntasPublicas(
        Number(procon_id),
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

  buscarPublicaPorId = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await this.perguntaService.buscarPerguntaPublica(
        Number(id),
      );

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

  // ============ ROTAS ADMINISTRATIVAS ============

  criarPergunta = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;
    const {
      procon_id,
      tema,
      pergunta,
      resposta,
      base_legal,
      documentos,
      observacao,
    } = req.body;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.perguntaService.criarPergunta(
        {
          procon_id,
          tema,
          pergunta,
          resposta,
          base_legal,
          documentos,
          observacao,
        },
        usuarioLogado,
      );

      const mensagem =
        result.status_moderacao === "APROVADO"
          ? "Pergunta criada com sucesso!"
          : "Pergunta criada e enviada para revisão devido a palavras sensíveis.";

      return res.status(201).json({
        sucesso: true,
        dados: result,
        mensagem,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  listarPerguntasAdmin = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;
    const { procon_id, status, apenas_ativos } = req.query;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      // 🔧 CORREÇÃO: Só filtrar por ativo se o parâmetro foi explicitamente passado
      let apenasAtivos: boolean | undefined = undefined;

      if (apenas_ativos === "true") {
        apenasAtivos = true;
      } else if (apenas_ativos === "false") {
        apenasAtivos = false;
      }
      // Se não veio nada na query, fica undefined (NÃO FILTRA)

      const result = await this.perguntaService.listarPerguntasAdmin(
        usuarioLogado,
        {
          procon_id: procon_id ? Number(procon_id) : undefined,
          status: status as string,
          apenasAtivos,
        },
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

  atualizarPergunta = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;
    const { tema, pergunta, resposta, base_legal, documentos, observacao } =
      req.body;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.perguntaService.atualizarPergunta(
        Number(id),
        { tema, pergunta, resposta, base_legal, documentos, observacao },
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        dados: result,
        mensagem: "Pergunta atualizada com sucesso!",
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  desativarPergunta = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.perguntaService.desativarPergunta(
        Number(id),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Pergunta desativada com sucesso!",
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  ativarPergunta = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.perguntaService.ativarPergunta(
        Number(id),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Pergunta ativada com sucesso!",
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  revisarPergunta = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, motivo } = req.body;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    if (!status || !Object.values(StatusModeracao).includes(status)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Status inválido",
      });
    }

    try {
      const result = await this.perguntaService.revisarPergunta(
        Number(id),
        status as StatusModeracao,
        usuarioLogado,
        motivo,
      );

      return res.status(200).json({
        sucesso: true,
        dados: result,
        mensagem: `Pergunta ${status === "APROVADO" ? "aprovada" : status === "REPROVADO" ? "reprovada" : "bloqueada"} com sucesso!`,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  excluirPergunta = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.perguntaService.excluirPergunta(
        Number(id),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Pergunta excluída permanentemente!",
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  listarPerguntasPendentes = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Acesso negado. Sem permissão para ver perguntas pendentes.",
      });
    }

    try {
      let proconId =
        usuarioLogado.role === "COORDENADOR"
          ? usuarioLogado.procon_id
          : undefined;

      const result =
        await this.perguntaService.listarPerguntasPendentes(proconId);

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
