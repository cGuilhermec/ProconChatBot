// src/model/agendamento.model.ts
import { prisma } from "../config/database";
import { Prisma, StatusAgendamento } from "@prisma/client";

export class AgendamentoModel {
  // ============ MÉTODOS DE CONSULTA ============

  async findById(id: number) {
    return prisma.agendamento.findUnique({
      where: { AGENDAMENTO_ID: id },
      include: {
        procon: {
          select: {
            PROCON_ID: true,
            nome: true,
            cidade: true,
            endereco: true,
            telefone: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    procon_id?: number;
    status?: StatusAgendamento;
    dataInicio?: Date;
    dataFim?: Date;
    cpf?: string;
  }) {
    const where: any = {};

    if (filters?.procon_id) where.procon_id = filters.procon_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.cpf) where.cpf = filters.cpf;

    if (filters?.dataInicio || filters?.dataFim) {
      where.data_agendamento = {};
      if (filters.dataInicio) where.data_agendamento.gte = filters.dataInicio;
      if (filters.dataFim) where.data_agendamento.lte = filters.dataFim;
    }

    return prisma.agendamento.findMany({
      where,
      orderBy: [{ data_agendamento: "asc" }, { horario_agendamento: "asc" }],
      include: {
        procon: {
          select: {
            PROCON_ID: true,
            nome: true,
            cidade: true,
          },
        },
      },
    });
  }

  async findByCpf(cpf: string, apenasFuturos: boolean = true) {
    const where: any = { cpf };

    if (apenasFuturos) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      where.data_agendamento = { gte: hoje };
    }

    return prisma.agendamento.findMany({
      where,
      orderBy: [{ data_agendamento: "asc" }, { horario_agendamento: "asc" }],
      include: {
        procon: {
          select: {
            PROCON_ID: true,
            nome: true,
            cidade: true,
            endereco: true,
            telefone: true,
          },
        },
      },
    });
  }

  async findByData(proconId: number, data: Date, horario?: string) {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      procon_id: proconId,
      data_agendamento: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { notIn: ["CANCELADO", "FALTOU"] },
    };

    if (horario) {
      const [hora, minuto] = horario.split(":").map(Number);
      const dataComHorario = new Date(data);
      dataComHorario.setHours(hora, minuto, 0, 0);

      const dataComHorarioFim = new Date(data);
      dataComHorarioFim.setHours(hora, minuto, 59, 999);

      where.horario_agendamento = {
        gte: dataComHorario,
        lte: dataComHorarioFim,
      };
    }

    return prisma.agendamento.findMany({ where });
  }

  async countVagasOcupadas(proconId: number, data: Date, horario: string) {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    // ⬅️ CONVERTER O HORÁRIO PARA UM OBJECT DATE COMPLETO
    const [hora, minuto] = horario.split(":").map(Number);
    const dataComHorario = new Date(data);
    dataComHorario.setHours(hora, minuto, 0, 0);

    const dataComHorarioFim = new Date(data);
    dataComHorarioFim.setHours(hora, minuto, 59, 999);

    return prisma.agendamento.count({
      where: {
        procon_id: proconId,
        data_agendamento: {
          gte: startOfDay,
          lte: endOfDay,
        },
        horario_agendamento: {
          gte: dataComHorario,
          lte: dataComHorarioFim,
        },
        status: { notIn: ["CANCELADO", "FALTOU"] },
      },
    });
  }

  // ============ MÉTODOS DE ESCRITA ============

  async create(data: Prisma.AgendamentoCreateInput) {
    return prisma.agendamento.create({ data });
  }

  async updateStatus(id: number, status: StatusAgendamento) {
    return prisma.agendamento.update({
      where: { AGENDAMENTO_ID: id },
      data: { status, updated_at: new Date() },
    });
  }

  async cancel(id: number) {
    return prisma.agendamento.update({
      where: { AGENDAMENTO_ID: id },
      data: { status: "CANCELADO", updated_at: new Date() },
    });
  }

  async delete(id: number) {
    return prisma.agendamento.delete({
      where: { AGENDAMENTO_ID: id },
    });
  }

  // ============ MÉTODOS PARA JOBS ============

  async marcarCompareceu(data: Date) {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.agendamento.updateMany({
      where: {
        data_agendamento: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "PENDENTE",
      },
      data: { status: "COMPARECEU", updated_at: new Date() },
    });
  }

  async marcarFaltou(data: Date) {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.agendamento.updateMany({
      where: {
        data_agendamento: {
          lt: startOfDay,
        },
        status: "PENDENTE",
      },
      data: { status: "FALTOU", updated_at: new Date() },
    });
  }
}
