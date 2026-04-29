// src/routes/dev.routes.ts
import { Router } from "express";
import { ProconController } from "../controller/procon.controller";
import { UsuarioController } from "../controller/usuario.controller";

const router = Router();
const proconController = new ProconController();
const usuarioController = new UsuarioController();

// Rotas Procon
router.post("/procon-dev", proconController.createProconDev);
router.post("/usuario-dev", usuarioController.createUsuarioDev);


export default router;