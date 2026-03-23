// src/services/llama.service.ts
import axios from "axios";

export class LlamaService {
  private ollamaUrl = "http://localhost:11434/api/generate";
  private modelName = "llama3.2:latest"; // Usando modelo que você tem

  async enriquecerResposta(
    pergunta: string,
    respostaRAG: any,
  ): Promise<string> {
    // Se confiança já é alta, nem chama Llama (economiza tempo)
    if (respostaRAG.confianca === "Alta" && respostaRAG.score > 0.7) {
      console.log("⚡ Usando resposta RAG direta (confiança alta)");
      return respostaRAG.resposta;
    }

    const prompt = `
      Você é um assistente especialista em direitos do consumidor e Procon.
      
      INFORMAÇÃO OFICIAL (do Procon):
      ${respostaRAG.resposta}
      
      Base legal: ${respostaRAG.base_legal?.join(", ") || "Não informada"}
      Documentos: ${respostaRAG.documentos?.join(", ") || "Não informados"}
      
      PERGUNTA DO USUÁRIO: ${pergunta}
      
      INSTRUÇÕES:
      1. Responda de forma CLARA e ACESSÍVEL
      2. Use a informação oficial acima como BASE (NÃO invente)
      3. Seja acolhedor e empático
      4. Mantenha o tom profissional do Procon
      5. Seja CONCISO (máximo 2-3 frases)
      
      RESPOSTA:
    `;

    try {
      console.log(`🤖 Chamando Llama (${this.modelName}) para enriquecer...`);

      const response = await axios.post(
        this.ollamaUrl,
        {
          model: this.modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            num_predict: 200, // Limita resposta a 200 tokens (mais rápido)
          },
        },
        { timeout: 20000 }, // 20 segundos
      );

      console.log("✅ Llama respondeu!");
      return response.data.response;
    } catch (error) {
      console.error("Erro no Llama:", error);
      return respostaRAG.resposta; // Fallback
    }
  }
}
