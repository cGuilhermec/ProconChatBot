// src/service/login.service.ts
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginInterface } from "../types/login.types";
import { UsuarioModel } from "../model/usuario.model";

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

  constructor() {
    this.usuarioModel = new UsuarioModel();
  }

  async authentication(
    user: LoginInterface,
  ): Promise<AuthResult | { mensagem: string }> {
    const userLoginAuth = await this.usuarioModel.getUsuarioByEmail(user.email);

    if (!userLoginAuth) {
      return { mensagem: "Usuário não encontrado" };
    }

    if (!userLoginAuth.ativo) {
      return { mensagem: "Usuário inativo. Contate o administrador." };
    }

    const isValidPassword = await bcryptjs.compare(
      user.password,
      userLoginAuth.senha,
    );

    if (!isValidPassword) {
      return { mensagem: "Senha inválida" };
    }

    // ⬇️ VERIFICAR PRIMEIRO ACESSO
    const primeiroAcesso = userLoginAuth.primeiro_acesso;

    // ⬇️ ATUALIZAR PRIMEIRO ACESSO E ÚLTIMO LOGIN
    if (primeiroAcesso) {
      await this.usuarioModel.atualizarPrimeiroAcesso(userLoginAuth.USUARIO_ID);
    }
    await this.usuarioModel.atualizarUltimoLogin(userLoginAuth.USUARIO_ID);

    const token = jwt.sign(
      {
        id: userLoginAuth.USUARIO_ID,
        email: userLoginAuth.email,
        nome: userLoginAuth.nome,
        role: userLoginAuth.role,
        procon_id: userLoginAuth.procon_id,
        primeiro_acesso: primeiroAcesso, // ⬅️ INCLUIR NO TOKEN
      },
      JWT_SECRET,
      { expiresIn: "8h" }, // ⬅️ 8 horas é melhor
    );

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
