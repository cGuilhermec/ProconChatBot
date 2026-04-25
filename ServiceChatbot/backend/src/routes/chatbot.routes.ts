// src/routes/chatbot.routes.ts
import { Router } from "express";
import { ChatbotController } from "../controllers/chatbot.controller";

const router = Router();
const chatbotController = new ChatbotController();

// Rotas Chatbot
router.post("/chat", chatbotController.chat);
router.get("/tema/:id", chatbotController.buscarTemaPorId);
router.get("/stats", chatbotController.stats);

export default router;
