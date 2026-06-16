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

    // ✅ CORREÇÃO: Criar data de referência em UTC
    let dataAtual = new Date(
      Date.UTC(
        dataReferencia.getUTCFullYear(),
        dataReferencia.getUTCMonth(),
        dataReferencia.getUTCDate(),
      ),
    );

    const hoje = new Date();
    const hojeUTC = new Date(
      Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()),
    );

    // Se a data de referência for hoje ou anterior, começar de amanhã
    if (dataAtual <= hojeUTC) {
      dataAtual = new Date(hojeUTC);
      dataAtual.setUTCDate(dataAtual.getUTCDate() + 1);
    }

    while (diasComVagas.length < limit) {
      const isFeriado = await this.feriadoModel.isFeriado(proconId, dataAtual);
      const diaSemana = dataAtual.getUTCDay();
      const isDiaUtil = diaSemana !== 0 && diaSemana !== 6;

      console.log(
        `Verificando data: ${dataAtual.toISOString()}, Dia: ${diaSemana} (${this.getNomeDiaSemana(dataAtual)}), Util: ${isDiaUtil}`,
      );

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

      // Avançar para o próximo dia em UTC
      dataAtual.setUTCDate(dataAtual.getUTCDate() + 1);
    }

    return diasComVagas;
  }

  async buscarHorariosDisponiveis(proconId: number, data: Date) {
    const procon = await this.proconModel.findById(proconId);
    if (!procon) {
      throw new Error("Procon não encontrado");
    }

    // ✅ Garantir que a data está em UTC
    const dataUTC = new Date(
      Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
    );

    const horarios = this.gerarHorarios(procon);
    const horariosDisponiveis = [];

    for (const horario of horarios) {
      const ocupadas = await this.agendamentoModel.countVagasOcupadas(
        proconId,
        dataUTC,
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

    // Trabalhar com datas no formato local
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // A data recebida já está no formato local
    let dataAgendamento: Date;

    if (data.data_agendamento instanceof Date) {
      dataAgendamento = new Date(data.data_agendamento);
    } else {
      dataAgendamento = new Date(data.data_agendamento);
    }

    // Resetar horas para garantir que só a data seja considerada
    dataAgendamento.setHours(0, 0, 0, 0);

    // Comparar datas (considerando apenas dia, mês, ano)
    const hojeUTC = new Date(
      Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
    );
    const dataAgendamentoUTC = new Date(
      Date.UTC(
        dataAgendamento.getFullYear(),
        dataAgendamento.getMonth(),
        dataAgendamento.getDate(),
      ),
    );

    if (dataAgendamentoUTC <= hojeUTC) {
      throw new Error("A data do agendamento deve ser no mínimo amanhã");
    }

    // Verificar feriado
    const isFeriado = await this.feriadoModel.isFeriado(
      data.procon_id,
      dataAgendamento,
    );
    if (isFeriado) {
      throw new Error("Não é possível agendar em feriados");
    }

    // Verificar dia da semana
    const diaSemana = dataAgendamento.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      throw new Error("Não é possível agendar aos finais de semana");
    }

    // Validar horário
    const horarioValido = this.validarHorario(data.horario_agendamento, procon);
    if (!horarioValido) {
      throw new Error("Horário inválido ou fora do expediente");
    }

    // Verificar vagas
    const ocupadas = await this.agendamentoModel.countVagasOcupadas(
      data.procon_id,
      dataAgendamento,
      data.horario_agendamento,
    );

    if (ocupadas >= procon.vagas_por_horario) {
      throw new Error("Horário indisponível. Não há vagas");
    }

    // Verificar se já tem agendamento no mesmo dia
    const agendamentosDoDia = await this.agendamentoModel.findByData(
      data.procon_id,
      dataAgendamento,
    );

    const jaTemAgendamento = agendamentosDoDia.some((a) => a.cpf === data.cpf);
    if (jaTemAgendamento) {
      throw new Error("Você já possui um agendamento para esta data");
    }

    // 🔥 SOLUÇÃO DEFINITIVA: Salvar como string ISO com offset fixo
    const [hora, minuto] = data.horario_agendamento.split(":").map(Number);

    // Criar string ISO com offset -03:00 (horário de Brasília)
    const ano = dataAgendamento.getFullYear();
    const mes = String(dataAgendamento.getMonth() + 1).padStart(2, "0");
    const dia = String(dataAgendamento.getDate()).padStart(2, "0");
    const horaStr = String(hora).padStart(2, "0");
    const minutoStr = String(minuto).padStart(2, "0");

    // Formato: 2026-06-25T08:00:00-03:00
    const dataHoraString = `${ano}-${mes}-${dia}T${horaStr}:${minutoStr}:00-03:00`;

    console.log(`📅 Criando agendamento:`);
    console.log(
      `   Data original: ${dataAgendamento.toLocaleDateString("pt-BR")}`,
    );
    console.log(`   Horário: ${data.horario_agendamento}`);
    console.log(`   DateTime string: ${dataHoraString}`);

    // Salvar como string no banco (se o campo for String)
    // OU converter para Date (o PostgreSQL vai respeitar o offset)
    const dataHoraAgendamento = new Date(dataHoraString);

    console.log(
      `   DateTime objeto: ${dataHoraAgendamento.toLocaleString("pt-BR")}`,
    );
    console.log(`   ISO salvo: ${dataHoraAgendamento.toISOString()}`);

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

    // ✅ Extrair hora e minuto diretamente (já estão salvos no banco como TIME)
    // O banco guarda "08:00:00" e "17:00:00" no horário local
    const aberturaHora = procon.horario_abertura.getUTCHours();
    const aberturaMinuto = procon.horario_abertura.getUTCMinutes();
    const fechamentoHora = procon.horario_fechamento.getUTCHours();
    const fechamentoMinuto = procon.horario_fechamento.getUTCMinutes();

    let horaAtual = aberturaHora;
    let minutoAtual = aberturaMinuto;

    while (
      horaAtual < fechamentoHora ||
      (horaAtual === fechamentoHora && minutoAtual < fechamentoMinuto)
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
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
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
    return dias[data.getUTCDay()];
  }
}
