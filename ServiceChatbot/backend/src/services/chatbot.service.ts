// src/services/chatbot.service.ts
import { BuscadorProcon, RespostaProcon } from "./buscador.service";
import { ProconInfoIA } from "./llama.service";

const buscador = new BuscadorProcon();

export async function processMessage(
  message: string,
  proconId: number,
  proconInfo: ProconInfoIA,
): Promise<string> {
  try {
    console.log(`📝 Mensagem: "${message}" | Procon: ${proconInfo.nome}`);

    // 1. Verificar palavras-chave de ajuda primeiro
    const msgLower = message.toLowerCase();

    if (msgLower === "ajuda" || msgLower === "help" || msgLower === "socorro") {
      return formatarMenuAjuda(proconInfo);
    }

    if (
      msgLower.includes("menu") ||
      msgLower === "opções" ||
      msgLower === "opcoes"
    ) {
      return formatarMenu();
    }

    // 2. Buscar no RAG (banco de dados)
    const resultadoRAG = await buscador.buscar(message, proconId);

    console.log("📊 Resultado RAG:", {
      confianca: resultadoRAG.confianca,
      score: resultadoRAG.score,
      metodo: resultadoRAG.metodo,
    });

    // 3. Se encontrou no banco, usa a resposta
    if (resultadoRAG.metodo === "banco_dados" && resultadoRAG.resposta) {
      if (resultadoRAG.resposta.length > 10) {
        return formatarResposta(resultadoRAG, proconInfo);
      }
    }

    // 4. Fallback: resposta genérica (sem sugerir WhatsApp)
    return formatarRespostaAjuda(proconInfo);
  } catch (error) {
    console.error("❌ Erro no processMessage:", error);
    return formatarRespostaAjuda(proconInfo);
  }
}

function formatarMenuAjuda(proconInfo: ProconInfoIA): string {
  return (
    `🆘 *Central de Ajuda*\n\n` +
    `Estou aqui para ajudar você com:\n\n` +
    `📌 *1* - Tirar dúvidas sobre direitos do consumidor\n` +
    `📌 *2* - Agendar atendimento presencial\n` +
    `📌 *3* - Consultar meus agendamentos\n` +
    `📌 *4* - Cancelar agendamento\n` +
    `📌 *0* - Sair\n\n` +
    `💡 *Dica:* Você pode digitar o número da opção ou fazer uma pergunta direta, como:\n` +
    `   • "Estão cobrando um seguro no meu cartão"\n` +
    `   • "Qual o horário de funcionamento?"\n\n` +
    `Se preferir atendimento humano, ligue para *${proconInfo.telefone}* ou aguarde, logo um atendente estará disponível.`
  );
}

function formatarResposta(
  resultado: RespostaProcon,
  proconInfo: ProconInfoIA,
): string {
  let resposta = `📌 *${resultado.resposta}*\n\n`;

  // 🔥 CORREÇÃO: Verificar se base_legal existe e é um array
  if (
    resultado.base_legal &&
    Array.isArray(resultado.base_legal) &&
    resultado.base_legal.length > 0
  ) {
    resposta += `📚 *Base legal:* ${resultado.base_legal.join(", ")}\n\n`;
  }

  // 🔥 CORREÇÃO: Verificar se documentos existe e é um array
  if (
    resultado.documentos &&
    Array.isArray(resultado.documentos) &&
    resultado.documentos.length > 0
  ) {
    resposta += `📋 *Documentos necessários:*\n${resultado.documentos.map((d: string) => `• ${d}`).join("\n")}\n\n`;
  }

  if (resultado.observacao) {
    resposta += `ℹ️ *Observação:* ${resultado.observacao}\n\n`;
  }

  resposta += `\n🔙 Digite *0️⃣* para voltar ao menu principal.`;
  return resposta;
}

function formatarRespostaAjuda(proconInfo: ProconInfoIA): string {
  return (
    `❓ *Não consegui entender sua pergunta.*\n\n` +
    `Você pode:\n\n` +
    `1️⃣ - Falar comigo de forma mais clara sobre sua dúvida\n` +
    `2️⃣ - Escolher uma opção do menu digitando o número:\n` +
    `   • 1 - Tirar dúvidas\n` +
    `   • 2 - Agendar atendimento\n` +
    `   • 3 - Consultar agendamentos\n` +
    `   • 4 - Cancelar agendamento\n\n` +
    `3️⃣ - Aguardar um momento para falar com um atendente humano\n\n` +
    `📞 *Atendimento humano:* ${proconInfo.telefone}\n` +
    `🕐 Horário: ${proconInfo.horario_funcionamento}\n\n` +
    `🔙 Digite *0️⃣* para voltar ao menu principal.`
  );
}

function formatarMenu(): string {
  return (
    "📌 *Menu Principal:*\n\n" +
    "1️⃣ - Gostaria de tirar alguma dúvida com o procon?\n" +
    "2️⃣ - Agendar atendimento presencial\n" +
    "3️⃣ - Consultar meus agendamentos\n" +
    "4️⃣ - Cancelar agendamento\n" +
    "0️⃣ - Sair\n\n" +
    "💡 Digite o número da opção desejada."
  );
}
