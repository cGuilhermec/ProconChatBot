// src/services/chatbot.service.ts
import { BuscadorProcon } from "./buscador.service";
import { LlamaService } from "./llama.service";

// cria UMA instância da RAG (reutilizável)
const buscador = new BuscadorProcon();
const llamaService = new LlamaService();

export async function processMessage(message: string): Promise<string> {
  try {
    console.log("📝 Mensagem recebida:", message);

    // 1. Chama a sua RAG
    const resultado = buscador.buscar(message);

    // 2. Log detalhado (ajuda no debug)
    console.log("📊 Resultado RAG:", {
      confianca: resultado.confianca,
      score: resultado.score,
      metodo: resultado.metodo,
      respostaPreview: resultado.resposta.substring(0, 100),
    });

    // 3. Se confiança é ALTA, usa resposta do RAG direto
    if (resultado.confianca === "Alta" && resultado.score > 0.6) {
      console.log("✅ Usando resposta do RAG (confiança alta)");
      return formatarRespostaRAG(resultado);
    }

    // 4. Se confiança é MÉDIA ou BAIXA, chama o Llama (IA local)
    console.log("🤔 Confiança baixa/média, acionando IA Llama...");
    const respostaEnriquecida = await llamaService.enriquecerResposta(
      message,
      resultado,
    );

    return respostaEnriquecida;
  } catch (error) {
    console.error("❌ Erro no processMessage:", error);
    return "⚠️ Desculpe, estou com problemas técnicos. Tente novamente em alguns instantes.";
  }
}

function formatarRespostaRAG(resultado: any): string {
  let resposta = `📌 *${resultado.resposta}*\n\n`;

  if (resultado.base_legal && resultado.base_legal.length > 0) {
    resposta += `📚 *Base legal:* ${resultado.base_legal.join(", ")}\n\n`;
  }

  if (resultado.documentos && resultado.documentos.length > 0) {
    resposta += `📋 *Documentos necessários:*\n${resultado.documentos.map((d: any) => `• ${d}`).join("\n")}\n\n`;
  }

  if (resultado.observacao) {
    resposta += `ℹ️ *Observação:* ${resultado.observacao}\n\n`;
  }

  resposta += `\n🔗 *Fonte:* Procon Jacareí - Banco de Dados Oficial\n`;
  resposta += `📞 Dúvidas? Ligue (12) 3955-1234`;

  return resposta;
}
