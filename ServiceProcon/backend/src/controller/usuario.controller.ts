import { Request, Response } from "express";
import { UsuarioService } from "../service/usuario.service";

export class UsuarioController {
  private usuarioService: UsuarioService;

  constructor() {
    this.usuarioService = new UsuarioService();
  }

  createUsuarioDev = async (req: Request, res: Response) => {
    const { nome, email, senha, role, procon_id } = req.body;

    try {
      const result = await this.usuarioService.createUsuarioDev({
        nome,
        email,
        senha,
        role,
        procon_id,
      });

      return res.status(201).json({
        sucesso: true,
        dados: result,
        mensagem: `Usuário ${nome} criado com sucesso!`,
      });
    } catch (error: any) {
      console.error("❌ Erro no Usuario Controller:", error);
      return res.status(500).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro interno no servidor",
      });
    }
  };

  createUsuario = async (req: Request, res: Response) => {
    const usuarioLogado = req.user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    const { nome, email, senha, role, procon_id } = req.body;

    try {
      const result = await this.usuarioService.createUsuario(
        { nome, email, senha, role, procon_id },
        usuarioLogado,
      );

      return res.status(201).json({
        sucesso: true,
        dados: result,
        mensagem: `Usuário ${nome} criado com sucesso por ${usuarioLogado.nome}!`,
      });
    } catch (error: any) {
      console.error("❌ Erro no Usuario Controller:", error);
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao criar usuário",
      });
    }
  };

  primeiroAcessoSenha = async (req: Request, res: Response) => {
    const usuarioLogado = req.user;
    const { novaSenha, confirmarSenha } = req.body;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.usuarioService.primeiroAcessoSenha(
        usuarioLogado.id,
        novaSenha,
        confirmarSenha,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Senha definida com sucesso!",
        primeiro_acesso: result.primeiro_acesso,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao definir senha",
      });
    }
  };

  // TROCAR SENHA (usuário sabe a senha atual)
  mudarSenha = async (req: Request, res: Response) => {
    const usuarioLogado = req.user;
    const { senhaAtual, novaSenha, confirmarSenha } = req.body;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.usuarioService.mudarSenha(
        usuarioLogado.id,
        senhaAtual,
        novaSenha,
        confirmarSenha,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Senha alterada com sucesso!",
        primeiro_acesso: result.primeiro_acesso,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao alterar senha",
      });
    }
  };

  resetarSenhaUsuario = async (req: Request, res: Response) => {
    const { usuarioId } = req.params;
    const { novaSenha } = req.body;
    const usuarioLogado = req.user;

    try {
      const result = await this.usuarioService.resetarSenhaUsuario(
        Number(usuarioId),
        novaSenha,
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: `Senha do usuário ${result.nome} foi alterada com sucesso!`,
        usuario: {
          id: result.id,
          nome: result.nome,
          primeiro_acesso: result.primeiro_acesso,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao resetar senha",
      });
    }
  };

  desativarUsuario = async (req: Request, res: Response) => {
    const { usuarioId } = req.params;
    const usuarioLogado = req.user;

    try {
      const result = await this.usuarioService.desativarUsuario(
        Number(usuarioId),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: `Usuário ${result.nome} foi desativado com sucesso por ${result.desativado_por_nome}!`,
        usuario: {
          id: result.id,
          nome: result.nome,
          email: result.email,
          role: result.role,
          ativo: result.ativo,
        },
      });
    } catch (error: any) {
      console.error("❌ Erro ao desativar usuário:", error);
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao desativar usuário",
      });
    }
  };

  ativarUsuario = async (req: Request, res: Response) => {
    const { usuarioId } = req.params;
    const usuarioLogado = req.user;

    try {
      const result = await this.usuarioService.ativarUsuario(
        Number(usuarioId),
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: `Usuário ${result.nome} foi ativado com sucesso por ${result.ativado_por_nome}!`,
        usuario: {
          id: result.id,
          nome: result.nome,
          email: result.email,
          role: result.role,
          ativo: result.ativo,
        },
      });
    } catch (error: any) {
      console.error("❌ Erro ao ativar usuário:", error);
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao ativar usuário",
      });
    }
  };

  getMe = async (req: Request, res: Response) => {
    const usuarioLogado = req.user;

    if (!usuarioLogado) {
      console.log(`❌ getMe: Usuário não autenticado`);
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.usuarioService.getMe(usuarioLogado.id);

      console.log(`🔍 getMe: result = ${JSON.stringify(result)}`);

      if (!result) {
        console.log(`❌ getMe: Usuário não encontrado no service`);
        return res.status(404).json({
          sucesso: false,
          mensagem: "Usuário não encontrado",
        });
      }

      return res.status(200).json({
        sucesso: true,
        dados: result,
      });
    } catch (error: any) {
      console.error("Erro no getMe:", error);
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  listarUsuarios = async (req: Request, res: Response) => {
    const usuarioLogado = req.user;
    const { role } = req.query;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.usuarioService.listarUsuarios(usuarioLogado, {
        role: role as string,
      });

      return res.status(200).json({
        sucesso: true,
        total: result.length,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  atualizarUsuario = async (req: Request, res: Response) => {
    const { usuarioId } = req.params;
    const { nome, email } = req.body;
    const usuarioLogado = req.user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      const result = await this.usuarioService.atualizarUsuario(
        Number(usuarioId),
        { nome, email },
        usuarioLogado,
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Usuário atualizado com sucesso!",
        dados: {
          id: result.USUARIO_ID,
          nome: result.nome,
          email: result.email,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };

  getUsuarioById = async (req: Request, res: Response) => {
    const { usuarioId } = req.params;
    const usuarioLogado = req.user;

    if (!usuarioLogado) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado",
      });
    }

    try {
      // Usuário normal só pode ver o próprio perfil
      const podeVerOutro = ["COORDENADOR", "DIRETOR", "DEV"].includes(
        usuarioLogado.role,
      );

      if (Number(usuarioId) !== usuarioLogado.id && !podeVerOutro) {
        return res.status(403).json({
          sucesso: false,
          mensagem: "Você não tem permissão para ver este usuário",
        });
      }

      const result = await this.usuarioService.getMe(Number(usuarioId));

      return res.status(200).json({
        sucesso: true,
        dados: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        sucesso: false,
        erro: error.message,
      });
    }
  };
}
