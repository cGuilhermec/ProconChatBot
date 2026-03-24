// src/controllers/chatbot.controller.ts
import { Request, Response } from "express";
import axios from "axios";

export class ChatbotController {
  private apiTecnicaUrl: string;

  constructor() {
    this.apiTecnicaUrl = process.env.API_TECNICA || "http://localhost:3000";
  }

  chat = async (req: Request, res: Response) => {
    try {
      const { mensagem, historico } = req.body;

      if (!mensagem) {
        return res.status(400).json({
          tipo: "erro",
          mensagem: "Mensagem não fornecida",
        });
      }

      // 1. Verifica saudação
      const saudacao = this.verificarSaudacao(mensagem);
      if (saudacao) {
        return res.json({
          tipo: "saudacao",
          mensagem: saudacao,
          acoes: ["fazer_pergunta", "ver_temas"],
        });
      }

      // 2. Verifica ajuda
      if (
        mensagem.toLowerCase().includes("ajuda") ||
        mensagem.toLowerCase().includes("o que você faz")
      ) {
        return res.json({
          tipo: "ajuda",
          mensagem: this.gerarMensagemAjuda(),
          acoes: ["ver_temas", "fazer_pergunta"],
        });
      }

      // 3. Verifica temas
      if (
        mensagem.toLowerCase().includes("temas") ||
        mensagem.toLowerCase().includes("assuntos")
      ) {
        const response = await axios.get(`${this.apiTecnicaUrl}/api/temas`);
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

      // 4. Envia para API técnica
      console.log(`🤖 Enviando para API técnica: "${mensagem}"`);

      const response = await axios.post(`${this.apiTecnicaUrl}/api/perguntar`, {
        pergunta: mensagem,
        usarLlama: true,
      });

      const dados = response.data.dados;

      let respostaFormatada = dados.resposta;

      if (dados.enriquecido) {
        respostaFormatada += "\n\n✨ *Resposta aprimorada com IA*";
      }

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
        sugestoes: this.gerarSugestoes(dados.metodo),
      });
    } catch (error) {
      console.error("Erro:", error);
      return res.status(500).json({
        tipo: "erro",
        mensagem: "Desculpe, tive um problema. Pode repetir? 😊",
      });
    }
  };

  buscarTemaPorId = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const response = await axios.get(`${this.apiTecnicaUrl}/api/tema/${id}`);
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
  };

  stats = async (_req: Request, res: Response) => {
    try {
      const response = await axios.get(`${this.apiTecnicaUrl}/api/stats`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({
        erro: "Erro ao buscar estatísticas",
      });
    }
  };

  private verificarSaudacao(mensagem: string): string | null {
    const msgLower = mensagem.toLowerCase().trim();

    const saudacoes = [
      { chave: "ola", resposta: "Olá! 👋 Como posso ajudar você hoje?" },
      { chave: "olá", resposta: "Olá! 👋 Como posso ajudar você hoje?" },
      { chave: "oi", resposta: "Oi! 😊 Em que posso ser útil?" },
      { chave: "bom dia", resposta: "Bom dia! ☀️ Como posso auxiliar?" },
      { chave: "boa tarde", resposta: "Boa tarde! 🌤️ O que você precisa?" },
      { chave: "boa noite", resposta: "Boa noite! 🌙 Estou aqui para ajudar!" },
      {
        chave: "tudo bem",
        resposta: "Tudo bem sim! E com você? Como posso ajudar?",
      },
      {
        chave: "ajuda",
        resposta: "Claro! Estou aqui para ajudar. Sobre o que você precisa?",
      },
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

  private gerarMensagemAjuda(): string {
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

  private gerarSugestoes(metodo: string): string[] {
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
}
