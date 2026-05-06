// src/controller/procon.controller.ts
import { Request, Response } from "express";
import { ProconService } from "../service/procon.service";

export class ProconController {
  private proconService: ProconService;

  constructor() {
    this.proconService = new ProconService();
  }

  // ============ ROTAS DEV (sem autenticação) ============

  createProconDev = async (req: Request, res: Response) => {
    try {
      let {
        nome,
        cidade,
        estado,
        endereco,
        telefone,
        email,
        horario_abertura,
        horario_fechamento,
        duracao_atendimento_minutos,
        vagas_por_horario,
      } = req.body;

      // Converter string para Date
      const [horaAbertura, minutoAbertura] = horario_abertura.split(":");
      const [horaFechamento, minutoFechamento] = horario_fechamento.split(":");

      const dataAbertura = new Date();
      dataAbertura.setUTCHours(
        parseInt(horaAbertura),
        parseInt(minutoAbertura),
        0,
        0,
      );

      const dataFechamento = new Date();
      dataFechamento.setUTCHours(
        parseInt(horaFechamento),
        parseInt(minutoFechamento),
        0,
        0,
      );

      const result = await this.proconService.createProconDev({
        nome,
        cidade,
        estado,
        endereco,
        telefone,
        email,
        horario_abertura: dataAbertura,
        horario_fechamento: dataFechamento,
        duracao_atendimento_minutos,
        vagas_por_horario,
      });

      return res.status(result.sucesso ? 201 : 400).json(result);
    } catch (error: any) {
      console.error("❌ Erro no Procon controller:", error);
      return res.status(500).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro interno no servidor",
      });
    }
  };

  // ============ ROTAS AUTENTICADAS ============

  createProcon = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      let {
        nome,
        cidade,
        estado,
        endereco,
        telefone,
        email,
        horario_abertura,
        horario_fechamento,
        duracao_atendimento_minutos,
        vagas_por_horario,
      } = req.body;

      // Converter string para Date
      const [horaAbertura, minutoAbertura] = horario_abertura.split(":");
      const [horaFechamento, minutoFechamento] = horario_fechamento.split(":");

      const dataAbertura = new Date();
      dataAbertura.setUTCHours(
        parseInt(horaAbertura),
        parseInt(minutoAbertura),
        0,
        0,
      );

      const dataFechamento = new Date();
      dataFechamento.setUTCHours(
        parseInt(horaFechamento),
        parseInt(minutoFechamento),
        0,
        0,
      );

      const result = await this.proconService.createProcon(
        {
          nome,
          cidade,
          estado,
          endereco,
          telefone,
          email,
          horario_abertura: dataAbertura,
          horario_fechamento: dataFechamento,
          duracao_atendimento_minutos,
          vagas_por_horario,
        },
        usuarioLogado,
      );

      return res.status(201).json({
        sucesso: true,
        dados: result,
        mensagem: `Procon ${nome} criado com sucesso por ${usuarioLogado.nome}!`,
      });
    } catch (error: any) {
      console.error("❌ Erro ao criar Procon:", error);
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao criar Procon",
      });
    }
  };

  listarProcons = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.proconService.listarProcons(usuarioLogado);

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

  buscarProconPorId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.proconService.buscarProconPorId(
        Number(id),
        usuarioLogado,
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

  // src/controller/procon.controller.ts
  atualizarProcon = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;
    const updateData = req.body;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      if (updateData.horario_abertura) {
        const [hora, minuto] = updateData.horario_abertura.split(":");
        const data = new Date();
        data.setUTCHours(parseInt(hora), parseInt(minuto), 0, 0);
        updateData.horario_abertura = data;
      }

      if (updateData.horario_fechamento) {
        const [hora, minuto] = updateData.horario_fechamento.split(":");
        const data = new Date();
        data.setUTCHours(parseInt(hora), parseInt(minuto), 0, 0);
        updateData.horario_fechamento = data;
      }

      const result = await this.proconService.atualizarProcon(
        Number(id),
        updateData,
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        dados: result,
        mensagem: "Procon atualizado com sucesso!",
      });
    } catch (error: any) {
      // ⬅️ TRATAR ERRO DE PROCON NÃO ENCONTRADO
      if (error.message === "Procon não encontrado") {
        return res.status(404).json({
          sucesso: false,
          erro: error.message,
          mensagem: "Procon não encontrado",
        });
      }

      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  deletarProcon = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.proconService.deletarProcon(
        Number(id),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: `Procon ${result.nome} deletado com sucesso por ${result.deletado_por_nome}!`,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  desativarProcon = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.proconService.desativarProcon(
        Number(id),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: `Procon ${result.nome} foi desativado com sucesso!`,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  ativarProcon = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.proconService.ativarProcon(
        Number(id),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: `Procon ${result.nome} foi ativado com sucesso!`,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  listarProconsAtivos = async (req: Request, res: Response) => {
    try {
      const result = await this.proconService.listarProconsAtivos();

      return res.status(200).json({
        sucesso: true,
        total: result.length,
        dados: result,
      });
    } catch (error: any) {
      console.error("❌ Erro ao listar Procons ativos:", error);
      return res.status(500).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro interno no servidor",
      });
    }
  };

  buscarPorWhatsApp = async (req: Request, res: Response) => {
    const { whatsapp_number } = req.params;

    console.log(`📱 Buscando Procon por WhatsApp: ${whatsapp_number}`);

    try {
      const procon =
        await this.proconService.buscarPorWhatsApp(whatsapp_number);

      if (!procon) {
        return res.status(404).json({
          sucesso: false,
          mensagem: "Nenhum Procon encontrado para este número de WhatsApp",
        });
      }

      return res.status(200).json({
        sucesso: true,
        dados: {
          id: procon.PROCON_ID,
          nome: procon.nome,
          cidade: procon.cidade,
          estado: procon.estado,
          endereco: procon.endereco,
          telefone: procon.telefone,
          email: procon.email,
          horario_abertura: procon.horario_abertura,
          horario_fechamento: procon.horario_fechamento,
          horario_funcionamento: `${procon.horario_abertura.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} às ${procon.horario_fechamento.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          whatsapp_number: procon.whatsapp_number,
          ativo: procon.ativo,
        },
      });
    } catch (error: any) {
      console.error("❌ Erro ao buscar Procon por WhatsApp:", error);
      return res.status(500).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro interno ao buscar Procon",
      });
    }
  };
}
