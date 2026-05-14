// src/service/login.service.ts
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginInterface } from "../types/login.types";
import { UsuarioModel } from "../model/usuario.model";
import { AuditLogService } from "./auditLog.service";
import { Request } from "express";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "";

export interface AuthResult {
  token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    role: string;
    procon_id: number | null;
    primeiro_acesso: boolean;
  };
}

export class LoginService {
  private usuarioModel: UsuarioModel;
  private auditLogService: AuditLogService;

  constructor() {
    this.usuarioModel = new UsuarioModel();
    this.auditLogService = new AuditLogService();
  }

  async authentication(
    user: LoginInterface,
    req?: Request,
  ): Promise<AuthResult | { mensagem: string }> {
    const userLoginAuth = await this.usuarioModel.getUsuarioByEmail(user.email);

    // 📝 Tentativa de login com email inexistente
    if (!userLoginAuth) {
      await this.auditLogService.registrar({
        usuario_id: 0, // ID 0 para usuário desconhecido
        acao: "LOGIN_FALHA_USUARIO_NAO_ENCONTRADO",
        dados_novos: { email: user.email },
        req,
      });
      return { mensagem: "Usuário não encontrado" };
    }

    // 📝 Tentativa de login com usuário inativo
    if (!userLoginAuth.ativo) {
      await this.auditLogService.registrar({
        usuario_id: userLoginAuth.USUARIO_ID,
        acao: "LOGIN_FALHA_USUARIO_INATIVO",
        req,
      });
      return { mensagem: "Usuário inativo. Contate o administrador." };
    }

    const isValidPassword = await bcryptjs.compare(
      user.password,
      userLoginAuth.senha,
    );

    // 📝 Tentativa de login com senha incorreta
    if (!isValidPassword) {
      await this.auditLogService.registrar({
        usuario_id: userLoginAuth.USUARIO_ID,
        acao: "LOGIN_FALHA_SENHA_INCORRETA",
        req,
      });
      return { mensagem: "Senha inválida" };
    }

    // ⬇️ VERIFICAR PRIMEIRO ACESSO
    const primeiroAcesso = userLoginAuth.primeiro_acesso;

    await this.usuarioModel.atualizarUltimoLogin(userLoginAuth.USUARIO_ID);

    const token = jwt.sign(
      {
        id: userLoginAuth.USUARIO_ID,
        email: userLoginAuth.email,
        nome: userLoginAuth.nome,
        role: userLoginAuth.role,
        procon_id: userLoginAuth.procon_id,
        primeiro_acesso: primeiroAcesso,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    // 📝 LOGIN BEM-SUCEDIDO
    await this.auditLogService.registrar({
      usuario_id: userLoginAuth.USUARIO_ID,
      acao: "LOGIN_SUCESSO",
      req,
    });

    return {
      token,
      usuario: {
        id: userLoginAuth.USUARIO_ID,
        nome: userLoginAuth.nome,
        email: userLoginAuth.email,
        role: userLoginAuth.role,
        procon_id: userLoginAuth.procon_id,
        primeiro_acesso: primeiroAcesso,
      },
    };
  }
}
