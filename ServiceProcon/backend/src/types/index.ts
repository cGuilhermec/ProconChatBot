// src/types/index.ts
import { Request } from "express";

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  role: string;
  procon_id: number | null;
  ativo: boolean;
  primeiro_acesso: boolean;
}

export interface RequestWithUser extends Request {
  user?: UsuarioLogado;
}
