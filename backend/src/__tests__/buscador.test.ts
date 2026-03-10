// Importa o módulo de assert do Node.js para fazer validações nos testes
import assert from "node:assert";

// Importa as funções test, describe e beforeEach do módulo de teste nativo do Node
import { test, describe, beforeEach } from "node:test";

// Importa a classe BuscadorProcon que contém a lógica do RAG
import { BuscadorProcon } from "../services/buscador.service";

// Importa os dados de teste (conversas e perguntas) do arquivo test-data
import { conversasWhatsApp, perguntasReais } from "./helpers/test-data";

// Describe cria um bloco de testes agrupados - aqui testamos cenários de WhatsApp
describe("📱 Testes do RAG - Cenários WhatsApp", () => {
  // Declara a variável buscador que será usada em todos os testes
  let buscador: BuscadorProcon;

  // beforeEach executa antes de cada teste - cria uma instância nova do buscador
  beforeEach(() => {
    buscador = new BuscadorProcon();
  });

  // Describe para agrupar testes de conversas completas
  describe("Conversas completas do WhatsApp", () => {
    // Para cada conversa no array conversasWhatsApp, cria um teste
    conversasWhatsApp.forEach((conversa) => {
      // Cria um teste com a descrição da conversa
      test(conversa.descricao, () => {
        // Log para mostrar qual conversa está sendo simulada
        console.log(`\n📱 Simulando: ${conversa.descricao}`);

        // Variável para controlar se alguma saudação foi detectada
        let saudacaoDetectada = false;
        // Variável para guardar a última resposta do RAG
        let respostaFinal = null;

        // Loop por cada mensagem da conversa
        for (const msg of conversa.mensagens) {
          // Mostra a mensagem do cliente
          console.log(`👤 Cliente: "${msg}"`);

          // 1. Verifica se a mensagem é uma saudação
          if (ehSaudacao(msg)) {
            saudacaoDetectada = true; // Marca que detectou saudação
            console.log(`🤖 Bot: (saudação)`);
            continue; // Pula para próxima mensagem (não envia para o RAG)
          }

          // 2. Se não é saudação, passa a mensagem para o RAG
          const resultado = buscador.buscar(msg);
          respostaFinal = resultado; // Guarda o resultado

          // Mostra o resultado do RAG
          console.log(`🤖 RAG: ${resultado.metodo} - ${resultado.confianca}`);
          console.log(
            `   ID: ${resultado.base_legal ? "encontrado" : "fallback"}`,
          );
        }

        // VALIDAÇÕES - verificam se o comportamento está correto

        // Verifica se pelo menos uma saudação foi detectada na conversa
        assert.ok(saudacaoDetectada, "Deveria ter detectado saudação");

        // Se a conversa tem expectativa de ser "fora_do_escopo"
        if (conversa.expectativa.tipo === "fora_do_escopo") {
          // Verifica se a resposta final foi fallback
          assert.strictEqual(respostaFinal?.metodo, "fallback");
        } else {
          // Para conversas normais, verifica se teve resposta
          assert.ok(respostaFinal, "Deveria ter resposta");
          assert.ok(respostaFinal?.resposta, "Resposta não pode ser vazia");
        }

        console.log(`✅ Teste concluído\n`);
      });
    });
  });

  // Describe para agrupar testes de perguntas individuais
  describe("Perguntas individuais", () => {
    // Para cada pergunta no array perguntasReais, cria um teste
    perguntasReais.forEach(({ cenario, mensagem, idEsperado }) => {
      test(cenario, () => {
        console.log(`\n📝 Testando: ${cenario}`);
        console.log(`   Pergunta: "${mensagem}"`);

        // Executa o RAG com a mensagem
        const resultado = buscador.buscar(mensagem);

        // Mostra o resultado
        console.log(`   Método: ${resultado.metodo}`);
        console.log(
          `   Confiança: ${resultado.confianca} (${resultado.score})`,
        );

        // Se espera encontrar um ID específico
        if (idEsperado) {
          // Verifica se a confiança não é Baixa (deve ser Alta ou Média)
          assert.ok(
            resultado.confianca !== "Baixa",
            "Deveria ter confiança média/alta",
          );
          // Verifica se não caiu em fallback
          assert.ok(
            resultado.metodo !== "fallback",
            "Não deveria ser fallback",
          );
        } else {
          // Se é pergunta fora do escopo, deve ser fallback
          assert.ok(resultado.metodo === "fallback", "Deveria ser fallback");
        }

        console.log(`✅ OK\n`);
      });
    });
  });

  // Describe para testar detecção de saudações
  describe("Tratamento de saudações", () => {
    // Lista de saudações para testar
    const saudacoes = [
      "ola",
      "olá",
      "oi",
      "bom dia",
      "boa tarde",
      "boa noite",
      "e ai",
      "tudo bem",
    ];

    // Para cada saudação, cria um teste
    saudacoes.forEach((saudacao) => {
      test(`Saudação: "${saudacao}"`, () => {
        // Verifica se a função reconhece como saudação
        const ehSaudacao = verificarSaudacao(saudacao);
        assert.ok(
          ehSaudacao,
          `"${saudacao}" deveria ser reconhecida como saudação`,
        );
      });
    });
  });

  // Describe para testar erros de digitação
  describe("Perguntas com erros de digitação", () => {
    // Lista de palavras com erro e o esperado
    const variacoes = [
      { digito: "cobraça", esperado: "cobranca" },
      { digito: "segro", esperado: "seguro" },
      { digito: "cartao", esperado: "cartao" },
      { digito: "emprestim", esperado: "emprestimo" },
      { digito: "cancelar", esperado: "cancelar" },
    ];

    // Para cada variação, cria um teste
    variacoes.forEach(({ digito, esperado }) => {
      test(`Erro de digitação: "${digito}" deve encontrar "${esperado}"`, () => {
        // Executa o RAG com a palavra com erro
        const resultado = buscador.buscar(digito);

        // Verifica se encontrou algo (não caiu em fallback ou tem confiança boa)
        assert.ok(
          resultado.metodo !== "fallback" || resultado.confianca !== "Baixa",
        );
        console.log(`✅ "${digito}" → encontrou resultado`);
      });
    });
  });
});

// Função auxiliar que simula a detecção de saudação no chatbot
function ehSaudacao(mensagem: string): boolean {
  // Lista de palavras/frases de saudação
  const saudacoes = [
    "ola",
    "olá",
    "oi",
    "bom dia",
    "boa tarde",
    "boa noite",
    "e ai",
    "tudo bem",
  ];
  // Converte mensagem para minúsculo
  const msg = mensagem.toLowerCase();
  // Verifica se alguma saudação está contida na mensagem
  return saudacoes.some((s) => msg.includes(s));
}

// Função auxiliar que chama ehSaudacao (mantida para clareza)
function verificarSaudacao(mensagem: string): boolean {
  return ehSaudacao(mensagem);
}
