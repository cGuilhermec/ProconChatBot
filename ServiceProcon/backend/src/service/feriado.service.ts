// src/service/feriado.service.ts
import { FeriadoModel } from "../model/feriado.model";
import { AuditLogService } from "./auditLog.service";
import { Request } from "express";

export class FeriadoService {
  private feriadoModel: FeriadoModel;
  private auditLogService: AuditLogService;

  constructor() {
    this.feriadoModel = new FeriadoModel();
    this.auditLogService = new AuditLogService();
  }

  // 🔒 Criar feriado (apenas coordenador/diretor/dev)
  async create(
    data: { procon_id: number; data: Date; nome: string; recorrente: boolean },
    usuarioLogado: any,
    req?: Request,
  ) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para criar feriados.`,
      );
    }

    const existingFeriado = await this.feriadoModel.findByData(
      data.procon_id,
      data.data,
    );

    if (existingFeriado) {
      throw new Error(
        `Já existe um feriado cadastrado para esta data neste Procon.`,
      );
    }

    const feriado = await this.feriadoModel.create({
      procon: {
        connect: { PROCON_ID: data.procon_id },
      },
      data: data.data,
      nome: data.nome,
      recorrente: data.recorrente,
    });

    // 📝 LOG: Criação de feriado
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "CREATE_FERIADO",
      dados_novos: {
        id: feriado.FERIADO_ID,
        procon_id: feriado.procon_id,
        data: feriado.data,
        nome: feriado.nome,
        recorrente: feriado.recorrente,
      },
      req,
    });

    return {
      id: feriado.FERIADO_ID,
      procon_id: feriado.procon_id,
      data: feriado.data,
      nome: feriado.nome,
      recorrente: feriado.recorrente,
      criado_por: usuarioLogado.id,
      criado_por_nome: usuarioLogado.nome,
    };
  }

  // 🟢 Listar feriados (qualquer um pode ver) - SEM LOG
  async listarFeriados(proconId?: number) {
    return this.feriadoModel.findAll(proconId);
  }

  // 🟢 Buscar feriado por ID (qualquer um pode ver) - SEM LOG
  async buscarFeriadoPorId(id: number) {
    const feriado = await this.feriadoModel.findById(id);
    if (!feriado) {
      throw new Error("Feriado não encontrado");
    }
    return feriado;
  }

  // 🔒 Atualizar feriado (apenas coordenador/diretor/dev)
  async atualizarFeriado(
    id: number,
    data: { data?: Date; nome?: string; recorrente?: boolean },
    usuarioLogado: any,
    req?: Request,
  ) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para atualizar feriados.`,
      );
    }

    const feriadoExistente = await this.feriadoModel.findById(id);
    if (!feriadoExistente) {
      throw new Error("Feriado não encontrado");
    }

    const dadosAnteriores = {
      data: feriadoExistente.data,
      nome: feriadoExistente.nome,
      recorrente: feriadoExistente.recorrente,
    };

    if (data.data) {
      const feriadoDuplicado = await this.feriadoModel.findByData(
        feriadoExistente.procon_id,
        data.data,
      );

      if (feriadoDuplicado && feriadoDuplicado.FERIADO_ID !== id) {
        throw new Error(`Já existe um feriado nesta data para este Procon.`);
      }
    }

    const feriado = await this.feriadoModel.update(id, data);

    // 📝 LOG: Atualização de feriado
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "UPDATE_FERIADO",
      dados_anteriores: dadosAnteriores,
      dados_novos: {
        data: feriado.data,
        nome: feriado.nome,
        recorrente: feriado.recorrente,
      },
      req,
    });

    return {
      id: feriado.FERIADO_ID,
      procon_id: feriado.procon_id,
      data: feriado.data,
      nome: feriado.nome,
      recorrente: feriado.recorrente,
      atualizado_por: usuarioLogado.id,
      atualizado_por_nome: usuarioLogado.nome,
    };
  }

  // 🔒 Excluir feriado (apenas coordenador/diretor/dev)
  async excluirFeriado(id: number, usuarioLogado: any, req?: Request) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error(
        `Acesso negado. Seu role ${usuarioLogado.role} não tem permissão para excluir feriados.`,
      );
    }

    const feriadoExistente = await this.feriadoModel.findById(id);
    if (!feriadoExistente) {
      throw new Error("Feriado não encontrado");
    }

    const dadosFeriado = {
      id: feriadoExistente.FERIADO_ID,
      nome: feriadoExistente.nome,
      data: feriadoExistente.data,
    };

    await this.feriadoModel.delete(id);

    // 📝 LOG: Exclusão de feriado
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "DELETE_FERIADO",
      dados_anteriores: dadosFeriado,
      req,
    });

    return {
      id: feriadoExistente.FERIADO_ID,
      nome: feriadoExistente.nome,
      data: feriadoExistente.data,
      excluido_por: usuarioLogado.id,
      excluido_por_nome: usuarioLogado.nome,
    };
  }

  // 🟢 Verificar se uma data é feriado (público) - SEM LOG
  async isFeriado(proconId: number, data: Date): Promise<boolean> {
    return this.feriadoModel.isFeriado(proconId, data);
  }
}
