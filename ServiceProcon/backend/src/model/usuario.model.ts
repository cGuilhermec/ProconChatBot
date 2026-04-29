import { prisma } from "../config/database";
import { Usuario } from "../types/usuraio.types";

export class UsuarioModel {
  async createUsuarioDev(usuario: Usuario) {
    return prisma.usuario.create({ data: usuario });
  }

  async getUsuarioByEmail(email: string) {
    return prisma.usuario.findUnique({
      where: {
        email,
      },
    });
  }

  async atualizarPrimeiroAcesso(id: number) {
    return prisma.usuario.update({
      where: { USUARIO_ID: id },
      data: { primeiro_acesso: false },
    });
  }

  async atualizarUltimoLogin(id: number) {
    return prisma.usuario.update({
      where: { USUARIO_ID: id },
      data: { ultimo_login: new Date() },
    });
  }

  async getUsuarioById(id: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { USUARIO_ID: id },
    });
    return usuario;
  }

  async atualizarSenha(usuarioId: number, novaSenhaHash: string) {
    return prisma.usuario.update({
      where: { USUARIO_ID: usuarioId },
      data: {
        senha: novaSenhaHash,
        primeiro_acesso: false, // Marca que não é mais primeiro acesso
        updated_at: new Date(),
      },
    });
  }

  async atualizarSenhaPrimeiroAcesso(usuarioId: number, novaSenhaHash: string) {
    return prisma.usuario.update({
      where: { USUARIO_ID: usuarioId },
      data: {
        senha: novaSenhaHash,
        primeiro_acesso: true,
        updated_at: new Date(),
      },
    });
  }

  async desativarUsuario(usuarioId: number) {
    return prisma.usuario.update({
      where: { USUARIO_ID: usuarioId },
      data: {
        ativo: false,
        updated_at: new Date(),
      },
    });
  }

  async ativarUsuario(usuarioId: number) {
    return prisma.usuario.update({
      where: { USUARIO_ID: usuarioId },
      data: {
        ativo: true,
        updated_at: new Date(),
      },
    });
  }

  async listarUsuarios(procon_id?: number, role?: string) {
    const where: any = {};

    if (procon_id) {
      where.procon_id = procon_id;
    }

    if (role) {
      where.role = role;
    }

    return prisma.usuario.findMany({
      where,
      select: {
        USUARIO_ID: true,
        nome: true,
        email: true,
        role: true,
        procon_id: true,
        ativo: true,
        primeiro_acesso: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async atualizarUsuario(
    usuarioId: number,
    data: { nome?: string; email?: string },
  ) {
    return prisma.usuario.update({
      where: { USUARIO_ID: usuarioId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }
}