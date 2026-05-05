// src/service/auditLog.service.ts
import { AuditLogModel } from "../model/auditLog.model";
import { Request } from "express";

export interface AuditLogData {
  usuario_id: number;
  acao: string;
  dados_anteriores?: any;
  dados_novos?: any;
  pergunta_id?: number;
  req?: Request;
}

export class AuditLogService {
  private auditLogModel: AuditLogModel;

  constructor() {
    this.auditLogModel = new AuditLogModel();
  }

  async registrar(data: AuditLogData) {
    const {
      usuario_id,
      acao,
      dados_anteriores,
      dados_novos,
      pergunta_id,
      req,
    } = data;

    const ip_address = req?.ip || req?.socket?.remoteAddress || null;
    const user_agent = req?.headers?.["user-agent"] || null;

    const dadosAnterioresLimitados = dados_anteriores
      ? this.limitarTamanho(dados_anteriores)
      : null;
    const dadosNovosLimitados = dados_novos
      ? this.limitarTamanho(dados_novos)
      : null;

    const createData: any = {
      usuario: {
        connect: { USUARIO_ID: usuario_id },
      },
      acao,
      dados_anteriores: dadosAnterioresLimitados,
      dados_novos: dadosNovosLimitados,
      ip_address,
      user_agent,
    };

    if (pergunta_id) {
      createData.pergunta = {
        connect: { Pergunta_ID: pergunta_id },
      };
    }

    return this.auditLogModel.create(createData);
  }

  async meusLogs(usuarioId: number, limit: number = 50) {
    return this.auditLogModel.findByUsuario(usuarioId, limit);
  }

  async logsPorAcao(acao: string, limit: number = 100) {
    return this.auditLogModel.findByAcao(acao, limit);
  }

  async listarTodos(page: number = 1, limit: number = 50, filtros?: any) {
    return this.auditLogModel.findAll(page, limit, filtros);
  }

  private limitarTamanho(obj: any, maxSize: number = 10000): any {
    const str = JSON.stringify(obj);
    if (str.length <= maxSize) return obj;

    return {
      _resumo: `Dados muito grandes (${str.length} caracteres)`,
      _campos: Object.keys(obj).slice(0, 10),
    };
  }
}
