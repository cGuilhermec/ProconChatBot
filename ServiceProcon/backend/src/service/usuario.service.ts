// src/service/usuario.service.ts
import { UsuarioModel } from "../model/usuario.model";
import { Usuario } from "../types/usuraio.types";
import { compare, hash } from "bcryptjs";
import { AuditLogService } from "./auditLog.service";
import { Request } from "express";

export class UsuarioService {
  private usuarioModel: UsuarioModel;
  private auditLogService: AuditLogService;

  constructor() {
    this.usuarioModel = new UsuarioModel();
    this.auditLogService = new AuditLogService();
  }

  async createUsuarioDev(data: Usuario, req?: Request) {
    const verifyIfUserExists = await this.usuarioModel.getUsuarioByEmail(
      data.email,
    );

    if (verifyIfUserExists) {
      throw new Error(`Usuário com o email ${data.email} já existe.`);
    }

    const hash_password = await hash(data.senha, 8);
    data.senha = hash_password;

    const novoUsuario = await this.usuarioModel.createUsuarioDev(data);

    // 📝 LOG: Criação de usuário via DEV
    await this.auditLogService.registrar({
      usuario_id: 1, // Usuário DEV padrão
      acao: "CREATE_USUARIO_DEV",
      dados_novos: {
        id: novoUsuario.USUARIO_ID,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        role: novoUsuario.role,
      },
      req,
    });

    return novoUsuario;
  }

  async createUsuario(data: Usuario, usuarioLogado: any, req?: Request) {
    // 1. Validar permissão do usuário logado
    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];

    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para criar usuários.`,
      );
    }

    // 2. Validar se o usuário existe
    const verifyIfUserExists = await this.usuarioModel.getUsuarioByEmail(
      data.email,
    );

    if (verifyIfUserExists) {
      throw new Error(`Usuário com o email ${data.email} já existe.`);
    }

    // 3. Validar dados obrigatórios
    if (!data.nome || !data.email || !data.senha) {
      throw new Error("Nome, email e senha são obrigatórios.");
    }

    // 4. Se o criador é COORDENADOR, só pode criar FUNCIONARIO
    if (
      usuarioLogado.role === "COORDENADOR" &&
      data.role !== "FUNCIONARIO" &&
      data.role !== "COORDENADOR"
    ) {
      throw new Error(
        `COORDENADOR só pode criar usuários com role FUNCIONARIO e COORDENADOR. Role solicitada: ${data.role}`,
      );
    }

    // 5. Definir procon_id como o mesmo do criador se não foi informado
    if (!data.procon_id && usuarioLogado.procon_id) {
      data.procon_id = usuarioLogado.procon_id;
    }

    // 6. Hash da senha
    const hash_password = await hash(data.senha, 8);
    data.senha = hash_password;

    // 7. Criar o usuário
    const novoUsuario = await this.usuarioModel.createUsuarioDev(data);

    // 📝 LOG: Criação de usuário
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "CREATE_USUARIO",
      dados_novos: {
        id: novoUsuario.USUARIO_ID,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        role: novoUsuario.role,
        procon_id: novoUsuario.procon_id,
      },
      req,
    });

    // 8. Retornar apenas os dados necessários (sem senha)
    return {
      id: novoUsuario.USUARIO_ID,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      role: novoUsuario.role,
      procon_id: novoUsuario.procon_id,
      criado_por: usuarioLogado.id,
      criado_por_nome: usuarioLogado.nome,
    };
  }

  async primeiroAcessoSenha(
    usuarioId: number,
    novaSenha: string,
    confirmarSenha: string,
    req?: Request,
  ) {
    // Validar se as senhas coincidem
    if (novaSenha !== confirmarSenha) {
      throw new Error("Nova senha e confirmação não coincidem");
    }

    if (novaSenha.length < 6) {
      throw new Error("Nova senha deve ter pelo menos 6 caracteres");
    }

    const usuario = await this.usuarioModel.getUsuarioById(usuarioId);

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se realmente é primeiro acesso
    if (!usuario.primeiro_acesso) {
      throw new Error(
        "Esta funcionalidade é apenas para primeiro acesso. Use a opção 'Mudar Senha'.",
      );
    }

    const novaSenhaHash = await hash(novaSenha, 8);

    const usuarioAtualizado =
      await this.usuarioModel.atualizarSenhaPrimeiroAcesso(
        usuarioId,
        novaSenhaHash,
      );

    // 📝 LOG: Primeiro acesso (troca de senha obrigatória)
    await this.auditLogService.registrar({
      usuario_id: usuarioId,
      acao: "PRIMEIRO_ACESSO",
      dados_anteriores: { primeiro_acesso: true },
      dados_novos: { primeiro_acesso: false },
      req,
    });

    return {
      primeiro_acesso: usuarioAtualizado.primeiro_acesso,
    };
  }

  async mudarSenha(
    usuarioId: number,
    senhaAtual: string,
    novaSenha: string,
    confirmarSenha: string,
    req?: Request,
  ) {
    // Validar confirmação
    if (novaSenha !== confirmarSenha) {
      throw new Error("Nova senha e confirmação não coincidem");
    }

    if (novaSenha.length < 6) {
      throw new Error("Nova senha deve ter pelo menos 6 caracteres");
    }

    if (senhaAtual === novaSenha) {
      throw new Error("A nova senha não pode ser igual à senha atual");
    }

    const usuario = await this.usuarioModel.getUsuarioById(usuarioId);

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    const senhaValida = await compare(senhaAtual, usuario.senha);

    if (!senhaValida) {
      throw new Error("Senha atual incorreta");
    }

    const novaSenhaHash = await hash(novaSenha, 8);

    const usuarioAtualizado = await this.usuarioModel.atualizarSenha(
      usuarioId,
      novaSenhaHash,
    );

    // 📝 LOG: Troca de senha voluntária
    await this.auditLogService.registrar({
      usuario_id: usuarioId,
      acao: "MUDAR_SENHA",
      req,
    });

    return {
      primeiro_acesso: usuarioAtualizado.primeiro_acesso,
    };
  }

  async resetarSenhaUsuario(
    usuarioId: number,
    novaSenha: string,
    usuarioLogado: any,
    req?: Request,
  ) {
    // 1. Validar se usuário logado existe
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    // 2. Validar permissão (apenas COORDENADOR, DIRETOR, DEV)
    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para resetar senhas.`,
      );
    }

    // 3. Validar se a nova senha foi fornecida
    if (!novaSenha) {
      throw new Error("A nova senha é obrigatória");
    }

    // 4. Validar se o usuário existe
    const usuario = await this.usuarioModel.getUsuarioById(usuarioId);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    // 5. Guardar dados anteriores
    const dadosAnteriores = {
      senha_hash: usuario.senha,
      primeiro_acesso: usuario.primeiro_acesso,
    };

    // 6. Hash da nova senha
    const senhaHash = await hash(novaSenha, 8);

    // 7. Atualizar senha e marcar como primeiro acesso
    const usuarioAtualizado =
      await this.usuarioModel.atualizarSenhaPrimeiroAcesso(
        usuarioId,
        senhaHash,
      );

    // 📝 LOG: Reset de senha por coordenador
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "RESETAR_SENHA_USUARIO",
      dados_anteriores: dadosAnteriores,
      dados_novos: {
        primeiro_acesso: usuarioAtualizado.primeiro_acesso,
      },
      req,
    });

    // 8. Retornar dados (sem a senha)
    return {
      id: usuarioAtualizado.USUARIO_ID,
      nome: usuarioAtualizado.nome,
      primeiro_acesso: usuarioAtualizado.primeiro_acesso,
    };
  }

  async desativarUsuario(usuarioId: number, usuarioLogado: any, req?: Request) {
    // 1. Validar se usuário logado existe
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    // 2. Validar permissão (apenas COORDENADOR, DIRETOR, DEV)
    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Você é um ${usuarioLogado.role}, não tem permissão para desativar usuários.`,
      );
    }

    // 3. Validar se o usuário existe
    const usuario = await this.usuarioModel.getUsuarioById(usuarioId);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    // 4. Impedir desativar a si mesmo
    if (usuarioLogado.id === usuarioId) {
      throw new Error("Você não pode desativar seu próprio usuário");
    }

    // 5. Impedir desativar usuários com role superior
    const rolesHierarquia = {
      DEV: 4,
      DIRETOR: 3,
      COORDENADOR: 2,
      FUNCIONARIO: 1,
    };

    const roleLogadoNivel =
      rolesHierarquia[usuarioLogado.role as keyof typeof rolesHierarquia];
    const roleAlvoNivel =
      rolesHierarquia[usuario.role as keyof typeof rolesHierarquia];

    if (roleAlvoNivel >= roleLogadoNivel && usuarioLogado.role !== "DEV") {
      throw new Error(
        `Você não pode desativar um usuário com role ${usuario.role}.`,
      );
    }

    // 6. Verificar se já está desativado
    if (!usuario.ativo) {
      throw new Error(`Usuário ${usuario.nome} já está desativado.`);
    }

    // 7. Dados anteriores
    const dadosAnteriores = {
      ativo: usuario.ativo,
    };

    // 8. Desativar usuário
    const usuarioDesativado =
      await this.usuarioModel.desativarUsuario(usuarioId);

    // 📝 LOG: Desativação de usuário
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "DESATIVAR_USUARIO",
      dados_anteriores: dadosAnteriores,
      dados_novos: { ativo: false },
      req,
    });

    return {
      id: usuarioDesativado.USUARIO_ID,
      nome: usuarioDesativado.nome,
      email: usuarioDesativado.email,
      role: usuarioDesativado.role,
      ativo: usuarioDesativado.ativo,
      desativado_por: usuarioLogado.id,
      desativado_por_nome: usuarioLogado.nome,
    };
  }

  async ativarUsuario(usuarioId: number, usuarioLogado: any, req?: Request) {
    // Mesmas validações de permissão da desativação
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para ativar usuários.`,
      );
    }

    const usuario = await this.usuarioModel.getUsuarioById(usuarioId);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se já está ativo
    if (usuario.ativo) {
      throw new Error(`Usuário ${usuario.nome} já está ativo.`);
    }

    // Dados anteriores
    const dadosAnteriores = {
      ativo: usuario.ativo,
    };

    const usuarioAtivado = await this.usuarioModel.ativarUsuario(usuarioId);

    // 📝 LOG: Ativação de usuário
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "ATIVAR_USUARIO",
      dados_anteriores: dadosAnteriores,
      dados_novos: { ativo: true },
      req,
    });

    return {
      id: usuarioAtivado.USUARIO_ID,
      nome: usuarioAtivado.nome,
      email: usuarioAtivado.email,
      role: usuarioAtivado.role,
      ativo: usuarioAtivado.ativo,
      ativado_por: usuarioLogado.id,
      ativado_por_nome: usuarioLogado.nome,
    };
  }

  async getMe(usuarioId: number) {
    const usuario = await this.usuarioModel.getUsuarioById(usuarioId);

    if (!usuario) {
      return null;
    }

    return {
      id: usuario.USUARIO_ID,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      procon_id: usuario.procon_id,
      ativo: usuario.ativo,
      primeiro_acesso: usuario.primeiro_acesso,
      created_at: usuario.created_at,
      updated_at: usuario.updated_at,
    };
  }

  async listarUsuarios(usuarioLogado: any, filters?: { role?: string }) {
    // Verificar permissão
    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para listar usuários.");
    }

    // Se for COORDENADOR, só vê usuários do mesmo procon
    let procon_id = undefined;
    if (usuarioLogado.role === "COORDENADOR") {
      procon_id = usuarioLogado.procon_id;
    }

    return this.usuarioModel.listarUsuarios(procon_id, filters?.role);
  }

  async atualizarUsuario(
    usuarioId: number,
    data: { nome?: string; email?: string },
    usuarioLogado: any,
    req?: Request,
  ) {
    // Verificar permissão
    if (usuarioLogado.id !== usuarioId) {
      const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
      if (!rolesPermitidos.includes(usuarioLogado.role)) {
        throw new Error("Você só pode editar seu próprio perfil.");
      }
    }

    const usuario = await this.usuarioModel.getUsuarioById(usuarioId);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    // Se estiver trocando email, verificar se já existe
    if (data.email && data.email !== usuario.email) {
      const emailExists = await this.usuarioModel.getUsuarioByEmail(data.email);
      if (emailExists) {
        throw new Error(`Email ${data.email} já está em uso.`);
      }
    }

    // Dados anteriores
    const dadosAnteriores = {
      nome: usuario.nome,
      email: usuario.email,
    };

    const usuarioAtualizado = await this.usuarioModel.atualizarUsuario(
      usuarioId,
      data,
    );

    // 📝 LOG: Atualização de usuário
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "ATUALIZAR_USUARIO",
      dados_anteriores: dadosAnteriores,
      dados_novos: {
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
      },
      req,
    });

    return usuarioAtualizado;
  }
}
