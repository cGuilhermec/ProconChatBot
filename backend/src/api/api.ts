// src/api/api.ts
import express, { Request, Response } from "express";
import { BuscadorProcon } from "../services/buscador.service";
import { LlamaService } from "../services/llama.service";

const app = express();
const buscador = new BuscadorProcon();
const llama = new LlamaService();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Middleware de logging
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROTAS
// ============================================

// Rota principal - health check
app.get("/", (_req: Request, res: Response) => {
  res.json({
    nome: "API Procon RAG",
    versao: "1.0.0",
    status: "online",
    descricao: "API de busca semântica para perguntas do Procon",
    recursos: {
      rag: "Busca direta no banco de dados",
      llm: "Opcional - integração com Llama para respostas mais naturais",
    },
  });
});

// Rota para fazer perguntas (COM SUPORTE A LLAMA)
app.post("/api/perguntar", async (req: Request, res: Response) => {
  try {
    const { pergunta, usarLlama = false } = req.body;

    console.log(`\n📝 Pergunta: "${pergunta}"`);
    console.log(`🔧 usarLlama: ${usarLlama}`);

    if (!pergunta) {
      return res.status(400).json({
        erro: "Pergunta não fornecida",
        exemplo: { pergunta: "Estão cobrando um seguro no meu cartão" },
      });
    }

    if (typeof pergunta !== "string") {
      return res.status(400).json({
        erro: "Pergunta deve ser uma string",
      });
    }

    // 1. Busca no RAG
    const resultadoRAG = buscador.buscar(pergunta);

    console.log(
      `📊 Resultado RAG - Método: ${resultadoRAG.metodo}, Confiança: ${resultadoRAG.confianca}, Score: ${resultadoRAG.score}`,
    );

    // 2. Decide se usa Llama
    let respostaFinal: any = resultadoRAG;

    if (usarLlama) {
      console.log("🚀 Chamando Llama para enriquecer resposta...");
      try {
        const respostaEnriquecida = await llama.enriquecerResposta(
          pergunta,
          resultadoRAG,
        );

        respostaFinal = {
          ...resultadoRAG,
          resposta: respostaEnriquecida,
          enriquecido: true,
        };
        console.log("✅ Llama respondeu com sucesso!");
      } catch (llamaError) {
        console.error("❌ Erro ao chamar Llama:", llamaError);
        respostaFinal = {
          ...resultadoRAG,
          llm_error: true,
        };
      }
    } else {
      console.log("⚠️ Pulou Llama (usarLlama=false)");
    }

    res.json({
      sucesso: true,
      dados: respostaFinal,
    });
  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({
      sucesso: false,
      erro: "Erro interno no servidor",
    });
  }
});

// Rota para listar todos os temas
app.get("/api/temas", (_req: Request, res: Response) => {
  try {
    const temas = buscador.listarTemas();
    res.json({
      sucesso: true,
      total: temas.length,
      dados: temas,
    });
  } catch (error) {
    console.error("Erro ao listar temas:", error);
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao listar temas",
    });
  }
});

// Rota para buscar por ID
app.get("/api/tema/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tema = buscador.buscarPorId(id);

    if (!tema) {
      return res.status(404).json({
        sucesso: false,
        erro: "Tema não encontrado",
      });
    }

    res.json({
      sucesso: true,
      dados: tema,
    });
  } catch (error) {
    console.error("Erro ao buscar tema:", error);
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar tema",
    });
  }
});

// Rota de estatísticas
app.get("/api/stats", (_req: Request, res: Response) => {
  try {
    const temas = buscador.listarTemas();
    res.json({
      sucesso: true,
      estatisticas: {
        total_temas: temas.length,
        timestamp: new Date().toISOString(),
        versao: "1.0.0",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar estatísticas",
    });
  }
});

// Tratamento de rotas não encontradas
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({
    sucesso: false,
    erro: "Rota não encontrada",
    rotas_disponiveis: [
      "GET /",
      "POST /api/perguntar (use { pergunta, usarLlama?: boolean })",
      "GET /api/temas",
      "GET /api/tema/:id",
      "GET /api/stats",
    ],
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 API RODANDO NA PORTA ${PORT}`);
  console.log(`📝 Exemplos de uso:`);
  console.log(``);
  console.log(`🔍 RAG puro (sem Llama):`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/perguntar \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"pergunta": "cobrança de seguro"}'`);
  console.log(``);
  console.log(`🤖 RAG + Llama (resposta mais natural):`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/perguntar \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(
    `     -d '{"pergunta": "cobrança de seguro", "usarLlama": true}'`,
  );
});
