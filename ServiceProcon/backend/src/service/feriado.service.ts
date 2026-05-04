// src/service/feriado.service.ts
import { FeriadoModel } from "../model/feriado.model";
import { Prisma } from "@prisma/client";

export class FeriadoService {
  private feriadoModel: FeriadoModel;

  constructor() {
    this.feriadoModel = new FeriadoModel();
  }

  // 🔒 Criar feriado (apenas coordenador/diretor/dev)
  async create(
    data: { procon_id: number; data: Date; nome: string; recorrente: boolean },
    usuarioLogado: any,
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

    // Verificar se já existe feriado na mesma data para este Procon
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
        connect: { PROCON_ID: data.procon_id }, // Conectar pelo relacionamento
      },
      data: data.data,
      nome: data.nome,
      recorrente: data.recorrente,
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

  // 🟢 Listar feriados (qualquer um pode ver)
  async listarFeriados(proconId?: number) {
    return this.feriadoModel.findAll(proconId);
  }

  // 🟢 Buscar feriado por ID (qualquer um pode ver)
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

    // Se estiver mudando a data, verificar duplicidade
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
  async excluirFeriado(id: number, usuarioLogado: any) {
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

    await this.feriadoModel.delete(id);

    return {
      id: feriadoExistente.FERIADO_ID,
      nome: feriadoExistente.nome,
      data: feriadoExistente.data,
      excluido_por: usuarioLogado.id,
      excluido_por_nome: usuarioLogado.nome,
    };
  }

  // 🟢 Verificar se uma data é feriado (público)
  // src/service/feriado.service.ts

  async isFeriado(proconId: number, data: Date): Promise<boolean> {
    return this.feriadoModel.isFeriado(proconId, data);
  }
}
