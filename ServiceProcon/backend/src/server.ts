// ServiceProcon/backend/server.ts
import express from "express";
import cors from "cors";
import Routes from "./routes/index.routes";
import { iniciarJobAgendamentos } from "./jobs/atualizarAgendamentos";

// ============================================
// API ADMINISTRATIVA (Porta 3002)
// ============================================
const adminApp = express();
adminApp.use(cors());
adminApp.use(express.json());
adminApp.use("/", Routes);

iniciarJobAgendamentos();

const ADMIN_PORT = 3002;
adminApp.listen(ADMIN_PORT, () => {
  console.log(
    `🚀 API Administrativa rodando em http://localhost:${ADMIN_PORT}`,
  );
  console.log(`📡 Rotas Admin:`);
  console.log(`   - /procon (CRUD Procon)`);
  console.log(`   - /usuarios (CRUD Usuários)`);
  console.log(`   - /perguntas (CRUD Perguntas RAG)`);
  console.log(`   - /agendamentos (CRUD Agendamentos)`);
  console.log(`   - /login (Autenticação)`);
});
