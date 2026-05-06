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
    });
  };

  perguntar = async (req: Request, res: Response) => {
    try {
      const { pergunta, procon_id, usarLlama = false } = req.body;

      console.log(`\n📝 Pergunta: "${pergunta}"`);
      console.log(`📌 Procon ID: ${procon_id}`);
      console.log(`🔧 usarLlama: ${usarLlama}`);

      if (!pergunta) {
        return res.status(400).json({
          erro: "Pergunta não fornecida",
          exemplo: {
            pergunta: "Estão cobrando um seguro no meu cartão",
            procon_id: 1,
          },
        });
      }

      if (!procon_id) {
        return res.status(400).json({
          erro: "procon_id não fornecido",
          exemplo: {
            pergunta: "Estão cobrando um seguro no meu cartão",
            procon_id: 1,
          },
        });
      }

      if (typeof pergunta !== "string") {
        return res.status(400).json({
          erro: "Pergunta deve ser uma string",
        });
      }

      // Buscar informações do Procon
      const proconInfo = await this.buscarProconInfo(procon_id);

      if (!proconInfo) {
        return res.status(404).json({
          sucesso: false,
          erro: "Procon não encontrado",
        });
      }

      // Buscar resposta RAG
      const resultadoRAG = await this.buscador.buscar(pergunta, procon_id);

      console.log(
        `📊 Resultado RAG - Método: ${resultadoRAG.metodo}, Confiança: ${resultadoRAG.confianca}, Score: ${resultadoRAG.score}`,
      );

      let respostaFinal: any = resultadoRAG;

      if (usarLlama) {
        console.log("🚀 Chamando Llama para enriquecer resposta...");
        try {
          // ✅ CORREÇÃO: Passar os 3 argumentos
          const respostaEnriquecida = await this.llama.enriquecerResposta(
            pergunta,
            resultadoRAG,
            proconInfo, // ✅ Adicionar proconInfo como terceiro argumento
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

  // Método auxiliar para buscar informações do Procon
  private async buscarProconInfo(proconId: number): Promise<any> {
    try {
      const axios = require("axios");
      const response = await axios.get(
        `http://localhost:3002/procon/${proconId}`,
      );

      if (response.data.sucesso && response.data.dados) {
        const procon = response.data.dados;
        return {
          id: procon.PROCON_ID,
          nome: procon.nome,
          cidade: procon.cidade,
          estado: procon.estado,
          endereco: procon.endereco,
          telefone: procon.telefone,
          email: procon.email,
          horario_funcionamento: `${procon.horario_abertura.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} às ${procon.horario_fechamento.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          whatsapp_number:
            procon.whatsapp_number || procon.telefone.replace(/\D/g, ""),
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar Procon:", error);
      return null;
    }
  }

  listarTemas = async (_req: Request, res: Response) => {
    try {
      res.json({
        sucesso: true,
        total: 0,
        dados: [],
        mensagem: "Use a rota /perguntas/buscar com procon_id",
      });
    } catch (error) {
      console.error("Erro ao listar temas:", error);
      res.status(500).json({
        sucesso: false,
        erro: "Erro ao listar temas",
      });
    }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      res.json({
        sucesso: true,
        dados: null,
        mensagem: "Use a rota /perguntas/buscar com procon_id",
      });
    } catch (error) {
      console.error("Erro ao buscar tema:", error);
      res.status(500).json({
        sucesso: false,
        erro: "Erro ao buscar tema",
      });
    }
  };

  estatisticas = async (_req: Request, res: Response) => {
    try {
      res.json({
        sucesso: true,
        estatisticas: {
          total_temas: 0,
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
        "POST /api/perguntar (use { pergunta, procon_id, usarLlama?: boolean })",
      ],
    });
  };
}
