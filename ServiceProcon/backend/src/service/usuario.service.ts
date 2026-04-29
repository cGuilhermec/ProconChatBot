import { UsuarioModel } from "../model/usuario.model";
import { Usuario } from "../types/usuraio.types";
import { compare, hash } from "bcryptjs";

export class UsuarioService {
  private usuarioModel: UsuarioModel;

  constructor() {
    this.usuarioModel = new UsuarioModel();
  }

  async createUsuarioDev(data: Usuario) {
    const verifyIfUserExists = await this.usuarioModel.getUsuarioByEmail(
      data.email,
    );

    if (verifyIfUserExists) {
      throw new Error(`Usuário com o email ${data.email} já existe.`);
    }

    const hash_password = await hash(data.senha, 8);
    data.senha = hash_password;

    return this.usuarioModel.createUsuarioDev(data);
  }

  async createUsuario(data: Usuario, usuarioLogado: any) {
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

    return {
      primeiro_acesso: usuarioAtualizado.primeiro_acesso,
    };
  }

  async mudarSenha(
    usuarioId: number,
    senhaAtual: string,
    novaSenha: string,
    confirmarSenha: string,
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

    return {
      primeiro_acesso: usuarioAtualizado.primeiro_acesso,
    };
  }

  async resetarSenhaUsuario(
    usuarioId: number,
    novaSenha: string,
    usuarioLogado: any,
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

    // 5. Hash da nova senha
    const senhaHash = await hash(novaSenha, 8);

    // 6. Atualizar senha e marcar como primeiro acesso
    const usuarioAtualizado =
      await this.usuarioModel.atualizarSenhaPrimeiroAcesso(
        usuarioId,
        senhaHash,
      );

    // 7. Retornar dados (sem a senha)
    return {
      id: usuarioAtualizado.USUARIO_ID,
      nome: usuarioAtualizado.nome,
      primeiro_acesso: usuarioAtualizado.primeiro_acesso,
    };
  }

  async desativarUsuario(usuarioId: number, usuarioLogado: any) {
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

    // 7. Desativar usuário
    const usuarioDesativado =
      await this.usuarioModel.desativarUsuario(usuarioId);

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

  async ativarUsuario(usuarioId: number, usuarioLogado: any) {
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

    const usuarioAtivado = await this.usuarioModel.ativarUsuario(usuarioId);

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
      console.log(`❌ Service getMe: Usuário NÃO encontrado ID ${usuarioId}`);
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

    return this.usuarioModel.atualizarUsuario(usuarioId, data);
  }
}
