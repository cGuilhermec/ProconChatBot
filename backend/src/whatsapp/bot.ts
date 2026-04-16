// src/whatsapp/bot.ts
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { processMessage } from "../services/chatbot.service";

const usuariosAtendidos = new Set<string>();

// Configuração mais robusta do cliente
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./session-data", // Pasta separada para sessão
  }),
  puppeteer: {
    headless: false, // Deixe false para ver o navegador (ajuda a debuggar)
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1280,720",
    ],
  },
  qrMaxRetries: 5,
  authTimeoutMs: 60000,
});

// QR Code
client.on("qr", (qr: string) => {
  console.log("📱 Escaneie o QR Code abaixo com seu WhatsApp:");
  qrcode.generate(qr, { small: true });
});

// Autenticado com sucesso
client.on("authenticated", () => {
  console.log("✅ WhatsApp autenticado com sucesso!");
});

// Falha na autenticação
client.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação:", msg);
  console.log("🔄 Tentando reconectar em 5 segundos...");
  setTimeout(() => {
    client.initialize();
  }, 5000);
});

// Desconectado
client.on("disconnected", (reason) => {
  console.log("⚠️ Cliente desconectado:", reason);
  console.log("🔄 Tentando reconectar em 10 segundos...");
  setTimeout(() => {
    client.initialize();
  }, 10000);
});

// Cliente pronto
client.on("ready", () => {
  console.log("✅ Bot do WhatsApp conectado e pronto!");
  console.log("🎯 Bot está ouvindo mensagens...");
});

// Mensagem recebida
client.on("message", async (message: Message) => {
  try {
    // Ignorar mensagens do próprio bot
    if (message.fromMe) return;

    // Ignorar mensagens vazias
    if (!message.body || message.body.trim() === "") return;

    // Ignorar grupos
    if (message.from.includes("@g.us")) return;

    const chat = await message.getChat();
    const userId = message.from;

    console.log(`📨 Mensagem de ${userId}: ${message.body.substring(0, 50)}`);

    // Simular digitando
    await chat.sendStateTyping();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Primeira mensagem
    if (!usuariosAtendidos.has(userId)) {
      usuariosAtendidos.add(userId);
      await message.reply(
        "👋 Olá! Bem-vindo ao Procon de Jacareí - SP!\n\n" +
          "Sou um assistente virtual e posso te ajudar com:\n" +
          "• Cobranças indevidas\n" +
          "• Cancelamento de serviços\n" +
          "• Direitos do consumidor\n" +
          "• Como registrar reclamações\n\n" +
          "Como posso te ajudar hoje? 😊",
      );
      return;
    }

    // Processar mensagem
    console.log("🤔 Processando mensagem no RAG...");
    const resposta = await processMessage(message.body);
    console.log("✅ Resposta gerada com sucesso");

    // Responder (quebrar mensagem longa)
    if (resposta.length > 4000) {
      const partes = resposta.match(/.{1,4000}/g) || [];
      for (const parte of partes) {
        await message.reply(parte);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } else {
      await message.reply(resposta);
    }
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
    await message.reply(
      "⚠️ Desculpe, estou com um problema técnico no momento.\n" +
        "Por favor, tente novamente em alguns instantes.",
    );
  }
});

// Tratamento de erros globais
process.on("unhandledRejection", (error) => {
  console.error("❌ Erro não tratado:", error);
});

// Inicializar
console.log("🚀 Iniciando bot do WhatsApp...");
client.initialize();
