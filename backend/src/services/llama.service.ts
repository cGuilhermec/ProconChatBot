// src/services/llama.service.ts
import axios from "axios";
import { proconJacareiInfo } from "../data/procon_jacarei";

export class LlamaService {
  private ollamaUrl = "http://localhost:11434/api/generate";
  private modelName = "llama3.2:latest";

  async enriquecerResposta(
    pergunta: string,
    respostaRAG: any,
  ): Promise<string> {
    // Se confiança já é alta, usa RAG direto
    if (respostaRAG.confianca === "Alta" && respostaRAG.score > 0.7) {
      console.log("⚡ Usando resposta RAG direta (confiança alta)");
      return respostaRAG.resposta;
    }

    // Determina o tipo de pergunta para dar contexto específico
    const perguntaLower = pergunta.toLowerCase();
    let contextoEspecifico = "";

    if (
      perguntaLower.includes("horário") ||
      perguntaLower.includes("funcionamento")
    ) {
      contextoEspecifico = `
      INFORMAÇÕES ESPECÍFICAS DO PROCON JACAREÍ:
      • Horário de funcionamento: ${proconJacareiInfo.horarioFuncionamento}
      • Endereço: ${proconJacareiInfo.endereco}
      • Telefone: ${proconJacareiInfo.telefone}
      • WhatsApp: ${proconJacareiInfo.whatsapp}
      • E-mail: ${proconJacareiInfo.email}
      • Site: ${proconJacareiInfo.site}
      `;
    } else if (
      perguntaLower.includes("endereço") ||
      perguntaLower.includes("onde fica")
    ) {
      contextoEspecifico = `
      ENDEREÇO DO PROCON JACAREÍ:
      • ${proconJacareiInfo.endereco}
      • Atendimento presencial: ${proconJacareiInfo.atendimentoPresencial}
      `;
    } else if (
      perguntaLower.includes("documento") ||
      perguntaLower.includes("precisa")
    ) {
      contextoEspecifico = `
      DOCUMENTOS NECESSÁRIOS (Procon Jacareí):
      ${proconJacareiInfo.documentosNecessarios.map((doc) => `• ${doc}`).join("\n")}
      `;
    }

    const prompt = `
      Você é um assistente virtual do PROCON JACAREÍ/SP. 
      Sua função é ajudar os cidadãos de Jacareí com informações sobre direitos do consumidor e serviços do Procon.
      
      ${contextoEspecifico}
      
      INFORMAÇÃO DA BASE DE DADOS DO PROCON:
      ${respostaRAG.resposta}
      
      Base legal: ${respostaRAG.base_legal?.join(", ") || "Não informada"}
      Documentos: ${respostaRAG.documentos?.join(", ") || "Não informados"}
      
      PERGUNTA DO USUÁRIO: ${pergunta}
      
      INSTRUÇÕES IMPORTANTES:
      1. SEMPRE priorize as informações do PROCON JACAREÍ quando disponíveis
      2. Para perguntas sobre horário, endereço ou contato, use APENAS os dados oficiais do Procon Jacareí
      3. Seja acolhedor e mantenha o tom profissional
      4. Para dúvidas jurídicas, use a base de dados do Procon
      5. Se não souber algo, informe que pode entrar em contato pelo telefone ${proconJacareiInfo.telefone}
      6. Seja CONCISO (máximo 2-3 frases)
      
      RESPOSTA:
    `;

    try {
      console.log(`🤖 Chamando Llama com contexto de Jacareí...`);

      const response = await axios.post(
        this.ollamaUrl,
        {
          model: this.modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
            num_predict: 200,
          },
        },
        { timeout: 15000 },
      );

      console.log("✅ Llama respondeu com informações de Jacareí!");
      return response.data.response;
    } catch (error) {
      console.error("❌ Erro no Llama:", error);
      // Fallback com informações de Jacareí
      return this.getJacareiFallback(pergunta);
    }
  }

  private getJacareiFallback(pergunta: string): string {
    const perguntaLower = pergunta.toLowerCase();

    if (
      perguntaLower.includes("horário") ||
      perguntaLower.includes("funcionamento")
    ) {
      return `O Procon Jacareí funciona de ${proconJacareiInfo.horarioFuncionamento}, na ${proconJacareiInfo.endereco}. Para mais informações, ligue ${proconJacareiInfo.telefone}.`;
    }

    if (
      perguntaLower.includes("endereço") ||
      perguntaLower.includes("onde fica")
    ) {
      return `O Procon Jacareí fica na ${proconJacareiInfo.endereco}. Atendimento presencial de ${proconJacareiInfo.horarioFuncionamento}.`;
    }

    if (
      perguntaLower.includes("telefone") ||
      perguntaLower.includes("contato")
    ) {
      return `Você pode contatar o Procon Jacareí pelo telefone ${proconJacareiInfo.telefone}, WhatsApp ${proconJacareiInfo.whatsapp} ou e-mail ${proconJacareiInfo.email}.`;
    }

    return `Para mais informações, entre em contato com o Procon Jacareí pelo telefone ${proconJacareiInfo.telefone} ou visite o site ${proconJacareiInfo.site}.`;
  }
}
