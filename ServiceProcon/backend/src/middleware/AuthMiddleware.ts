// src/middleware/AuthMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";

const JWT_SECRET = process.env.JWT_SECRET || "";

// Estender a interface Request do Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        nome: string;
        role: string;
        procon_id: number | null;
        ativo: boolean;
        primeiro_acesso: boolean;
      };
    }
  }
}

export class AuthMiddleware {
  
  static authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Token não fornecido",
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        email: string;
        nome: string;
        role: string;
        procon_id: number | null;
      };

      const usuario = await prisma.usuario.findUnique({
        where: { USUARIO_ID: decoded.id },
        select: {
          USUARIO_ID: true,
          email: true,
          nome: true,
          role: true,
          procon_id: true,
          ativo: true,
          primeiro_acesso: true,
        },
      });

      if (!usuario) {
        console.log(
          `❌ AuthMiddleware: Usuário não encontrado para ID ${decoded.id}`,
        );
        return res.status(401).json({
          sucesso: false,
          mensagem: "Usuário não encontrado",
        });
      }

      req.user = {
        id: usuario.USUARIO_ID,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.role,
        procon_id: usuario.procon_id,
        ativo: usuario.ativo,
        primeiro_acesso: usuario.primeiro_acesso,
      };

      next();
    } catch (error) {
      console.error("❌ AuthMiddleware: Erro ao verificar token:", error);
      return res.status(403).json({
        sucesso: false,
        mensagem: "Token inválido ou expirado",
      });
    }
  };
}
