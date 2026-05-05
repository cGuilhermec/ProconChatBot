// src/model/notificacao.model.ts
import { prisma } from "../config/database";
import { Prisma, TipoNotificacao } from "@prisma/client";

export class NotificacaoModel {
  async create(data: Prisma.NotificacaoCreateInput) {
    return prisma.notificacao.create({ data });
  }

  async findAllByUsuario(usuarioId: number, apenasNaoLidas?: boolean) {
    const where: any = { usuario_id: usuarioId };
    if (apenasNaoLidas) where.lida = false;

    return prisma.notificacao.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        pergunta: {
          select: {
            Pergunta_ID: true,
            tema: true,
            pergunta: true,
          },
        },
      },
    });
  }

  async marcarComoLida(id: number) {
    return prisma.notificacao.update({
      where: { id },
      data: { lida: true, lida_em: new Date() },
    });
  }

  async marcarTodasComoLidas(usuarioId: number) {
    return prisma.notificacao.updateMany({
      where: { usuario_id: usuarioId, lida: false },
      data: { lida: true, lida_em: new Date() },
    });
  }

  async delete(id: number) {
    return prisma.notificacao.delete({ where: { id } });
  }
}
