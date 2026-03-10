// src/api.ts
import express from "express";
import { BuscadorProcon } from "../services/buscador.service";


const app = express();
const buscador = new BuscadorProcon();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rota principal - health check
app.get("/", (req, res) => {
  res.json({
    nome: "API Procon RAG",
    versao: "1.0.0",
    status: "online",
    descricao: "API de busca semântica para perguntas do Procon (sem IA)",
  });
});

// Rota para fazer perguntas
app.post("/api/perguntar", (req, res) => {
  try {
    const { pergunta } = req.body;

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

    const resultado = buscador.buscar(pergunta);

    res.json({
      sucesso: true,
      dados: resultado,
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
app.get("/api/temas", (req, res) => {
  try {
    const temas = buscador.listarTemas();
    res.json({
      sucesso: true,
      total: temas.length,
      dados: temas,
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao listar temas",
    });
  }
});

// Rota para buscar por ID
app.get("/api/tema/:id", (req, res) => {
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
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar tema",
    });
  }
});

// Rota de estatísticas
app.get("/api/stats", (req, res) => {
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
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao buscar estatísticas",
    });
  }
});

// Tratamento de rotas não encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    sucesso: false,
    erro: "Rota não encontrada",
    rotas_disponiveis: [
      "GET /",
      "POST /api/perguntar",
      "GET /api/temas",
      "GET /api/tema/:id",
      "GET /api/stats",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API RODANDO NA PORTA ${PORT}`);
  console.log(`📝 Exemplo de uso:`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/perguntar \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"pergunta": "cobrança de seguro"}'`);
});
