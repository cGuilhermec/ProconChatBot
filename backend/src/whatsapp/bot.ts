import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

// IMPORTANTE: usar o mesmo service da API
import { processMessage } from "../services/chatbot.service";

// guarda quem já recebeu boas-vindas
const usuariosAtendidos = new Set<string>();

const client = new Client({
  authStrategy: new LocalAuth()
});

// QR Code para login
client.on("qr", (qr: string) => {
  qrcode.generate(qr, { small: true });
});

// quando conectar
client.on("ready", () => {
  console.log("✅ Bot conectado!");
});

// quando receber mensagem
client.on("message", async (message: Message) => {

  // ignorar mensagens do próprio bot
  if (message.fromMe) return;

  // ignorar mensagens vazias
  if (!message.body) return;

  // ignorar grupos
  if (message.from.includes("@g.us")) return;

  const chat = await message.getChat();

  // simular digitando
  await chat.sendStateTyping();

  await new Promise(resolve => setTimeout(resolve, 2000));

  const userId = message.from;
  
  // 🟢 PRIMEIRA MENSAGEM
  if (!usuariosAtendidos.has(userId)) {
    usuariosAtendidos.add(userId);

    await message.reply(
      "👋 Bem-vindo ao Procon de Jacareí - SP!\n\nComo posso te ajudar hoje?"
    );

    return; // ⚠️ importante: não chama a RAG ainda
  }

  // 🔥 chama o "cérebro"
  const resposta = await processMessage(message.body);

  // responde
  await message.reply(resposta);
});

// inicializa o bot
client.initialize();