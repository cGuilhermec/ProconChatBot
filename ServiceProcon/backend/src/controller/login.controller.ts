// src/controller/login.controller.ts
import dotenv from "dotenv";
import { Request, Response } from "express";
import { LoginInterface } from "../types/login.types";
import { LoginService } from "../service/login.service";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "";

export class LoginController {
  private loginService: LoginService;

  constructor() {
    this.loginService = new LoginService();
  }

  userLogin = async (req: Request, res: Response) => {
    const { email, senha } = req.body;

    try {
      if (!email || !senha) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Email e senha são obrigatórios.",
        });
      }

      const user: LoginInterface = { email, password: senha };
      const result = await this.loginService.authentication(user);

      // Verificar se é um erro (tem mensagem)
      if ("mensagem" in result) {
        return res.status(401).json({
          sucesso: false,
          mensagem: result.mensagem,
        });
      }

      // Se chegou aqui, é um sucesso (tem token e usuario)
      return res.status(200).json({
        sucesso: true,
        mensagem: "Usuário autenticado com sucesso!",
        token: result.token,
        usuario: {
          id: result.usuario.id,
          nome: result.usuario.nome,
          email: result.usuario.email,
          role: result.usuario.role,
          procon_id: result.usuario.procon_id,
          primeiro_acesso: result.usuario.primeiro_acesso,
        },
      });
    } catch (error: any) {
      console.error("Erro no login:", error);
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao autenticar o usuário: " + error.message,
      });
    }
  };
}

export const loginController = new LoginController();
