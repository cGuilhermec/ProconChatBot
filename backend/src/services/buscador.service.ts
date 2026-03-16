// src/services/buscador.service.ts
import * as natural from "natural";
import Fuse from "fuse.js";
import proconData from "../data/procon_base_rag.json";
import {
  ProconItem,
  ResultadoBusca,
  KeywordIndex,
  RespostaProcon,
} from "../types/procon.types";

export class BuscadorProcon {
  private data: ProconItem[];
  private tokenizer: natural.WordTokenizer;
  private stemmer: typeof natural.PorterStemmerPt;
  private fuse: Fuse<ProconItem>;
  private keywordIndex: KeywordIndex;

  constructor() {
    this.data = proconData as ProconItem[];
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmerPt;

    // Configurar Fuse.js para busca difusa
    this.fuse = new Fuse(this.data, {
      keys: [
        { name: "pergunta", weight: 0.5 },
        { name: "tema", weight: 0.3 },
        { name: "resposta", weight: 0.2 },
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      useExtendedSearch: true,
      ignoreFieldNorm: true,
    });

    this.keywordIndex = this.buildKeywordIndex();
  }

  /**
   * Método principal de busca RAG
   * @param pergunta Pergunta do usuário
   * @returns Resultado da busca com a resposta mais relevante
   */
  public buscar(pergunta: string): RespostaProcon {
    const perguntaLower = pergunta.toLowerCase();

    // Estratégia 1: Busca por palavras-chave
    const keywordMatch = this.buscarPorPalavrasChave(perguntaLower);
    if (keywordMatch && keywordMatch.score > 0.2) {
      return this.formatarResposta(pergunta, keywordMatch);
    }

    // Estratégia 2: Busca difusa com Fuse.js
    const fuseMatch = this.buscarDifusa(pergunta);
    if (fuseMatch && fuseMatch.score < 0.4) {
      return this.formatarResposta(pergunta, fuseMatch);
    }

    // Estratégia 3: Fallback - retorna o item mais genérico
    return this.formatarResposta(pergunta, {
      item: this.data[0],
      score: 0,
      metodo: "fallback",
      confianca: "Baixa",
    });
  }

  /**
   * Busca por palavras-chave com stemming (VERSÃO CORRIGIDA)
   */
  private buscarPorPalavrasChave(pergunta: string): ResultadoBusca | null {
    // Extrair palavras importantes
    const palavrasImportantes = this.extrairPalavrasImportantes(pergunta);

    // Se não tem palavras importantes, retorna null (vai para busca difusa)
    if (palavrasImportantes.length === 0) {
      return null;
    }

    // Stemming nas palavras
    const palavrasStemmed = palavrasImportantes.map((p) =>
      this.stemmer.stem(p),
    );

    // Pontuar cada item
    const pontuacoes: { item: ProconItem; score: number }[] = this.data.map(
      (item) => {
        const textoTema = item.tema.replace(/_/g, " ");
        const textoPergunta = item.pergunta.toLowerCase();
        const textoCompleto = `${textoTema} ${textoPergunta}`;

        let score = 0;
        let maxScorePossivel = 0;

        for (const palavra of palavrasStemmed) {
          maxScorePossivel += 3; // Máximo possível: 1 (match) + 2 (keyword)

          // Match simples no texto
          if (textoCompleto.includes(palavra)) {
            score += 1;
          }

          // Verificar no índice de palavras-chave (match exato ou parcial)
          for (const [key, ids] of Object.entries(this.keywordIndex)) {
            // Verifica se a palavra está contida na chave OU a chave está contida na palavra
            if (
              (palavra.includes(key) || key.includes(palavra)) &&
              ids.includes(item.id)
            ) {
              score += 2; // Peso maior para palavras-chave
            }
          }
        }

        // Normalizar score entre 0 e 1
        const scoreNormalizado =
          maxScorePossivel > 0 ? score / maxScorePossivel : 0;

        return { item, score: scoreNormalizado };
      },
    );

    // Ordenar por score (maior para menor)
    pontuacoes.sort((a, b) => b.score - a.score);

    // Log para debug (remova em produção)
    if (pontuacoes[0].score > 0) {
      console.log(
        `🔍 Melhor match: ID ${pontuacoes[0].item.id} - Score: ${pontuacoes[0].score}`,
      );
    }

    // Retorna se tiver score mínimo
    if (pontuacoes[0].score > 0.15) {
      // Threshold mais baixo
      return {
        item: pontuacoes[0].item,
        score: pontuacoes[0].score,
        metodo: "palavras_chave",
        confianca: pontuacoes[0].score > 0.5 ? "Alta" : "Média",
      };
    }

    return null;
  }

  /**
   * Busca difusa usando Fuse.js
   */
  private buscarDifusa(pergunta: string): ResultadoBusca | null {
    const resultados = this.fuse.search(pergunta);

    if (resultados.length > 0) {
      const melhor = resultados[0];
      return {
        item: melhor.item,
        score: melhor.score || 1,
        metodo: "fuse",
        confianca: (melhor.score || 1) < 0.3 ? "Alta" : "Média",
      };
    }

    return null;
  }

  /**
   * Extrai palavras importantes removendo stopwords
   */
  private extrairPalavrasImportantes(texto: string): string[] {
    const palavras = this.tokenizer.tokenize(texto) || [];

    // Stopwords em português
    const stopwords = new Set([
      "um",
      "uma",
      "o",
      "a",
      "os",
      "as",
      "de",
      "do",
      "da",
      "dos",
      "das",
      "em",
      "no",
      "na",
      "nos",
      "nas",
      "para",
      "por",
      "com",
      "sem",
      "sob",
      "sobre",
      "apos",
      "ate",
      "estao",
      "esta",
      "isso",
      "isto",
      "aquele",
      "aquela",
      "eles",
      "elas",
      "nos",
      "vos",
      "meu",
      "minha",
      "seu",
      "sua",
      "que",
      "qual",
      "quais",
      "quem",
      "como",
      "quando",
      "onde",
      "porque",
      "posso",
      "fazer",
      "devo",
      "pode",
      "tem",
      "sao",
      "era",
      "foi",
    ]);

    return palavras.filter(
      (p: any) =>
        !stopwords.has(p.toLowerCase()) && // Remove palavras que estão na lista de stopwords (palavras comuns que não ajudam na busca)
        p.length > 2 && // Mantém apenas palavras com mais de 2 caracteres (remove artigos, preposições curtas)
        isNaN(Number(p)), // Remove números (ex: "123", "10") - isNaN retorna true se NÃO for número
    );
  }

  /**
   * Constrói índice de palavras-chave
   */
  private buildKeywordIndex(): KeywordIndex {
    return {
      cobranca: [1, 2, 3, 6],
      cobrando: [1, 2, 3, 6],
      cobram: [1, 2, 3, 6],
      cobraram: [1, 2, 3, 6],
      cobra: [1, 2, 3, 6],

      // SEGURO - VERSÃO SUPER REFORÇADA
      seguro: [1],
      segura: [1],
      segur: [1], // radical
      segro: [1], // erro comum
      seg: [1], // parte ainda menor
      se: [1], // (cuidado, pode dar falso positivo)

      // Adicionar variações fonéticas
      segu: [1],
      segurou: [1],
      seguros: [1],

      // CARTAO
      cartao: [1],
      cartão: [1],
      carta: [1],
      cart: [1],

      credito: [1],
      crédito: [1],

      emprestimo: [2, 3],
      quitado: [2],
      desconto: [2, 3, 6],
      descontando: [2, 3, 6],
      folha: [2],
      pagamento: [2],
      beneficio: [3, 6],
      inss: [3, 6],
      contrato: [4, 9],
      recusa: [4],
      entregar: [4],
      cancelar: [5, 9],
      cancelamento: [5, 9],
      telefone: [5],
      plano: [5],
      multa: [9],
      rmc: [6],
      rcc: [6],
      consignado: [3, 6],
    };
  }

  /**
   * Formata a resposta para o usuário
   */
  private formatarResposta(
    pergunta: string,
    resultado: ResultadoBusca,
  ): RespostaProcon {
    return {
      pergunta,
      resposta: resultado.item.resposta,
      base_legal: resultado.item.base_legal,
      documentos: resultado.item.documentos,
      observacao: resultado.item.observacao,
      confianca: resultado.confianca,
      metodo: resultado.metodo,
      score: resultado.score,
    };
  }

  /**
   * Método utilitário para buscar por ID
   */
  public buscarPorId(id: number): ProconItem | undefined {
    return this.data.find((item) => item.id === id);
  }

  /**
   * Retorna todos os temas disponíveis
   */
  public listarTemas(): { id: number; tema: string; pergunta: string }[] {
    return this.data.map((item) => ({
      id: item.id,
      tema: item.tema,
      pergunta: item.pergunta,
    }));
  }
}
