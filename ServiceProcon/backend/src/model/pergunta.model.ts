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

  // src/model/pergunta.model.ts

  async buscarPorSimilaridade(proconId: number, termo: string) {
    const termoLower = termo.toLowerCase();
    console.log(`🔍 Buscando por termo: "${termoLower}"`);

    // Extrair palavras-chave (ignorando stop words)
    const stopWords = [
      "o",
      "a",
      "os",
      "as",
      "um",
      "uma",
      "uns",
      "umas",
      "de",
      "da",
      "do",
      "das",
      "dos",
      "em",
      "no",
      "na",
      "nos",
      "nas",
      "para",
      "com",
      "por",
      "um",
      "uma",
      "tem",
      "ter",
      "há",
      "ha",
      "como",
      "que",
      "qual",
      "quais",
      "onde",
      "quando",
      "sera",
      "pode",
      "poder",
      "poderia",
      "ser",
      "estar",
      "está",
      "estao",
      "estão",
      "e",
      "é",
      "aqui",
      "ali",
      "la",
      "lá",
      "o que",
      "isso",
      "aquilo",
      "este",
      "esse",
      "aquele",
    ];

    const palavrasChave = termoLower
      .split(/\s+/)
      .filter(
        (p) => p.length > 2 && !stopWords.includes(p) && !p.match(/^\d+$/),
      );

    console.log(`📝 Palavras-chave extraídas:`, palavrasChave);

    // Buscar todas as perguntas ativas
    const todasPerguntas = await prisma.pergunta.findMany({
      where: {
        procon_id: proconId,
        ativo: true,
        status_moderacao: "APROVADO",
      },
    });

    console.log(`📊 Total de perguntas encontradas: ${todasPerguntas.length}`);

    // Calcular score de similaridade com pesos melhorados
    const resultados = todasPerguntas.map((pergunta) => {
      let score = 0;
      const perguntaLower = pergunta.pergunta.toLowerCase();
      const temaLower = pergunta.tema.toLowerCase();
      const respostaLower = pergunta.resposta.toLowerCase();

      // 1. Match exato da frase completa (mais importante)
      if (temaLower === termoLower) {
        score += 100;
      }
      if (perguntaLower === termoLower) {
        score += 80;
      }

      // 2. Contém a frase completa
      if (temaLower.includes(termoLower)) {
        score += 60;
      }
      if (perguntaLower.includes(termoLower)) {
        score += 50;
      }
      if (respostaLower.includes(termoLower)) {
        score += 30;
      }

      // 3. Match de palavras-chave (com pesos)
      let matchCount = 0;
      for (const palavra of palavrasChave) {
        if (palavra.length < 3) continue;

        // Match no tema (mais importante)
        if (temaLower.includes(palavra)) {
          score += 25;
          matchCount++;
        }
        // Match na pergunta
        else if (perguntaLower.includes(palavra)) {
          score += 15;
          matchCount++;
        }
        // Match na resposta
        else if (respostaLower.includes(palavra)) {
          score += 10;
          matchCount++;
        }
      }

      // 4. Bônus por proporção de match (quantas palavras-chave foram encontradas)
      if (palavrasChave.length > 0) {
        const proporcao = matchCount / palavrasChave.length;
        score += proporcao * 40; // Bônus de até 40 pontos
      }

      // 5. Bônus para perguntas que têm tema relacionado
      const temasRelevantes = this.extrairTemasRelevantes(termoLower);
      for (const tema of temasRelevantes) {
        if (temaLower.includes(tema)) {
          score += 20;
        }
      }

      return { ...pergunta, score };
    });

    // Ordenar por score e filtrar apenas com score > 0
    resultados.sort((a, b) => b.score - a.score);

    // Definir threshold mínimo baseado no tamanho da consulta
    const threshold = termoLower.length > 10 ? 20 : 10;
    const melhores = resultados.filter((r) => r.score >= threshold).slice(0, 5);

    // Log para debugging
    console.log("📊 Resultados com scores:");
    melhores.forEach((r) => {
      console.log(`   - ${r.tema}: ${r.score} pontos`);
    });

    // Se não encontrou nada relevante, retorna array vazio
    if (melhores.length === 0) {
      console.log(`⚠️ Nenhum resultado relevante encontrado para: "${termo}"`);
    }

    return melhores;
  }

  private extrairTemasRelevantes(frase: string): string[] {
    const temasMap: Record<string, string[]> = {
      estacionamento: [
        "estacionamento",
        "vaga",
        "parking",
        "carro",
        "veículo",
        "estacionar",
      ],
      reclamação: [
        "reclamação",
        "reclamar",
        "denúncia",
        "denunciar",
        "queixa",
        "problema",
      ],
      cancelamento: [
        "cancelamento",
        "cancelar",
        "desistir",
        "suspender",
        "cancelamento de contrato",
      ],
      garantia: ["garantia", "defeito", "troca", "conserto", "reparo", "vício"],
      prazo: ["prazo", "dias", "data", "vencimento", "período"],
      devolução: [
        "devolução",
        "devolver",
        "reembolso",
        "estorno",
        "dinheiro de volta",
      ],
      contrato: ["contrato", "cláusula", "termo", "condição", "fidelidade"],
      internet: ["internet", "banda larga", "wi-fi", "velocidade", "fibra"],
      telefone: ["telefone", "celular", "ligação", "operadora", "plano"],
      "plano de saúde": [
        "plano de saúde",
        "saúde",
        "médico",
        "hospital",
        "consulta",
      ],
    };

    const temasEncontrados: string[] = [];
    for (const [tema, palavras] of Object.entries(temasMap)) {
      for (const palavra of palavras) {
        if (frase.includes(palavra)) {
          temasEncontrados.push(tema);
          break;
        }
      }
    }

    return temasEncontrados;
  }

  async buscarPorSimilaridadeSQL(proconId: number, termo: string) {
    // Usa pg_trgm para similaridade (requer extensão)
    const query = `
    SELECT *, 
      GREATEST(
        similarity(tema, $1),
        similarity(pergunta, $1),
        similarity(resposta, $1)
      ) as score
    FROM perguntas
    WHERE procon_id = $2
      AND ativo = true
      AND status_moderacao = 'APROVADO'
      AND GREATEST(
        similarity(tema, $1),
        similarity(pergunta, $1),
        similarity(resposta, $1)
      ) > 0.1
    ORDER BY score DESC
    LIMIT 5
  `;

    const resultados = await prisma.$queryRaw`${query}`;
    return resultados;
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
