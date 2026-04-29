// src/routes/index.routes.ts
import { Router } from "express";
import devRoutes from "./dev.routes";
import usuarioRoutes from "./usuario.routes";
import { LoginController } from "../controller/login.controller";


const loginController = new LoginController();
const router = Router();

// Rotas de desenvolvimento
router.use("/dev", devRoutes);

// Rotas Autenticadas Usuários
router.use('/', usuarioRoutes);

//Login
router.post("/login", loginController.userLogin);

export default router;