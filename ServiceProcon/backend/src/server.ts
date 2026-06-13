// ServiceProcon/backend/server.ts
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Routes from "./routes/index.routes";
import { iniciarJobAgendamentos } from "./jobs/atualizarAgendamentos";

const JWT_SECRET = process.env.JWT_SECRET || "";

// ============================================
// API ADMINISTRATIVA (Porta 3002)
// ============================================
const adminApp = express();
const server = http.createServer(adminApp);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Porta do frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware de autenticação do Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Erro na autenticação do socket:", err);
    next(new Error("Authentication error"));
  }
});

// Eventos do Socket.IO
io.on("connection", (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);
  console.log(`👤 Usuário: ${socket.data.user?.id} - ${socket.data.user?.role}`);

  // Entrar na sala do usuário específico
  socket.join(`user_${socket.data.user?.id}`);

  // Se for coordenador/diretor/dev, entra na sala de coordenadores
  const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
  if (rolesPermitidos.includes(socket.data.user?.role)) {
    socket.join("coordenadores");
    console.log(`📢 ${socket.data.user?.role} entrou na sala de coordenadores`);
  }

  socket.on("disconnect", () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// Middlewares
adminApp.use(cors());
adminApp.use(express.json());
adminApp.use("/", Routes);

// Exportar io para usar em outros arquivos
export { io };

// Iniciar job de agendamentos
iniciarJobAgendamentos();

const ADMIN_PORT = 3002;
server.listen(ADMIN_PORT, () => {
  console.log(`🚀 API Administrativa rodando em http://localhost:${ADMIN_PORT}`);
  console.log(`🔌 WebSocket rodando na mesma porta`);
  console.log(`📡 Rotas Admin:`);
  console.log(`   - /procon (CRUD Procon)`);
  console.log(`   - /usuarios (CRUD Usuários)`);
  console.log(`   - /perguntas (CRUD Perguntas RAG)`);
  console.log(`   - /agendamentos (CRUD Agendamentos)`);
  console.log(`   - /login (Autenticação)`);
});