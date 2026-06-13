// src/services/buscador.service.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:3002";

export interface RespostaProcon {
  pergunta: string;
  resposta: string;
  base_legal: any[];
  documentos: any[];
  observacao: string;
  confianca: "Alta" | "Média" | "Baixa";
  score: number;
  metodo: string;
}

export class BuscadorProcon {
  async buscar(pergunta: string, proconId: number): Promise<RespostaProcon> {
    console.log(
      `🔍 Buscando no banco - Procon ID: ${proconId}, Pergunta: "${pergunta}"`,
    );

    try {
      const response = await axios.post(
        `${API_BASE_URL}/perguntas/buscar`,
        {
          procon_id: proconId,
          pergunta: pergunta,
        },
        { timeout: 10000 },
      );

      const result = response.data;

      if (result.sucesso && result.resultados && result.resultados.length > 0) {
        const melhorMatch = result.resultados[0];

        console.log(`✅ Encontrado no banco: ID ${melhorMatch.Pergunta_ID}`);

        // 🔥 CORREÇÃO: Garantir que base_legal e documentos sejam arrays
        const baseLegal = melhorMatch.base_legal;
        const documentos = melhorMatch.documentos;

        const baseLegalArray = Array.isArray(baseLegal)
          ? baseLegal
          : baseLegal &&
              typeof baseLegal === "object" &&
              Object.keys(baseLegal).length > 0
            ? Object.values(baseLegal)
            : [];

        const documentosArray = Array.isArray(documentos)
          ? documentos
          : documentos &&
              typeof documentos === "object" &&
              Object.keys(documentos).length > 0
            ? Object.values(documentos)
            : [];

        const score = this.calcularSimilaridade(pergunta, melhorMatch.pergunta);

        return {
          pergunta: pergunta,
          resposta: melhorMatch.resposta,
          base_legal: baseLegalArray,
          documentos: documentosArray,
          observacao: melhorMatch.observacao || "",
          confianca: score > 0.6 ? "Alta" : score > 0.4 ? "Média" : "Baixa",
          score: score,
          metodo: "banco_dados",
        };
      }

      console.log("⚠️ Nenhum resultado encontrado no banco");
      return {
        pergunta: pergunta,
        resposta: "",
        base_legal: [],
        documentos: [],
        observacao: "",
        confianca: "Baixa",
        score: 0,
        metodo: "sem_resultado",
      };
    } catch (error: any) {
      console.error("❌ Erro ao buscar no banco:", error.message);
      return {
        pergunta: pergunta,
        resposta: "",
        base_legal: [],
        documentos: [],
        observacao: "",
        confianca: "Baixa",
        score: 0,
        metodo: "erro_conexao",
      };
    }
  }

  private calcularSimilaridade(
    perguntaUsuario: string,
    perguntaBanco: string,
  ): number {
    // Cálculo simples de similaridade
    const usuarioLower = perguntaUsuario.toLowerCase();
    const bancoLower = perguntaBanco.toLowerCase();

    let score = 0;
    const palavrasUsuario = usuarioLower.split(/\s+/);

    for (const palavra of palavrasUsuario) {
      if (palavra.length > 3 && bancoLower.includes(palavra)) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0);
  }
}
