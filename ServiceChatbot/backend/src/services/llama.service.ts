// src/services/llama.service.ts
import axios from "axios";

export interface ProconInfoIA {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  endereco: string;
  telefone: string;
  email: string;
  horario_funcionamento: string;
  whatsapp_number: string;
}

export class LlamaService {
  private ollamaUrl = "http://localhost:11434/api/generate";
  private modelName = "tinyllama:1.1b-chat";

  async enriquecerResposta(
    pergunta: string,
    respostaRAG: any,
    proconInfo: ProconInfoIA,
  ): Promise<string> {
    console.log(`🤖 IA chamada para Procon: ${proconInfo.nome}`);

    const perguntaLower = pergunta.toLowerCase().trim();

    // ✅ 1. PERGUNTAS SOBRE O ROBÔ/ASSISTENTE
    if (
      perguntaLower === "qual é o seu nome?" ||
      perguntaLower === "qual o seu nome?" ||
      perguntaLower === "quem é você?" ||
      perguntaLower === "quem é voce?" ||
      perguntaLower.includes("seu nome")
    ) {
      return `Olá! Eu sou o assistente virtual do ${proconInfo.nome}. Fui criado para ajudar os cidadãos de ${proconInfo.cidade} com informações sobre direitos do consumidor, agendamentos e orientações. Como posso ajudá-lo hoje?`;
    }

    // ✅ 2. PERGUNTAS SOBRE CAPACIDADES
    if (
      perguntaLower.includes("o que você pode fazer") ||
      perguntaLower.includes("como você pode ajudar") ||
      perguntaLower.includes("suas funções")
    ) {
      return (
        `Posso ajudar você com:\n\n` +
        `📌 *Informações sobre direitos do consumidor*\n` +
        `📌 *Agendamentos presenciais*\n` +
        `📌 *Consulta de agendamentos*\n` +
        `📌 *Cancelamento de agendamentos*\n` +
        `📌 *Horário, endereço e contato do ${proconInfo.nome}*\n\n` +
        `Para começar, digite o número da opção desejada no menu.`
      );
    }

    // ✅ 3. AGRADECIMENTOS
    if (
      perguntaLower.includes("obrigado") ||
      perguntaLower.includes("valeu") ||
      perguntaLower.includes("gratidão") ||
      perguntaLower.includes("obrigada")
    ) {
      return `Por nada! Fico feliz em ajudar. Se precisar de mais alguma informação sobre o ${proconInfo.nome}, é só chamar. Tenha um ótimo dia! 😊`;
    }

    // ✅ 4. SAUDAÇÕES
    if (
      perguntaLower.includes("oi") ||
      perguntaLower.includes("olá") ||
      perguntaLower.includes("ola") ||
      perguntaLower.includes("bom dia") ||
      perguntaLower.includes("boa tarde") ||
      perguntaLower.includes("boa noite")
    ) {
      return `Olá! Sou o assistente virtual do ${proconInfo.nome}. Como posso ajudá-lo hoje? Digite o número da opção desejada no menu.`;
    }

    // ✅ 5. PERGUNTAS SOBRE TUDO BEM
    if (
      perguntaLower.includes("tudo bem") ||
      perguntaLower.includes("como vai")
    ) {
      return `Tudo bem sim, obrigado! Estou pronto para ajudar com questões sobre o ${proconInfo.nome}. Em que posso ser útil?`;
    }

    // ✅ 6. CASOS DE VIOLÊNCIA/AGRESSÃO
    if (
      perguntaLower.includes("bateram") ||
      perguntaLower.includes("agressão") ||
      perguntaLower.includes("agressao") ||
      perguntaLower.includes("violência") ||
      perguntaLower.includes("violencia") ||
      perguntaLower.includes("espancaram") ||
      perguntaLower.includes("socorro") ||
      perguntaLower.includes("urgente")
    ) {
      return (
        `⚠️ *ATENDIMENTO DE URGÊNCIA*\n\n` +
        `Sinto muito pelo que você está passando. Se você está em situação de violência ou risco imediato, ligue para:\n\n` +
        `🚨 *190* - Polícia Militar (emergência)\n` +
        `🚨 *180* - Central de Atendimento à Mulher (violência doméstica)\n` +
        `🚨 *Disque 100* - Direitos Humanos\n\n` +
        `O ${proconInfo.nome} atende apenas questões relacionadas a direitos do consumidor.`
      );
    }

    // ✅ 7. SAÚDE MENTAL
    if (
      perguntaLower.includes("depressão") ||
      perguntaLower.includes("depressao") ||
      perguntaLower.includes("ansiedade") ||
      perguntaLower.includes("suicídio") ||
      perguntaLower.includes("triste") ||
      perguntaLower.includes("desespero")
    ) {
      return (
        `💙 *Apoio Emocional*\n\n` +
        `Se você está passando por um momento difícil, saiba que não está sozinho:\n\n` +
        `📞 *CVV (Centro de Valorização da Vida)*: 188 - 24 horas (ligação gratuita)\n` +
        `🌐 Site: www.cvv.org.br - chat online\n\n` +
        `O ${proconInfo.nome} não é especializado em saúde mental, mas podemos ajudar com direitos do consumidor se precisar.`
      );
    }

    // ✅ 8. PERGUNTAS SOBRE O PROCON
    if (
      perguntaLower.includes("horário") ||
      perguntaLower.includes("horario") ||
      perguntaLower.includes("abre") ||
      perguntaLower.includes("funcionamento")
    ) {
      return `O ${proconInfo.nome} funciona de ${proconInfo.horario_funcionamento}. Telefone: ${proconInfo.telefone}`;
    }

    if (
      perguntaLower.includes("endereço") ||
      perguntaLower.includes("endereco") ||
      perguntaLower.includes("onde fica") ||
      perguntaLower.includes("localização")
    ) {
      return `O ${proconInfo.nome} fica na ${proconInfo.endereco}. Telefone: ${proconInfo.telefone}`;
    }

    if (
      perguntaLower.includes("telefone") ||
      perguntaLower.includes("contato") ||
      perguntaLower.includes("whatsapp") ||
      perguntaLower.includes("ligar")
    ) {
      return `Contato ${proconInfo.nome}: Telefone ${proconInfo.telefone} | WhatsApp ${proconInfo.whatsapp_number}`;
    }

    if (
      perguntaLower.includes("estacionamento") ||
      perguntaLower.includes("estacionar")
    ) {
      return `Sobre estacionamento no ${proconInfo.nome}: Recomendamos ligar antecipadamente pelo telefone ${proconInfo.telefone} para confirmar a disponibilidade de vagas.`;
    }

    if (
      perguntaLower.includes("documento") ||
      perguntaLower.includes("rg") ||
      perguntaLower.includes("cpf") ||
      perguntaLower.includes("levar")
    ) {
      return `Para atendimento no ${proconInfo.nome}, leve RG, CPF, comprovante de residência e documentos relacionados à sua reclamação. Telefone: ${proconInfo.telefone}`;
    }

    // ✅ 9. RESPOSTA PADRÃO (sem tentar chamar a IA)
    console.log("📞 Pergunta não identificada, usando resposta padrão");

    return (
      `Desculpe, não entendi completamente sua pergunta.\n\n` +
      `Você pode escolher uma das opções do menu:\n\n` +
      `1️⃣ - Tirar dúvidas\n` +
      `2️⃣ - Agendar atendimento\n` +
      `3️⃣ - Consultar agendamentos\n` +
      `4️⃣ - Cancelar agendamento\n` +
      `0️⃣ - Sair\n\n` +
      `Ou entre em contato diretamente:\n` +
      `📞 Telefone: ${proconInfo.telefone}\n` +
      `💬 WhatsApp: ${proconInfo.whatsapp_number}`
    );
  }
}
