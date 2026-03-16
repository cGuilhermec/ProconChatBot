// backend/src/api-chatbot.ts
import express from "express";
import cors from "cors";
import { BuscadorProcon } from "../services/buscador.service";


const app = express();
const buscador = new BuscadorProcon();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Libera para o frontend acessar
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
      const temas = buscador.listarTemas();
      return res.json({
        tipo: "lista_temas",
        mensagem: "Aqui estão os principais assuntos que posso ajudar:",
        temas: temas.map((t) => ({
          id: t.id,
          titulo: t.tema.replace(/_/g, " "),
          exemplo: t.pergunta.substring(0, 80) + "...",
        })),
      });
    }

    // 4. Quarto: PASSA PARA O RAG (qualquer outra coisa)
    const resposta = buscador.buscar(mensagem);

    // Formata a resposta para o chatbot
    return res.json({
      tipo: "resposta_rag",
      pergunta: mensagem,
      resposta: resposta.resposta,
      base_legal: resposta.base_legal,
      documentos: resposta.documentos,
      observacao: resposta.observacao,
      confianca: resposta.confianca,
      score: resposta.score,
      // Dicas de acompanhamento
      sugestoes: gerarSugestoes(resposta.metodo),
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({
      tipo: "erro",
      mensagem: "Desculpe, tive um problema. Pode repetir?",
    });
  }
});

/**
 * Endpoint para buscar um tema específico
 */
app.get("/api/tema/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const tema = buscador.buscarPorId(id);

  if (!tema) {
    return res.status(404).json({
      tipo: "erro",
      mensagem: "Tema não encontrado",
    });
  }

  res.json({
    tipo: "tema_detalhado",
    tema: tema.tema.replace(/_/g, " "),
    pergunta: tema.pergunta,
    resposta: tema.resposta,
    base_legal: tema.base_legal,
    documentos: tema.documentos,
  });
});

/**
 * Endpoint para estatísticas
 */
app.get("/api/stats", (req, res) => {
  const temas = buscador.listarTemas();
  res.json({
    total_temas: temas.length,
    versao: "1.0.0",
    status: "online",
  });
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function verificarSaudacao(mensagem: string): string | null {
  const msgLower = mensagem.toLowerCase().trim();

  // Lista expandida de saudações (igual ao teste)
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

  // Mensagens muito curtas (provavelmente saudações)
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
  console.log(`🚀 API do Chatbot rodando em http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /api/chat - Para o chatbot`);
  console.log(`   GET  /api/tema/:id - Detalhe de um tema`);
  console.log(`   GET  /api/stats - Estatísticas`);
});
