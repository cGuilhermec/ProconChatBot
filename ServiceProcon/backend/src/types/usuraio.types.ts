import { Role } from "@prisma/client";

export interface Usuario {
  nome: string;
  email: string;
  senha: string;
  role: Role;
  procon_id: number;
}