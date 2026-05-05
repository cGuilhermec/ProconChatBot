// src/model/auditLog.model.ts
import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

export class AuditLogModel {
  // Criar um registro de auditoria
  async create(data: Prisma.AuditLogCreateInput) {
    return prisma.auditLog.create({ data });
  }

  // Buscar logs por usuário
  async findByUsuario(usuarioId: number, limit?: number) {
    const logs = await prisma.auditLog.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        usuario: {
          select: {
            USUARIO_ID: true,
            nome: true,
            email: true,
            role: true,
          },
        },
        pergunta: {
          select: {
            Pergunta_ID: true,
            tema: true,
            pergunta: true,
          },
        },
      },
    });

    // Converter BigInt para Number
    return logs.map((log) => ({
      ...log,
      id: Number(log.id),
    }));
  }

  // Buscar logs por ação
  async findByAcao(acao: string, limit?: number) {
    const logs = await prisma.auditLog.findMany({
      where: { acao },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        usuario: {
          select: {
            USUARIO_ID: true,
            nome: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      ...log,
      id: Number(log.id),
    }));
  }

  // Buscar logs por período
  async findByPeriodo(dataInicio: Date, dataFim: Date, limit?: number) {
    const logs = await prisma.auditLog.findMany({
      where: {
        created_at: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        usuario: {
          select: {
            USUARIO_ID: true,
            nome: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      ...log,
      id: Number(log.id),
    }));
  }

  // Buscar logs por pergunta
  async findByPergunta(perguntaId: number, limit?: number) {
    const logs = await prisma.auditLog.findMany({
      where: { pergunta_id: perguntaId },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        usuario: {
          select: {
            USUARIO_ID: true,
            nome: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      ...log,
      id: Number(log.id),
    }));
  }

  // Listar todos os logs (com paginação)
  async findAll(page: number = 1, limit: number = 50, filtros?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filtros?.usuario_id) {
      if (
        typeof filtros.usuario_id === "object" &&
        "in" in filtros.usuario_id
      ) {
        where.usuario_id = { in: filtros.usuario_id.in };
      } else {
        where.usuario_id = filtros.usuario_id;
      }
    }
    if (filtros?.acao) where.acao = filtros.acao;
    if (filtros?.dataInicio || filtros?.dataFim) {
      where.created_at = {};
      if (filtros.dataInicio) where.created_at.gte = filtros.dataInicio;
      if (filtros.dataFim) where.created_at.lte = filtros.dataFim;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              USUARIO_ID: true,
              nome: true,
              email: true,
              role: true,
            },
          },
          pergunta: {
            select: {
              Pergunta_ID: true,
              tema: true,
              pergunta: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      dados: logs.map((log) => ({
        ...log,
        id: Number(log.id),
      })),
      total,
      pagina: page,
      totalPaginas: Math.ceil(total / limit),
    };
  }
}
