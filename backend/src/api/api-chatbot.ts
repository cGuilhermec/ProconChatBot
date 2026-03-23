// backend/src/api-chatbot.ts
import express from "express";
import cors from "cors";
import axios from "axios"; // <-- ADICIONAR

const app = express();
const PORT = process.env.PORT || 3001; // <-- MUDAR PORTA (3001)
const API_TECNICA = process.env.API_TECNICA || "http://localhost:3000"; // URL da api.ts

// Middlewares
app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ENDPOINTS PARA O CHATBOT
// ============================================

/**
 * Endpoint principal para o chatbot
 * Aceita QUALQUER mensagem e decide o que fazer
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { mensagem, historico } = req.body;

    if (!mensagem) {
      return res.status(400).json({
        tipo: "erro",
        mensagem: "Mensagem não fornecida",
      });
    }

    // 1. Primeiro: verifica se é saudação
    const saudacao = verificarSaudacao(mensagem);
    if (saudacao) {
      return res.json({
        tipo: "saudacao",
        mensagem: saudacao,
        acoes: ["fazer_pergunta", "ver_temas"],
      });
    }

    // 2. Segundo: verifica se pediu ajuda
    if (
      mensagem.toLowerCase().includes("ajuda") ||
      mensagem.toLowerCase().includes("o que você faz")
    ) {
      return res.json({
        tipo: "ajuda",
        mensagem: gerarMensagemAjuda(),
        acoes: ["ver_temas", "fazer_pergunta"],
      });
    }

    // 3. Terceiro: verifica se pediu temas
    if (
      mensagem.toLowerCase().includes("temas") ||
      mensagem.toLowerCase().includes("assuntos")
    ) {
      // Chamar API técnica para listar temas
      const response = await axios.get(`${API_TECNICA}/api/temas`);
      const temas = response.data.dados;

      return res.json({
        tipo: "lista_temas",
        mensagem: "Aqui estão os principais assuntos que posso ajudar:",
        temas: temas.map((t: any) => ({
          id: t.id,
          titulo: t.tema.replace(/_/g, " "),
          exemplo: t.pergunta.substring(0, 80) + "...",
        })),
      });
    }

    // 4. Quarto: PASSA PARA API TÉCNICA (RAG + LLAMA)
    console.log(`🤖 Enviando para API técnica: "${mensagem}"`);

    const response = await axios.post(`${API_TECNICA}/api/perguntar`, {
      pergunta: mensagem,
      usarLlama: true, // SEMPRE usar Llama para enriquecer
    });

    const dados = response.data.dados;

    // Formata a resposta para o chatbot
    let respostaFormatada = dados.resposta;

    // Se for resposta do Llama, adiciona observação
    if (dados.enriquecido) {
      respostaFormatada += "\n\n✨ *Resposta aprimorada com IA*";
    }

    // Se teve erro no Llama, usa original
    if (dados.llm_error) {
      respostaFormatada = dados.resposta;
    }

    return res.json({
      tipo: "resposta_rag",
      pergunta: mensagem,
      resposta: respostaFormatada,
      base_legal: dados.base_legal,
      documentos: dados.documentos,
      observacao: dados.observacao,
      confianca: dados.confianca,
      score: dados.score,
      sugestoes: gerarSugestoes(dados.metodo),
    });
  } catch (error) {
    console.error("Erro:", error);

    // Fallback se API técnica estiver fora do ar
    return res.status(500).json({
      tipo: "erro",
      mensagem: "Desculpe, tive um problema. Pode repetir? 😊",
    });
  }
});

/**
 * Endpoint para buscar um tema específico
 */
app.get("/api/tema/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const response = await axios.get(`${API_TECNICA}/api/tema/${id}`);
    const tema = response.data.dados;

    res.json({
      tipo: "tema_detalhado",
      tema: tema.tema.replace(/_/g, " "),
      pergunta: tema.pergunta,
      resposta: tema.resposta,
      base_legal: tema.base_legal,
      documentos: tema.documentos,
    });
  } catch (error) {
    res.status(404).json({
      tipo: "erro",
      mensagem: "Tema não encontrado",
    });
  }
});

/**
 * Endpoint para estatísticas
 */
app.get("/api/stats", async (req, res) => {
  try {
    const response = await axios.get(`${API_TECNICA}/api/stats`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao buscar estatísticas",
    });
  }
});

// ============================================
// FUNÇÕES AUXILIARES (MANTIDAS)
// ============================================

function verificarSaudacao(mensagem: string): string | null {
  const msgLower = mensagem.toLowerCase().trim();

  const saudacoes = [
    { chave: "ola", resposta: "Olá! 👋 Como posso ajudar você hoje?" },
    { chave: "olá", resposta: "Olá! 👋 Como posso ajudar você hoje?" },
    { chave: "oi", resposta: "Oi! 😊 Em que posso ser útil?" },
    { chave: "oie", resposta: "Oi! 😊 Em que posso ser útil?" },
    { chave: "bom dia", resposta: "Bom dia! ☀️ Como posso auxiliar?" },
    { chave: "boa tarde", resposta: "Boa tarde! 🌤️ O que você precisa?" },
    { chave: "boa noite", resposta: "Boa noite! 🌙 Estou aqui para ajudar!" },
    { chave: "e ai", resposta: "E aí! 👋 Pronto para tirar suas dúvidas!" },
    { chave: "e aí", resposta: "E aí! 👋 Pronto para tirar suas dúvidas!" },
    { chave: "ae", resposta: "E aí! 👋 Como posso ajudar?" },
    { chave: "opa", resposta: "Opa! 👋 Tudo bem?" },
    {
      chave: "tudo bem",
      resposta: "Tudo bem sim! E com você? Como posso ajudar?",
    },
    { chave: "tudo bom", resposta: "Tudo bom! Como posso ajudar?" },
    { chave: "beleza", resposta: "Beleza! 😎 Como posso ajudar?" },
    { chave: "tranquilo", resposta: "Tranquilo! Como posso ajudar?" },
    {
      chave: "ajuda",
      resposta: "Claro! Estou aqui para ajudar. Sobre o que você precisa?",
    },
    { chave: "me ajuda", resposta: "Claro! Me diga qual é a sua dúvida." },
    {
      chave: "socorro",
      resposta: "Calma! Vou ajudar. Me conte o que aconteceu.",
    },
    {
      chave: "começar",
      resposta: "Vamos começar! Sobre o que você quer saber?",
    },
    { chave: "iniciar", resposta: "Iniciando atendimento! Como posso ajudar?" },
  ];

  for (const { chave, resposta } of saudacoes) {
    if (msgLower.includes(chave)) {
      return resposta;
    }
  }

  if (msgLower.length <= 3 && isNaN(Number(msgLower))) {
    return "Olá! 👋 Como posso ajudar?";
  }

  return null;
}

function gerarMensagemAjuda(): string {
  return `🤖 **Assistente Procon**

Posso ajudar com:
• 📝 Cobranças indevidas
• 💳 Empréstimos não contratados
• 📱 Cancelamento de planos
• 📄 Contratos e multas
• 🏦 Descontos em benefícios

**Como perguntar:**
Seja direto, como se estivesse falando com um atendente.

**Exemplos:**
• "Estão cobrando seguro no cartão"
• "Desconto de empréstimo no INSS"
• "Quero cancelar meu plano de telefone"`;
}

function gerarSugestoes(metodo: string): string[] {
  if (metodo === "fallback") {
    return [
      "Tente ser mais específico",
      "Use palavras como: cobrança, seguro, empréstimo, cancelamento",
      "Digite 'temas' para ver todos os assuntos",
    ];
  }

  return [
    "Precisa de mais detalhes?",
    "Digite 'temas' para ver outros assuntos",
    "Pode fazer outra pergunta",
  ];
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Chatbot WhatsApp rodando em http://localhost:${PORT}`);
  console.log(`📡 Conectado à API técnica: ${API_TECNICA}`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /api/chat - Para o chatbot`);
  console.log(`   GET  /api/tema/:id - Detalhe de um tema`);
  console.log(`   GET  /api/stats - Estatísticas`);
});
