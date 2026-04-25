// src/server.ts
import express from "express";
import cors from "cors";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import ragRoutes from "./routes/rag.routes";
import chatbotRoutes from "./routes/chatbot.routes";

import "./whatsapp/bot";

// ============================================
// API TÉCNICA (Porta 3000)
// ============================================
const ragApp = express();
ragApp.use(cors());
ragApp.use(express.json());
ragApp.use(loggerMiddleware);
ragApp.use("/api", ragRoutes);

const RAG_PORT = 3000;
ragApp.listen(RAG_PORT, () => {
  console.log(`🚀 API Técnica RAG rodando em http://localhost:${RAG_PORT}`);
  console.log(
    `📡 Rotas RAG: /api/perguntar, /api/temas, /api/tema/:id, /api/stats`,
  );
});

// ============================================
// API CHATBOT (Porta 3001)
// ============================================
const chatbotApp = express();
chatbotApp.use(cors());
chatbotApp.use(express.json());
chatbotApp.use(loggerMiddleware);
chatbotApp.use("/api", chatbotRoutes);

const CHATBOT_PORT = 3001;
chatbotApp.listen(CHATBOT_PORT, () => {
  console.log(`🚀 Chatbot API rodando em http://localhost:${CHATBOT_PORT}`);
  console.log(`📡 Rotas Chatbot: /api/chat, /api/tema/:id, /api/stats`);
  console.log(`🔗 Conectado à API técnica: http://localhost:${RAG_PORT}`);
});