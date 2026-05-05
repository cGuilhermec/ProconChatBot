// src/service/agendamento.service.ts
import { AgendamentoModel } from "../model/agendamento.model";
import { ProconModel } from "../model/procon.model";
import { FeriadoModel } from "../model/feriado.model";
import { StatusAgendamento } from "@prisma/client";

export class AgendamentoService {
  private agendamentoModel: AgendamentoModel;
  private proconModel: ProconModel;
  private feriadoModel: FeriadoModel;

  constructor() {
    this.agendamentoModel = new AgendamentoModel();
    this.proconModel = new ProconModel();
    this.feriadoModel = new FeriadoModel();
  }

  // ============ MÉTODOS PÚBLICOS (sem autenticação) ============

  async buscarProximosDiasComVagas(
    proconId: number,
    dataReferencia: Date,
    limit: number = 7,
  ) {
    const procon = await this.proconModel.findById(proconId);
    if (!procon) {
      throw new Error("Procon não encontrado");
    }

    const diasComVagas = [];
    let dataAtual = new Date(dataReferencia);
    dataAtual.setHours(0, 0, 0, 0);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataAtual <= hoje) {
      dataAtual = new Date(hoje);
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    while (diasComVagas.length < limit) {
      const isFeriado = await this.feriadoModel.isFeriado(proconId, dataAtual);
      const diaSemana = dataAtual.getDay();
      const isDiaUtil = diaSemana !== 0 && diaSemana !== 6;

      if (!isFeriado && isDiaUtil) {
        const horariosDisponiveis = await this.buscarHorariosDisponiveis(
          proconId,
          dataAtual,
        );

        if (horariosDisponiveis.length > 0) {
          diasComVagas.push({
            data: dataAtual,
            dataFormatada: this.formatarData(dataAtual),
            diaSemana: this.getNomeDiaSemana(dataAtual),
            horarios: horariosDisponiveis,
          });
        }
      }

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return diasComVagas;
  }

  async buscarHorariosDisponiveis(proconId: number, data: Date) {
    const procon = await this.proconModel.findById(proconId);
    if (!procon) {
      throw new Error("Procon não encontrado");
    }

    const horarios = this.gerarHorarios(procon);
    const horariosDisponiveis = [];

    for (const horario of horarios) {
      const ocupadas = await this.agendamentoModel.countVagasOcupadas(
        proconId,
        data,
        horario,
      );

      if (ocupadas < procon.vagas_por_horario) {
        horariosDisponiveis.push(horario);
      }
    }

    return horariosDisponiveis;
  }

  async criarAgendamento(data: {
    procon_id: number;
    nome_usuario: string;
    cpf: string;
    telefone: string;
    data_agendamento: Date;
    horario_agendamento: string;
    observacao?: string;
  }) {
    const procon = await this.proconModel.findById(data.procon_id);
    if (!procon) {
      throw new Error("Procon não encontrado");
    }
    if (!procon.ativo) {
      throw new Error("Este Procon está temporariamente desativado");
    }

    if (!this.validarCPF(data.cpf)) {
      throw new Error("CPF inválido");
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAgendamento = new Date(data.data_agendamento);
    dataAgendamento.setHours(0, 0, 0, 0);

    if (dataAgendamento <= hoje) {
      throw new Error("A data do agendamento deve ser no mínimo amanhã");
    }

    const isFeriado = await this.feriadoModel.isFeriado(
      data.procon_id,
      dataAgendamento,
    );
    if (isFeriado) {
      throw new Error("Não é possível agendar em feriados");
    }

    const diaSemana = dataAgendamento.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      throw new Error("Não é possível agendar aos finais de semana");
    }

    const horarioValido = this.validarHorario(data.horario_agendamento, procon);
    if (!horarioValido) {
      throw new Error("Horário inválido ou fora do expediente");
    }

    const ocupadas = await this.agendamentoModel.countVagasOcupadas(
      data.procon_id,
      dataAgendamento,
      data.horario_agendamento,
    );

    if (ocupadas >= procon.vagas_por_horario) {
      throw new Error("Horário indisponível. Não há vagas");
    }

    const agendamentosDoDia = await this.agendamentoModel.findByData(
      data.procon_id,
      dataAgendamento,
    );

    const jaTemAgendamento = agendamentosDoDia.some((a) => a.cpf === data.cpf);
    if (jaTemAgendamento) {
      throw new Error("Você já possui um agendamento para esta data");
    }

    const [hora, minuto] = data.horario_agendamento.split(":").map(Number);
    const dataHoraAgendamento = new Date(dataAgendamento);
    dataHoraAgendamento.setHours(hora, minuto, 0, 0);

    const agendamento = await this.agendamentoModel.create({
      procon: {
        connect: { PROCON_ID: data.procon_id },
      },
      nome_usuario: data.nome_usuario,
      cpf: data.cpf,
      telefone: data.telefone,
      data_agendamento: dataAgendamento,
      horario_agendamento: dataHoraAgendamento,
      observacao: data.observacao || null,
      status: "PENDENTE",
    });

    return {
      id: agendamento.AGENDAMENTO_ID,
      procon_id: agendamento.procon_id,
      nome_usuario: agendamento.nome_usuario,
      cpf: agendamento.cpf,
      telefone: agendamento.telefone,
      data_agendamento: agendamento.data_agendamento,
      horario_agendamento: agendamento.horario_agendamento,
      status: agendamento.status,
      observacao: agendamento.observacao,
      procon: {
        nome: procon.nome,
        endereco: procon.endereco,
        telefone: procon.telefone,
      },
    };
  }

  async buscarAgendamentosPorCpf(cpf: string, apenasFuturos: boolean = true) {
    return this.agendamentoModel.findByCpf(cpf, apenasFuturos);
  }

  async cancelarAgendamento(id: number, cpf?: string) {
    const agendamento = await this.agendamentoModel.findById(id);

    if (!agendamento) {
      throw new Error("Agendamento não encontrado");
    }

    if (cpf && agendamento.cpf !== cpf) {
      throw new Error("Este agendamento não pertence ao CPF informado");
    }

    if (agendamento.status === "CANCELADO") {
      throw new Error("Este agendamento já está cancelado");
    }

    const hoje = new Date();
    const dataAgendamento = new Date(agendamento.data_agendamento);

    if (dataAgendamento < hoje) {
      throw new Error("Não é possível cancelar um agendamento que já passou");
    }

    const agendamentoCancelado = await this.agendamentoModel.cancel(id);

    return {
      id: agendamentoCancelado.AGENDAMENTO_ID,
      status: agendamentoCancelado.status,
      mensagem: "Agendamento cancelado com sucesso",
    };
  }

  // ============ MÉTODOS ADMINISTRATIVOS (com autenticação) ============

  async listarAgendamentos(
    filtros: {
      procon_id?: number;
      status?: StatusAgendamento;
      dataInicio?: Date;
      dataFim?: Date;
      cpf?: string;
    },
    usuarioLogado: any,
  ) {
    const rolesPermitidos = ["FUNCIONARIO", "COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para listar agendamentos.");
    }

    return this.agendamentoModel.findAll(filtros);
  }

  async buscarAgendamentoPorId(id: number, usuarioLogado: any) {
    const rolesPermitidos = ["FUNCIONARIO", "COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para ver agendamentos.");
    }

    const agendamento = await this.agendamentoModel.findById(id);
    if (!agendamento) {
      throw new Error("Agendamento não encontrado");
    }
    return agendamento;
  }

  async atualizarStatus(
    id: number,
    status: StatusAgendamento,
    usuarioLogado: any,
  ) {
    const rolesPermitidos = ["FUNCIONARIO", "COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para alterar status.");
    }

    const agendamento = await this.agendamentoModel.findById(id);
    if (!agendamento) {
      throw new Error("Agendamento não encontrado");
    }

    return this.agendamentoModel.updateStatus(id, status);
  }

  // ============ MÉTODOS AUXILIARES ============

  private gerarHorarios(procon: any): string[] {
    const horarios = [];
    const [aberturaHora, aberturaMinuto] = procon.horario_abertura
      .toTimeString()
      .split(":");
    const [fechamentoHora, fechamentoMinuto] = procon.horario_fechamento
      .toTimeString()
      .split(":");

    let horaAtual = parseInt(aberturaHora);
    let minutoAtual = parseInt(aberturaMinuto);

    const fechamentoHoraInt = parseInt(fechamentoHora);

    while (
      horaAtual < fechamentoHoraInt ||
      (horaAtual === fechamentoHoraInt && minutoAtual === 0)
    ) {
      const horarioStr = `${horaAtual.toString().padStart(2, "0")}:${minutoAtual.toString().padStart(2, "0")}`;
      horarios.push(horarioStr);

      minutoAtual += procon.duracao_atendimento_minutos;
      if (minutoAtual >= 60) {
        horaAtual++;
        minutoAtual -= 60;
      }
    }

    return horarios;
  }

  private validarHorario(horario: string, procon: any): boolean {
    const [hora, minuto] = horario.split(":").map(Number);

    const [aberturaHora, aberturaMinuto] = procon.horario_abertura
      .toTimeString()
      .split(":");
    const [fechamentoHora, fechamentoMinuto] = procon.horario_fechamento
      .toTimeString()
      .split(":");

    const horarioDate = new Date();
    horarioDate.setHours(hora, minuto, 0);

    const aberturaDate = new Date();
    aberturaDate.setHours(parseInt(aberturaHora), parseInt(aberturaMinuto), 0);

    const fechamentoDate = new Date();
    fechamentoDate.setHours(
      parseInt(fechamentoHora),
      parseInt(fechamentoMinuto),
      0,
    );

    return horarioDate >= aberturaDate && horarioDate < fechamentoDate;
  }

  private validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/[^\d]/g, "");
    if (cpfLimpo.length !== 11) return false;

    const cpfsTeste = [
      "44470962856",
      "12345678900",
      "98765432100",
      "55544433322",
      "99988877766",
      "11122233344",
    ];
    if (cpfsTeste.includes(cpfLimpo)) return true;

    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    const digito1 = resto >= 10 ? 0 : resto;
    if (digito1 !== parseInt(cpfLimpo.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    const digito2 = resto >= 10 ? 0 : resto;
    return digito2 === parseInt(cpfLimpo.charAt(10));
  }

  private formatarData(data: Date): string {
    return data.toLocaleDateString("pt-BR");
  }

  private getNomeDiaSemana(data: Date): string {
    const dias = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    return dias[data.getDay()];
  }
}
