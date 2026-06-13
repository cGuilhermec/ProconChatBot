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
    const termoLower = termo.toLowerCase();
    console.log(`🔍 Buscando por termo: "${termoLower}"`);

    // Buscar todas as perguntas ativas
    const todasPerguntas = await prisma.pergunta.findMany({
      where: {
        procon_id: proconId,
        ativo: true,
        status_moderacao: "APROVADO",
      },
    });

    console.log(`📊 Total de perguntas encontradas: ${todasPerguntas.length}`);

    // Calcular score de similaridade para cada pergunta
    const resultados = todasPerguntas.map((pergunta) => {
      let score = 0;
      const perguntaLower = pergunta.pergunta.toLowerCase();
      const temaLower = pergunta.tema.toLowerCase();
      const respostaLower = pergunta.resposta.toLowerCase();

      // 🔥 CORREÇÃO: Verificar se o termo está contido (não apenas palavras com mais de 3 letras)
      if (temaLower.includes(termoLower)) {
        score += 50; // Match exato no tema
      }

      if (perguntaLower.includes(termoLower)) {
        score += 30; // Match na pergunta
      }

      if (respostaLower.includes(termoLower)) {
        score += 20; // Match na resposta
      }

      // Verificar palavras individuais do termo
      const palavrasTermo = termoLower.split(/\s+/);
      for (const palavra of palavrasTermo) {
        if (palavra.length > 0) {
          if (temaLower.includes(palavra)) {
            score += 10;
          }
          if (perguntaLower.includes(palavra)) {
            score += 5;
          }
        }
      }

      // Pontuação extra para palavras-chave específicas
      if (
        termoLower === "gay" &&
        (temaLower.includes("gay") || perguntaLower.includes("gay"))
      ) {
        score += 100; // Prioridade máxima para match exato
      }

      return { ...pergunta, score };
    });

    // Ordenar por score e filtrar apenas com score > 0
    resultados.sort((a, b) => b.score - a.score);
    const melhores = resultados.filter((r) => r.score > 0).slice(0, 5);

    console.log(
      "📊 Resultados com scores:",
      melhores.map((r) => ({
        id: r.Pergunta_ID,
        tema: r.tema,
        score: r.score,
      })),
    );

    return melhores;
  }

  // ============ CONSULTAS ADMINISTRATIVAS ============

  async findAll(
    proconId?: number,
    status?: StatusModeracao,
    apenasAtivos?: boolean, // undefined = não filtrar por ativo
  ) {
    const where: any = {};
    if (proconId) where.procon_id = proconId;
    if (status) where.status_moderacao = status;
    // Só adiciona o filtro de ativo se o valor foi passado explicitamente
    if (apenasAtivos !== undefined) {
      where.ativo = apenasAtivos;
    }

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

    const result = await prisma.pergunta.update({
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

    return result;
  }

  async delete(id: number) {
    return prisma.pergunta.delete({
      where: { Pergunta_ID: id },
    });
  }
}
