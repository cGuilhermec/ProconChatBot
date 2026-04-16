// src/index.ts
import * as readline from "readline";
import { BuscadorProcon } from "../services/buscador.service";

// Inicializa o buscador
const buscador = new BuscadorProcon();

// Configura interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Cores para o terminal
const cores = {
  reset: "\x1b[0m",
  verde: "\x1b[32m",
  azul: "\x1b[34m",
  amarelo: "\x1b[33m",
  vermelho: "\x1b[31m",
  ciano: "\x1b[36m",
  magenta: "\x1b[35m",
  branco: "\x1b[37m",
};

console.log(`${cores.ciano}╔══════════════════════════════════════╗`);
console.log(`║   🤖 ASSISTENTE PROCON RAG (TS)   ║`);
console.log(`║      SEM IA - APENAS BUSCA        ║`);
console.log(`╚══════════════════════════════════════╝${cores.reset}`);
console.log(`\n${cores.amarelo}📋 Comandos disponíveis:`);
console.log(`   • Digite sua pergunta`);
console.log(`   • 'temas' - Listar todos os temas`);
console.log(`   • 'sair' - Encerrar o programa${cores.reset}\n`);

function formatarResposta(resposta: any) {
  console.log(`\n${cores.verde}${"=".repeat(60)}`);
  console.log(
    `📌 RESPOSTA (Método: ${resposta.metodo} - Confiança: ${resposta.confianca})`,
  );
  console.log(`📊 Score: ${(resposta.score * 100).toFixed(1)}%`);
  console.log(`${"=".repeat(60)}${cores.reset}`);

  console.log(`\n${cores.branco}${resposta.resposta}\n`);

  if (resposta.base_legal && resposta.base_legal.length > 0) {
    console.log(`${cores.magenta}⚖️ BASE LEGAL:${cores.reset}`);
    resposta.base_legal.forEach((artigo: string) =>
      console.log(`   • ${artigo}`),
    );
  }

  if (resposta.documentos && resposta.documentos.length > 0) {
    console.log(`\n${cores.azul}📎 DOCUMENTOS NECESSÁRIOS:${cores.reset}`);
    resposta.documentos.forEach((doc: string) => console.log(`   • ${doc}`));
  }

  if (resposta.observacao) {
    console.log(
      `\n${cores.amarelo}⚠️ OBSERVAÇÃO: ${resposta.observacao}${cores.reset}`,
    );
  }

  console.log(`${cores.verde}${"=".repeat(60)}${cores.reset}\n`);
}

function listarTemas() {
  const temas = buscador.listarTemas();
  console.log(`\n${cores.ciano}📋 TEMAS DISPONÍVEIS:${cores.reset}`);
  temas.forEach((t) => {
    console.log(`   ${cores.amarelo}[${t.id}]${cores.reset} ${t.tema}`);
    console.log(`       ➜ ${t.pergunta.substring(0, 60)}...`);
  });
  console.log();
}

function perguntar() {
  rl.question(
    `${cores.verde}👤 Sua pergunta > ${cores.reset}`,
    async (input) => {
      const comando = input.toLowerCase().trim();

      if (comando === "sair") {
        console.log(`\n${cores.ciano}👋 Até mais!${cores.reset}`);
        rl.close();
        return;
      }

      if (comando === "temas") {
        listarTemas();
        perguntar();
        return;
      }

      if (comando === "") {
        perguntar();
        return;
      }

      // Busca a resposta
      const resposta = buscador.buscar(input);

      // Mostra resultado
      formatarResposta(resposta);

      // Próxima pergunta
      perguntar();
    },
  );
}

// Inicia o loop
perguntar();

// Trata Ctrl+C
process.on("SIGINT", () => {
  console.log(`\n${cores.ciano}👋 Até mais!${cores.reset}`);
  rl.close();
  process.exit(0);
});
