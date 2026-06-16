// src/controller/agendamento.controller.ts
import { Request, Response } from "express";
import { AgendamentoService } from "../service/agendamento.service";
import { StatusAgendamento } from "@prisma/client";

export class AgendamentoController {
  private agendamentoService: AgendamentoService;

  constructor() {
    this.agendamentoService = new AgendamentoService();
  }

  // ============ ROTAS PÚBLICAS (WhatsApp) ============

  buscarProximosDias = async (req: Request, res: Response) => {
    const { procon_id, data_referencia, limit } = req.query;

    if (!procon_id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "procon_id é obrigatório",
      });
    }

    try {
      // ✅ Criar data de referência em UTC
      let dataReferencia: Date;
      if (data_referencia) {
        const dateStr = data_referencia as string;
        // Se for string no formato YYYY-MM-DD
        const [ano, mes, dia] = dateStr.split("-");
        dataReferencia = new Date(
          Date.UTC(parseInt(ano), parseInt(mes) - 1, parseInt(dia)),
        );
      } else {
        dataReferencia = new Date();
        dataReferencia = new Date(
          Date.UTC(
            dataReferencia.getUTCFullYear(),
            dataReferencia.getUTCMonth(),
            dataReferencia.getUTCDate(),
          ),
        );
      }

      const limitNum = limit ? parseInt(limit as string) : 7;

      const result = await this.agendamentoService.buscarProximosDiasComVagas(
        Number(procon_id),
        dataReferencia,
        limitNum,
      );

      return res.status(200).json({
        sucesso: true,
        dados: result.map((dia) => ({
          data: dia.dataFormatada,
          diaSemana: dia.diaSemana,
          horarios: dia.horarios,
        })),
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  buscarHorarios = async (req: Request, res: Response) => {
    const { procon_id, data } = req.query;

    if (!procon_id || !data) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "procon_id e data são obrigatórios",
      });
    }

    try {
      const result = await this.agendamentoService.buscarHorariosDisponiveis(
        Number(procon_id),
        new Date(data as string),
      );

      return res.status(200).json({
        sucesso: true,
        horarios: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  criarAgendamento = async (req: Request, res: Response) => {
    const {
      procon_id,
      nome_usuario,
      cpf,
      telefone,
      data_agendamento,
      horario_agendamento,
      observacao,
    } = req.body;

    try {
      // 🔥 CORREÇÃO: Converter data do formato DD/MM/YYYY para objeto Date local
      let dataLocal: Date;

      if (
        typeof data_agendamento === "string" &&
        data_agendamento.includes("/")
      ) {
        // Formato DD/MM/YYYY
        const partes = data_agendamento.split("/");
        const dia = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1; // Mês é 0-index
        const ano = parseInt(partes[2]);

        // Criar data no timezone local (sem conversão UTC)
        dataLocal = new Date(ano, mes, dia);
      } else {
        // Se já for outro formato
        dataLocal = new Date(data_agendamento);
      }

      // Validar se a data é válida
      if (isNaN(dataLocal.getTime())) {
        throw new Error("Data inválida");
      }

      console.log(`📅 Data recebida: ${data_agendamento}`);
      console.log(
        `📅 Data convertida local: ${dataLocal.toLocaleDateString("pt-BR")}`,
      );

      const result = await this.agendamentoService.criarAgendamento({
        procon_id,
        nome_usuario,
        cpf,
        telefone,
        data_agendamento: dataLocal, // Passa a data local
        horario_agendamento,
        observacao,
      });

      return res.status(201).json({
        sucesso: true,
        dados: result,
        mensagem: "Agendamento realizado com sucesso!",
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  buscarPorCpf = async (req: Request, res: Response) => {
    const { cpf, apenas_futuros } = req.query;

    if (!cpf) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "CPF é obrigatório",
      });
    }

    try {
      const apenasFuturos = apenas_futuros !== "false";
      const result = await this.agendamentoService.buscarAgendamentosPorCpf(
        cpf as string,
        apenasFuturos,
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

  cancelarAgendamento = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { cpf } = req.body;

    try {
      const result = await this.agendamentoService.cancelarAgendamento(
        Number(id),
        cpf,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: result.mensagem,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  // ============ ROTAS PROTEGIDAS (Funcionários) ============

  listarAgendamentos = async (req: Request, res: Response) => {
    const usuarioLogado = (req as any).user;
    const { procon_id, status, data_inicio, data_fim, cpf } = req.query;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.agendamentoService.listarAgendamentos(
        {
          procon_id: procon_id ? Number(procon_id) : undefined,
          status: status as StatusAgendamento,
          dataInicio: data_inicio ? new Date(data_inicio as string) : undefined,
          dataFim: data_fim ? new Date(data_fim as string) : undefined,
          cpf: cpf as string,
        },
        usuarioLogado,
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

  buscarAgendamentoPorId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.agendamentoService.buscarAgendamentoPorId(
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

  atualizarStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const usuarioLogado = (req as any).user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    if (!status || !Object.values(StatusAgendamento).includes(status)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Status inválido",
      });
    }

    try {
      const result = await this.agendamentoService.atualizarStatus(
        Number(id),
        status,
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        dados: result,
        mensagem: `Status do agendamento atualizado para ${status}`,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };
}
