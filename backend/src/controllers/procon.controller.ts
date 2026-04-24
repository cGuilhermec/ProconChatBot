import { Request, Response } from "express";
import { ProconService } from "../services/procon.service";

export class ProconController {
  private proconService: ProconService;

  constructor() {
    this.proconService = new ProconService();
  }

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

      // CONVERTER STRING PARA DATE
      // "08:00:00" -> "1970-01-01T08:00:00.000Z"
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
}
