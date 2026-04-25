// ============================================
// TESTES PARA O SERVIÇO LLAMA (INTEGRAÇÃO COM OLLAMA)
// ============================================

// Importa o módulo de assert do Node.js para fazer validações nos testes
import assert from "node:assert";

// Importa as funções test, describe e beforeEach do módulo de teste nativo do Node
// - describe: agrupa blocos de testes relacionados
// - test: define um teste individual
// - beforeEach: executa código antes de cada teste (configuração)
import { test, describe, beforeEach } from "node:test";

// Importa o serviço Llama que faz a integração com o Ollama (LLM local)
import { LlamaService } from "../services/llama.service";

// Importa o buscador RAG para obter respostas baseadas no JSON do Procon
import { BuscadorProcon } from "../services/buscador.service";

/**
 * Bloco principal que agrupa todos os testes relacionados ao serviço Llama
 * Verifica se a integração com o Ollama está funcionando corretamente
 */
describe("🤖 Testes do Llama Service", () => {
  // Declara a variável llama que será usada em todos os testes
  let llama: LlamaService;

  // Declara a variável buscador que será usada em todos os testes
  let buscador: BuscadorProcon;

  // beforeEach: executa antes de CADA teste individual
  // Garante que cada teste comece com uma instância nova e limpa
  beforeEach(() => {
    llama = new LlamaService(); // Cria nova instância do Llama
    buscador = new BuscadorProcon(); // Cria nova instância do RAG
  });

  // ============================================
  // BLOCO 1: TESTES DE CONEXÃO COM OLLAMA
  // Verifica se o servidor Ollama está rodando e os modelos estão disponíveis
  // ============================================
  describe("Verificação de disponibilidade", () => {
    // Teste: Verifica se o servidor Ollama está respondendo na porta 11434
    test("Ollama deve estar rodando", async () => {
      try {
        const response = await fetch("http://localhost:11434/api/tags");
        assert.strictEqual(response.status, 200);
        console.log("✅ Ollama está rodando");
      } catch (error) {
        console.log("⚠️ Ollama não está rodando - pule este teste");
        console.log("   Execute: ollama serve");
      }
    });

    // Teste: Verifica se o modelo llama3.2 está baixado e disponível
    test("Modelo llama3.2 deve estar disponível", async () => {
      try {
        const response = await fetch("http://localhost:11434/api/tags");
        // O TypeScript não sabe o tipo do response.json(), então usamos 'as any'
        const data = (await response.json()) as any;
        const models = data.models || [];
        const hasModel = models.some((m: any) => m.name.includes("llama3.2"));

        assert.ok(hasModel, "Modelo llama3.2 não encontrado");
        console.log("✅ Modelo llama3.2 disponível");
      } catch (error) {
        console.log("⚠️ Não foi possível verificar modelos");
      }
    });
  });

  // ============================================
  // BLOCO 2: TESTES DE INTEGRAÇÃO LLAMA + RAG
  // Verifica se o Llama é chamado corretamente para diferentes tipos de pergunta
  // ============================================
  describe("Integração Llama + RAG", () => {
    // Teste: Pergunta FORA do RAG (fallback) - deve chamar Llama
    test("Deve chamar Llama para pergunta fora do RAG (fallback)", async () => {
      // Pergunta sobre horário de funcionamento (NÃO está no JSON do Procon)
      const pergunta = "qual o horário de funcionamento do Procon?";

      // Busca no RAG - deve retornar fallback
      const resultadoRAG = buscador.buscar(pergunta);

      // Verifica que realmente é fallback (não encontrou no JSON)
      assert.strictEqual(resultadoRAG.metodo, "fallback");

      // Chama o Llama para enriquecer a resposta
      const resposta = await llama.enriquecerResposta(pergunta, resultadoRAG);

      // Verifica que a resposta foi enriquecida (diferente da original)
      assert.ok(resposta !== resultadoRAG.resposta);
      assert.ok(resposta.length > 0);

      console.log(`✅ Llama respondeu: ${resposta.substring(0, 100)}...`);
    });

    // Teste: Pergunta DENTRO do RAG (confiança alta) - Llama pode ser chamado ou não
    test("Deve responder bem para pergunta com confiança alta", async () => {
      // Pergunta que está no JSON (cobrança de seguro)
      const pergunta = "cobrança de seguro no cartão";

      // Busca no RAG - deve encontrar com confiança alta
      const resultadoRAG = buscador.buscar(pergunta);

      // Verifica que o RAG encontrou a resposta
      assert.strictEqual(resultadoRAG.metodo, "palavras_chave");
      assert.strictEqual(resultadoRAG.confianca, "Alta");

      // Chama o Llama (pode ou não enriquecer, dependendo da configuração)
      const resposta = await llama.enriquecerResposta(pergunta, resultadoRAG);

      // Verifica que temos uma resposta válida
      assert.ok(resposta.length > 0);
      console.log(`✅ Resposta obtida: ${resposta.substring(0, 100)}...`);
    });

    // Teste: Pergunta sobre agendamento - deve retornar informações de contato
    test("Llama deve responder perguntas de agendamento adequadamente", async () => {
      const pergunta = "como faço para agendar atendimento no Procon?";
      const resultadoRAG = buscador.buscar(pergunta);

      const resposta = await llama.enriquecerResposta(pergunta, resultadoRAG);

      // Verifica se a resposta contém palavras-chave de agendamento
      const respostaLower = resposta.toLowerCase();
      const temAgendamento =
        respostaLower.includes("agend") ||
        respostaLower.includes("whatsapp") ||
        respostaLower.includes("telefone") ||
        respostaLower.includes("contato");

      assert.ok(temAgendamento, "Resposta deveria mencionar agendamento");
      console.log(
        `✅ Resposta de agendamento: ${resposta.substring(0, 100)}...`,
      );
    });
  });

  // ============================================
  // BLOCO 3: TESTES DE PERFORMANCE
  // Verifica se o Llama responde dentro de um tempo aceitável
  // ============================================
  describe("Performance do Llama", () => {
    // Teste: Verifica se a resposta não demora mais que 10 segundos
    test("Llama deve responder em menos de 10 segundos", async () => {
      const pergunta = "cobrança de seguro";
      const resultadoRAG = buscador.buscar(pergunta);

      // Marca o horário de início
      const inicio = Date.now();

      // Chama o Llama
      await llama.enriquecerResposta(pergunta, resultadoRAG);

      // Calcula quanto tempo levou
      const duracao = Date.now() - inicio;

      console.log(`⏱️ Tempo de resposta: ${duracao}ms`);

      // Verifica se respondeu em menos de 10 segundos (10000ms)
      assert.ok(duracao < 10000, `Resposta muito lenta: ${duracao}ms`);
    });
  });
});
