// src/controllers/rag.controller.ts
import { Request, Response } from "express";
import { BuscadorProcon } from "../services/buscador.service";
import { LlamaService } from "../services/llama.service";

export class RagController {
  private buscador: BuscadorProcon;
  private llama: LlamaService;

  constructor() {
    this.buscador = new BuscadorProcon();
    this.llama = new LlamaService();
  }

  healthCheck = (_req: Request, res: Response) => {
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
  };

  perguntar = async (req: Request, res: Response) => {
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

      const resultadoRAG = this.buscador.buscar(pergunta);

      console.log(
        `📊 Resultado RAG - Método: ${resultadoRAG.metodo}, Confiança: ${resultadoRAG.confianca}, Score: ${resultadoRAG.score}`,
      );

      let respostaFinal: any = resultadoRAG;

      if (usarLlama) {
        console.log("🚀 Chamando Llama para enriquecer resposta...");
        try {
          const respostaEnriquecida = await this.llama.enriquecerResposta(
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
  };

  listarTemas = (_req: Request, res: Response) => {
    try {
      const temas = this.buscador.listarTemas();
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
  };

  buscarPorId = (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const tema = this.buscador.buscarPorId(id);

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
  };

  estatisticas = (_req: Request, res: Response) => {
    try {
      const temas = this.buscador.listarTemas();
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
  };

  notFound = (_req: Request, res: Response) => {
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
  };
}
