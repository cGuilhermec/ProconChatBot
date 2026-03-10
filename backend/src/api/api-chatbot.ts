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
  const saudacoes = {
    olá: "Olá! 👋 Como posso ajudar você hoje?",
    oi: "Oi! 😊 Em que posso ser útil?",
    "bom dia": "Bom dia! ☀️ Como posso auxiliar?",
    "boa tarde": "Boa tarde! 🌤️ O que você precisa?",
    "boa noite": "Boa noite! 🌙 Estou aqui para ajudar!",
    "tudo bem": "Tudo bem sim! E com você? Como posso ajudar?",
    "e aí": "E aí! 👋 Pronto para tirar suas dúvidas!",
  };

  const msgLower = mensagem.toLowerCase();

  for (const [chave, resposta] of Object.entries(saudacoes)) {
    if (msgLower.includes(chave)) {
      return resposta;
    }
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
