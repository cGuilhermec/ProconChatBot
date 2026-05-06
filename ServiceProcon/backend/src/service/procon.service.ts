// src/service/procon.service.ts
import { ProconModel } from "../model/procon.model";
import { Prisma } from "@prisma/client";
import { AuditLogService } from "./auditLog.service";
import { Request } from "express";

export class ProconService {
  private proconModel: ProconModel;
  private auditLogService: AuditLogService;

  constructor() {
    this.proconModel = new ProconModel();
    this.auditLogService = new AuditLogService();
  }

  // 🔓 ROTA DEV (sem autenticação) - criar Procon
  async createProconDev(proconData: Prisma.ProconCreateInput, req?: Request) {
    const verifyIfProconExists =
      await this.proconModel.getProconByNomeAndCidade(
        proconData.nome,
        proconData.cidade,
      );

    if (verifyIfProconExists) {
      return {
        sucesso: false,
        erro: `O Procon ${proconData.nome} já existe na cidade ${proconData.cidade}`,
        mensagem: "Erro ao criar Procon",
      };
    }

    try {
      const procon = await this.proconModel.create(proconData);

      // 📝 LOG: Criação via DEV
      await this.auditLogService.registrar({
        usuario_id: 1, // Usuário DEV padrão
        acao: "CREATE_PROCON_DEV",
        dados_novos: {
          id: procon.PROCON_ID,
          nome: procon.nome,
          cidade: procon.cidade,
          estado: procon.estado,
        },
        req,
      });

      return {
        sucesso: true,
        dados: procon,
        mensagem: "Procon criado com sucesso!",
      };
    } catch (error: any) {
      return {
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao criar Procon",
      };
    }
  }

  // 🔒 ROTA AUTENTICADA - criar Procon (apenas COORDENADOR, DIRETOR, DEV)
  async createProcon(
    proconData: Prisma.ProconCreateInput,
    usuarioLogado: any,
    req?: Request,
  ) {
    // 1. Validar autenticação
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    // 2. Validar permissão (apenas COORDENADOR, DIRETOR, DEV)
    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para criar Procon.`,
      );
    }

    // 3. Validar se já existe
    const verifyIfProconExists =
      await this.proconModel.getProconByNomeAndCidade(
        proconData.nome,
        proconData.cidade,
      );

    if (verifyIfProconExists) {
      throw new Error(
        `Procon ${proconData.nome} já existe na cidade ${proconData.cidade}`,
      );
    }

    // 4. Criar Procon
    const procon = await this.proconModel.create(proconData);

    // 📝 LOG: Criação de Procon
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "CREATE_PROCON",
      dados_novos: {
        id: procon.PROCON_ID,
        nome: procon.nome,
        cidade: procon.cidade,
        estado: procon.estado,
        endereco: procon.endereco,
        telefone: procon.telefone,
        email: procon.email,
      },
      req,
    });

    return {
      id: procon.PROCON_ID,
      nome: procon.nome,
      cidade: procon.cidade,
      estado: procon.estado,
      endereco: procon.endereco,
      telefone: procon.telefone,
      email: procon.email,
      horario_abertura: procon.horario_abertura,
      horario_fechamento: procon.horario_fechamento,
      duracao_atendimento_minutos: procon.duracao_atendimento_minutos,
      vagas_por_horario: procon.vagas_por_horario,
      ativo: procon.ativo,
      criado_por: usuarioLogado.id,
      criado_por_nome: usuarioLogado.nome,
    };
  }

  // 🔒 LISTAR todos os Procons (apenas COORDENADOR, DIRETOR, DEV)
  async listarProcons(usuarioLogado: any) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para listar Procons.`,
      );
    }

    return this.proconModel.findAll();
  }

  // 🔒 BUSCAR Procon por ID (apenas COORDENADOR, DIRETOR, DEV)
  async buscarProconPorId(id: number, usuarioLogado: any) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para visualizar Procons.`,
      );
    }

    const procon = await this.proconModel.findById(id);
    if (!procon) {
      throw new Error("Procon não encontrado");
    }

    return procon;
  }

  // 🔒 ATUALIZAR Procon (apenas COORDENADOR, DIRETOR, DEV)
  async atualizarProcon(
    id: number,
    data: Prisma.ProconUpdateInput,
    usuarioLogado: any,
    req?: Request,
  ) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para atualizar Procons.`,
      );
    }

    const proconExistente = await this.proconModel.findById(id);
    if (!proconExistente) {
      throw new Error("Procon não encontrado");
    }

    // Guardar dados anteriores
    const dadosAnteriores = {
      nome: proconExistente.nome,
      cidade: proconExistente.cidade,
      estado: proconExistente.estado,
      endereco: proconExistente.endereco,
      telefone: proconExistente.telefone,
      email: proconExistente.email,
      horario_abertura: proconExistente.horario_abertura,
      horario_fechamento: proconExistente.horario_fechamento,
      duracao_atendimento_minutos: proconExistente.duracao_atendimento_minutos,
      vagas_por_horario: proconExistente.vagas_por_horario,
    };

    // Se estiver mudando nome/cidade, verificar duplicidade
    if (data.nome || data.cidade) {
      const nome = (data.nome as string) || proconExistente.nome;
      const cidade = (data.cidade as string) || proconExistente.cidade;

      const proconDuplicado = await this.proconModel.getProconByNomeAndCidade(
        nome,
        cidade,
      );
      if (proconDuplicado && proconDuplicado.PROCON_ID !== id) {
        throw new Error(
          `Já existe um Procon com nome ${nome} na cidade ${cidade}`,
        );
      }
    }

    const proconAtualizado = await this.proconModel.update(id, data);

    // 📝 LOG: Atualização de Procon
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "UPDATE_PROCON",
      dados_anteriores: dadosAnteriores,
      dados_novos: {
        nome: proconAtualizado.nome,
        cidade: proconAtualizado.cidade,
        estado: proconAtualizado.estado,
        endereco: proconAtualizado.endereco,
        telefone: proconAtualizado.telefone,
        email: proconAtualizado.email,
      },
      req,
    });

    return {
      id: proconAtualizado.PROCON_ID,
      nome: proconAtualizado.nome,
      cidade: proconAtualizado.cidade,
      estado: proconAtualizado.estado,
      endereco: proconAtualizado.endereco,
      telefone: proconAtualizado.telefone,
      email: proconAtualizado.email,
      horario_abertura: proconAtualizado.horario_abertura,
      horario_fechamento: proconAtualizado.horario_fechamento,
      duracao_atendimento_minutos: proconAtualizado.duracao_atendimento_minutos,
      vagas_por_horario: proconAtualizado.vagas_por_horario,
      atualizado_por: usuarioLogado.id,
      atualizado_por_nome: usuarioLogado.nome,
    };
  }

  // 🔒 DELETAR Procon (apenas DIRETOR, DEV)
  async deletarProcon(id: number, usuarioLogado: any, req?: Request) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para deletar Procons.`,
      );
    }

    const proconExistente = await this.proconModel.findById(id);
    if (!proconExistente) {
      throw new Error("Procon não encontrado");
    }

    // Guardar dados antes da exclusão
    const dadosProcon = {
      id: proconExistente.PROCON_ID,
      nome: proconExistente.nome,
      cidade: proconExistente.cidade,
      estado: proconExistente.estado,
    };

    await this.proconModel.delete(id);

    // 📝 LOG: Exclusão de Procon
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "DELETE_PROCON",
      dados_anteriores: dadosProcon,
      req,
    });

    return {
      id: proconExistente.PROCON_ID,
      nome: proconExistente.nome,
      cidade: proconExistente.cidade,
      deletado_por: usuarioLogado.id,
      deletado_por_nome: usuarioLogado.nome,
    };
  }

  async desativarProcon(id: number, usuarioLogado: any, req?: Request) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para desativar Procons.`,
      );
    }

    const proconExistente = await this.proconModel.findById(id);
    if (!proconExistente) {
      throw new Error("Procon não encontrado");
    }

    if (!proconExistente.ativo) {
      throw new Error(`Procon ${proconExistente.nome} já está desativado.`);
    }

    const dadosAnteriores = {
      ativo: proconExistente.ativo,
    };

    const proconDesativado = await this.proconModel.desativar(id);

    // 📝 LOG: Desativação de Procon
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "DESATIVAR_PROCON",
      dados_anteriores: dadosAnteriores,
      dados_novos: { ativo: false },
      req,
    });

    return {
      id: proconDesativado.PROCON_ID,
      nome: proconDesativado.nome,
      cidade: proconDesativado.cidade,
      ativo: proconDesativado.ativo,
      desativado_por: usuarioLogado.id,
      desativado_por_nome: usuarioLogado.nome,
    };
  }

  async ativarProcon(id: number, usuarioLogado: any, req?: Request) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para ativar Procons.`,
      );
    }

    const proconExistente = await this.proconModel.findById(id);
    if (!proconExistente) {
      throw new Error("Procon não encontrado");
    }

    if (proconExistente.ativo) {
      throw new Error(`Procon ${proconExistente.nome} já está ativo.`);
    }

    const dadosAnteriores = {
      ativo: proconExistente.ativo,
    };

    const proconAtivado = await this.proconModel.ativar(id);

    // 📝 LOG: Ativação de Procon
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "ATIVAR_PROCON",
      dados_anteriores: dadosAnteriores,
      dados_novos: { ativo: true },
      req,
    });

    return {
      id: proconAtivado.PROCON_ID,
      nome: proconAtivado.nome,
      cidade: proconAtivado.cidade,
      ativo: proconAtivado.ativo,
      ativado_por: usuarioLogado.id,
      ativado_por_nome: usuarioLogado.nome,
    };
  }

  // 🟢 ROTA PÚBLICA - sem log (WhatsApp)
  async listarProconsAtivos() {
    return this.proconModel.findAllAtivos();
  }

  async buscarPorWhatsApp(whatsappNumber: string) {
    // Remover caracteres não numéricos para comparação
    const numeroLimpo = whatsappNumber.replace(/\D/g, "");

    console.log(`🔍 Buscando Procon com WhatsApp: ${numeroLimpo}`);

    const procon = await this.proconModel.findByWhatsApp(numeroLimpo);

    if (!procon) {
      console.log(`❌ Nenhum Procon encontrado para o número ${numeroLimpo}`);
      return null;
    }

    console.log(`✅ Procon encontrado: ${procon.nome} - ${procon.cidade}`);
    return procon;
  }
}
