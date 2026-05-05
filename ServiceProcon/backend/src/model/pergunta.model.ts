// src/model/pergunta.model.ts
import { prisma } from "../config/database";
import { Prisma, StatusModeracao } from "@prisma/client";

export class PerguntaModel {
  // ============ CONSULTAS PÚBLICAS (RAG) ============

  async findAllAtivas(proconId: number) {
    return prisma.pergunta.findMany({
      where: {
        procon_id: proconId,
        ativo: true,
        status_moderacao: "APROVADO",
      },
      orderBy: { tema: "asc" },
      select: {
        Pergunta_ID: true,
        tema: true,
        pergunta: true,
        resposta: true,
        base_legal: true,
        documentos: true,
        observacao: true,
      },
    });
  }

  async buscarPorSimilaridade(proconId: number, termo: string) {
    // Busca simples por palavras-chave (RAG)
    // Depois podemos melhorar com busca vetorial
    return prisma.pergunta.findMany({
      where: {
        procon_id: proconId,
        ativo: true,
        status_moderacao: "APROVADO",
        OR: [
          { pergunta: { contains: termo, mode: "insensitive" } },
          { resposta: { contains: termo, mode: "insensitive" } },
          { tema: { contains: termo, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        Pergunta_ID: true,
        tema: true,
        pergunta: true,
        resposta: true,
        base_legal: true,
        documentos: true,
        observacao: true,
      },
    });
  }

  // ============ CONSULTAS ADMINISTRATIVAS ============

  async findAll(
    proconId?: number,
    status?: StatusModeracao,
    apenasAtivos?: boolean,
  ) {
    const where: any = {};
    if (proconId) where.procon_id = proconId;
    if (status) where.status_moderacao = status;
    if (apenasAtivos !== undefined) where.ativo = apenasAtivos;

    return prisma.pergunta.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        criador: {
          select: { USUARIO_ID: true, nome: true, email: true },
        },
        atualizador: {
          select: { USUARIO_ID: true, nome: true, email: true },
        },
        revisador: {
          select: { USUARIO_ID: true, nome: true, email: true },
        },
        procon: {
          select: { PROCON_ID: true, nome: true, cidade: true },
        },
      },
    });
  }

  async findById(id: number) {
    return prisma.pergunta.findUnique({
      where: { Pergunta_ID: id },
      include: {
        criador: {
          select: { USUARIO_ID: true, nome: true, email: true },
        },
        atualizador: {
          select: { USUARIO_ID: true, nome: true, email: true },
        },
        revisador: {
          select: { USUARIO_ID: true, nome: true, email: true },
        },
        procon: {
          select: { PROCON_ID: true, nome: true, cidade: true },
        },
      },
    });
  }

  async findByTema(tema: string, proconId: number) {
    return prisma.pergunta.findFirst({
      where: {
        tema,
        procon_id: proconId,
      },
    });
  }

  // ============ ESCRITA ============

  async create(data: any) {
    return prisma.pergunta.create({ data });
  }

  async update(id: number, data: any) {
    return prisma.pergunta.update({
      where: { Pergunta_ID: id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async desativar(id: number) {
    return prisma.pergunta.update({
      where: { Pergunta_ID: id },
      data: { ativo: false, updated_at: new Date() },
    });
  }

  async ativar(id: number) {
    return prisma.pergunta.update({
      where: { Pergunta_ID: id },
      data: { ativo: true, updated_at: new Date() },
    });
  }

  async revisar(
    id: number,
    status: StatusModeracao,
    revisadoPor: number,
    motivo?: string,
  ) {
    return prisma.pergunta.update({
      where: { Pergunta_ID: id },
      data: {
        status_moderacao: status,
        revisado_por: revisadoPor,
        revisado_em: new Date(),
        motivo_reprovacao: motivo,
        ativo: status === "APROVADO" ? true : false,
        updated_at: new Date(),
      },
    });
  }

  async delete(id: number) {
    return prisma.pergunta.delete({
      where: { Pergunta_ID: id },
    });
  }
}
