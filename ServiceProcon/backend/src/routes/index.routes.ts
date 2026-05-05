// src/routes/index.routes.ts
import { Router } from "express";
import devRoutes from "./dev.routes";
import usuarioRoutes from "./usuario.routes";
import proconRoutes from "./procon.routes";
import { LoginController } from "../controller/login.controller";
import feriadoRoutes from "./feriado.routes";


const loginController = new LoginController();
const router = Router();

// Rotas de desenvolvimento
router.use("/dev", devRoutes);

// Rotas Autenticadas
router.use("/", proconRoutes);
router.use('/', usuarioRoutes);
router.use("/", feriadoRoutes);

//Login
router.post("/login", loginController.userLogin);

export default router;