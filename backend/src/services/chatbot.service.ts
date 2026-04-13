// Esse service centraliza a lógica do chatbot
// Tudo que for "inteligência" fica aqui
import { BuscadorProcon } from "./buscador.service";

// cria UMA instância da RAG (reutilizável)
const buscador = new BuscadorProcon();

export async function processMessage(message: string): Promise<string> {

  // chama a sua RAG
  const resultado = buscador.buscar(message);

  // log (opcional - ajuda muito no debug)
  console.log("📊 Resultado RAG:", resultado);

  // você decide como responder
  if (resultado.confianca === "Baixa") {
    return "Não tenho certeza sobre isso 🤔, mas posso tentar ajudar melhor se você reformular.";
  }

  // resposta principal
  return `
📌 ${resultado.resposta}

📎 Base legal: ${resultado.base_legal}
  `;
}