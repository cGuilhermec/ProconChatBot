// src/routes/usuario.routes.ts
import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { UsuarioController } from "../controller/usuario.controller";

const router = Router();
const usuarioController = new UsuarioController();


// CRUD Usuario
router.post("/usuario", AuthMiddleware.authenticateToken, usuarioController.createUsuario);
router.put("/usuario/:usuarioId", AuthMiddleware.authenticateToken, usuarioController.atualizarUsuario);

//Senhas
router.put("/first-access", AuthMiddleware.authenticateToken, usuarioController.primeiroAcessoSenha);
router.put("/mudar-senha", AuthMiddleware.authenticateToken, usuarioController.mudarSenha);
router.put("/resetar-senha/:usuarioId", AuthMiddleware.authenticateToken, usuarioController.resetarSenhaUsuario);

//Ativar/Desativar Usuarios
router.put("/desativar/:usuarioId", AuthMiddleware.authenticateToken, usuarioController.desativarUsuario);
router.put("/ativar/:usuarioId", AuthMiddleware.authenticateToken, usuarioController.ativarUsuario); 

// Listar usuários (coordenador)
router.get("/usuarios", AuthMiddleware.authenticateToken, usuarioController.listarUsuarios);
router.get("/usuario/:usuarioId", AuthMiddleware.authenticateToken, usuarioController.getUsuarioById);
router.get("/me", AuthMiddleware.authenticateToken, usuarioController.getMe);

export default router;