import { Request, Response } from "express";
import { UsuarioService } from "../service/usuario.service";

export class UsuarioController {
    private usuarioService: UsuarioService;

    constructor() {
        this.usuarioService = new UsuarioService();
    }

    async createUsuarioDev(req: Request, res: Response) {
        const { nome, email, senha, role, procon_id } = req.body;

        try {
            
            const result = await this.usuarioService.createUsuarioDev({
              nome,
              email,
              senha,
              role,
              procon_id,
            });

        } catch (error: any) {
            console.error("❌ Erro no Usuario Controller:", error);
            return res.status(500).json({
              sucesso: false,
              erro: error.message,
              mensagem: "Erro interno no servidor",
            });
        }

    }
}