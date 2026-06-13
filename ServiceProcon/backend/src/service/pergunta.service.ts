// src/service/pergunta.service.ts
import { NotificacaoModel } from "../model/notificacao.model";
import { PerguntaModel } from "../model/pergunta.model";
import { io } from "../server";
import { AuditLogService } from "./auditLog.service";
import { Prisma, StatusModeracao, TipoNotificacao } from "@prisma/client";
import { Request } from "express";

// Lista de palavras sensíveis (mantém igual)
const PALAVRAS_SENSIVEIS: Record<
  string,
  { gravidade: number; categoria: string }
> = {
  // Homofobia
  viado: { gravidade: 5, categoria: "homofobia" },
  viada: { gravidade: 5, categoria: "homofobia" },
  viadinho: { gravidade: 5, categoria: "homofobia" },
  bicha: { gravidade: 5, categoria: "homofobia" },
  bichinha: { gravidade: 5, categoria: "homofobia" },
  sapatão: { gravidade: 5, categoria: "homofobia" },
  sapatona: { gravidade: 5, categoria: "homofobia" },
  boiola: { gravidade: 5, categoria: "homofobia" },
  boiolinha: { gravidade: 5, categoria: "homofobia" },
  gay: { gravidade: 3, categoria: "homofobia" },

  // Xenofobia
  brazuca: { gravidade: 4, categoria: "xenofobia" },
  paraíba: { gravidade: 4, categoria: "xenofobia" },
  baiano: { gravidade: 4, categoria: "xenofobia" },
  argentino: { gravidade: 3, categoria: "xenofobia" },

  // Racismo
  macaco: { gravidade: 5, categoria: "racismo" },
  macaca: { gravidade: 5, categoria: "racismo" },
  preto: { gravidade: 3, categoria: "racismo" },
  crioulo: { gravidade: 5, categoria: "racismo" },
  crioula: { gravidade: 5, categoria: "racismo" },
  neguinho: { gravidade: 4, categoria: "racismo" },
};

export class PerguntaService {
  private perguntaModel: PerguntaModel;
  private notificacaoModel: NotificacaoModel;
  private auditLogService: AuditLogService;

  constructor() {
    this.perguntaModel = new PerguntaModel();
    this.notificacaoModel = new NotificacaoModel();
    this.auditLogService = new AuditLogService();
  }

  // ============ MÉTODO PRIVADO ============

  private detectarPalavrasSensiveis(texto: string): {
    palavras: string[];
    gravidadeMaxima: number;
  } {
    const textoLower = texto.toLowerCase();
    const palavrasEncontradas: string[] = [];
    let gravidadeMaxima = 0;

    for (const [palavra, info] of Object.entries(PALAVRAS_SENSIVEIS)) {
      if (textoLower.includes(palavra)) {
        palavrasEncontradas.push(palavra);
        if (info.gravidade > gravidadeMaxima) {
          gravidadeMaxima = info.gravidade;
        }
      }
    }

    return { palavras: palavrasEncontradas, gravidadeMaxima };
  }

  // ============ ROTAS PÚBLICAS (RAG - WhatsApp) - SEM LOG ============

  async buscarPerguntasRag(proconId: number, pergunta: string) {
    // 🔥 CORREÇÃO: Não dividir em palavras, usar a frase completa
    console.log(`🔍 RAG - Buscando por: "${pergunta}"`);

    // Buscar diretamente sem dividir em palavras
    const busca = await this.perguntaModel.buscarPorSimilaridade(
      proconId,
      pergunta,
    );

    if (busca.length > 0) {
      console.log(`✅ RAG - Encontrou ${busca.length} resultados`);
      return busca;
    }

    // Se não encontrou com a frase completa, tenta dividir em palavras
    const termos = pergunta.toLowerCase().split(/\s+/);
    let resultados: any[] = [];

    for (const termo of termos) {
      if (termo.length > 1) {
        // Agora aceita palavras com 2+ letras
        const buscaPorPalavra = await this.perguntaModel.buscarPorSimilaridade(
          proconId,
          termo,
        );
        resultados.push(...buscaPorPalavra);
      }
    }

    // Remove duplicatas
    const resultadosUnicos = Array.from(
      new Map(resultados.map((item) => [item.Pergunta_ID, item])).values(),
    );

    console.log(
      `✅ RAG - Encontrou ${resultadosUnicos.length} resultados (por palavras)`,
    );
    return resultadosUnicos.slice(0, 5);
  }

  async listarPerguntasPublicas(proconId: number) {
    return this.perguntaModel.findAllAtivas(proconId);
  }

  async buscarPerguntaPublica(id: number) {
    const pergunta = await this.perguntaModel.findById(id);
    if (
      !pergunta ||
      !pergunta.ativo ||
      pergunta.status_moderacao !== "APROVADO"
    ) {
      throw new Error("Pergunta não encontrada ou não disponível");
    }
    return pergunta;
  }

  // ============ ROTAS ADMINISTRATIVAS - COM LOG ============

  async criarPergunta(
    data: {
      procon_id: number;
      tema: string;
      pergunta: string;
      resposta: string;
      base_legal?: any;
      documentos?: any;
      observacao?: string;
    },
    usuarioLogado: any,
    req?: Request,
  ) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const perguntaExistente = await this.perguntaModel.findByTema(
      data.tema,
      data.procon_id,
    );
    if (perguntaExistente) {
      throw new Error(`Já existe uma pergunta com o tema: ${data.tema}`);
    }

    const textoCompleto = `${data.pergunta} ${data.resposta} ${data.observacao || ""}`;
    const { palavras, gravidadeMaxima } =
      this.detectarPalavrasSensiveis(textoCompleto);

    const statusModeracao =
      palavras.length > 0 ? "PENDENTE_REVISAO" : "APROVADO";
    const ativo = statusModeracao === "APROVADO";

    const pergunta = await this.perguntaModel.create({
      procon_id: data.procon_id,
      criado_por: usuarioLogado.id,
      atualizado_por: usuarioLogado.id,
      tema: data.tema,
      pergunta: data.pergunta,
      resposta: data.resposta,
      base_legal: data.base_legal,
      documentos: data.documentos,
      observacao: data.observacao,
      ativo,
      versao: 1,
      status_moderacao: statusModeracao,
      palavras_detectadas: palavras,
    });

    // 📝 LOG: Criação de pergunta
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "CREATE_PERGUNTA",
      dados_novos: {
        id: pergunta.Pergunta_ID,
        tema: pergunta.tema,
        pergunta: pergunta.pergunta,
        status_moderacao: pergunta.status_moderacao,
        palavras_detectadas: palavras,
      },
      req,
    });

    if (palavras.length > 0) {
      const coordenadores = await this.buscarCoordenadores(data.procon_id);
      for (const coord of coordenadores) {
        await this.notificacaoModel.create({
          usuario: {
            connect: { USUARIO_ID: coord.USUARIO_ID },
          },
          pergunta: {
            connect: { Pergunta_ID: pergunta.Pergunta_ID },
          },
          tipo: gravidadeMaxima >= 5 ? "REVISAO_URGENTE" : "PENDENTE_REVISAO",
          mensagem: `Nova pergunta aguardando revisão. Palavras detectadas: ${palavras.join(", ")}`,
          palavras_encontradas: palavras,
          gravidade: gravidadeMaxima,
        });
      }

      // 🔔 Emitir notificação em tempo real para coordenadores via WebSocket
      io.to("coordenadores").emit("nova_pergunta_pendente", {
        pergunta_id: pergunta.Pergunta_ID,
        tema: pergunta.tema,
        pergunta: pergunta.pergunta,
        criado_por: usuarioLogado.nome,
        palavras: palavras,
        created_at: new Date(),
      });

      console.log(
        `📢 WebSocket: Notificação enviada para coordenadores sobre pergunta ID: ${pergunta.Pergunta_ID}`,
      );
    }

    return {
      id: pergunta.Pergunta_ID,
      tema: pergunta.tema,
      pergunta: pergunta.pergunta,
      resposta: pergunta.resposta,
      status_moderacao: pergunta.status_moderacao,
      palavras_detectadas: pergunta.palavras_detectadas,
      criado_por: usuarioLogado.nome,
    };
  }

  async listarPerguntasAdmin(
    usuarioLogado: any,
    filtros?: { procon_id?: number; status?: string; apenasAtivos?: boolean },
  ) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para listar perguntas.");
    }

    let proconId = filtros?.procon_id;
    if (usuarioLogado.role === "COORDENADOR" && !proconId) {
      proconId = usuarioLogado.procon_id || undefined;
    }

    // Listagem não precisa de log
    return this.perguntaModel.findAll(
      proconId,
      filtros?.status as StatusModeracao,
      filtros?.apenasAtivos,
    );
  }

  async atualizarPergunta(
    id: number,
    data: any,
    usuarioLogado: any,
    req?: Request,
  ) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para atualizar perguntas.");
    }

    const perguntaExistente = await this.perguntaModel.findById(id);
    if (!perguntaExistente) {
      throw new Error("Pergunta não encontrada");
    }

    const dadosAnteriores = {
      tema: perguntaExistente.tema,
      pergunta: perguntaExistente.pergunta,
      resposta: perguntaExistente.resposta,
      status_moderacao: perguntaExistente.status_moderacao,
    };

    const textoCompleto = `${data.pergunta || ""} ${data.resposta || ""} ${data.observacao || ""}`;
    const { palavras } = this.detectarPalavrasSensiveis(textoCompleto);

    const updateData: any = {
      ...data,
      atualizado_por: usuarioLogado.id,
      versao: perguntaExistente.versao + 1,
      updated_at: new Date(),
    };

    if (
      palavras.length > 0 &&
      perguntaExistente.status_moderacao === "APROVADO"
    ) {
      updateData.status_moderacao = "PENDENTE_REVISAO";
      updateData.ativo = false;
      updateData.palavras_detectadas = palavras;
    }

    const pergunta = await this.perguntaModel.update(id, updateData);

    // 📝 LOG: Atualização de pergunta
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "UPDATE_PERGUNTA",
      dados_anteriores: dadosAnteriores,
      dados_novos: {
        tema: pergunta.tema,
        pergunta: pergunta.pergunta,
        resposta: pergunta.resposta,
      },
      pergunta_id: id,
      req,
    });

    return pergunta;
  }

  async desativarPergunta(id: number, usuarioLogado: any, req?: Request) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para desativar perguntas.");
    }

    const pergunta = await this.perguntaModel.findById(id);
    if (!pergunta) {
      throw new Error("Pergunta não encontrada");
    }

    const dadosAnteriores = { ativo: pergunta.ativo };

    const result = await this.perguntaModel.desativar(id);

    // 📝 LOG: Desativação de pergunta
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "DESATIVAR_PERGUNTA",
      dados_anteriores: dadosAnteriores,
      dados_novos: { ativo: false },
      pergunta_id: id,
      req,
    });

    return result;
  }

  async ativarPergunta(id: number, usuarioLogado: any, req?: Request) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para ativar perguntas.");
    }

    const pergunta = await this.perguntaModel.findById(id);
    if (!pergunta) {
      throw new Error("Pergunta não encontrada");
    }

    const dadosAnteriores = { ativo: pergunta.ativo };

    const result = await this.perguntaModel.ativar(id);

    // 📝 LOG: Ativação de pergunta
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "ATIVAR_PERGUNTA",
      dados_anteriores: dadosAnteriores,
      dados_novos: { ativo: true },
      pergunta_id: id,
      req,
    });

    return result;
  }

  async revisarPergunta(
    id: number,
    status: StatusModeracao,
    usuarioLogado: any,
    motivo?: string,
    req?: Request,
  ) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    const rolesPermitidos = ["COORDENADOR", "DIRETOR", "DEV"];
    if (!rolesPermitidos.includes(usuarioLogado.role)) {
      throw new Error("Acesso negado. Sem permissão para revisar perguntas.");
    }

    const pergunta = await this.perguntaModel.findById(id);
    if (!pergunta) {
      throw new Error("Pergunta não encontrada");
    }

    const dadosAnteriores = {
      status_moderacao: pergunta.status_moderacao,
      ativo: pergunta.ativo,
    };

    const perguntaRevisada = await this.perguntaModel.revisar(
      id,
      status,
      usuarioLogado.id,
      motivo,
    );

    let acao = "REVISAR_PERGUNTA";

    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao,
      dados_anteriores: dadosAnteriores,
      dados_novos: {
        status_moderacao: status,
        ativo: status === "APROVADO",
        motivo: motivo || null,
      },
      pergunta_id: id,
      req,
    });

    let tipoNotificacao: TipoNotificacao = "PERGUNTA_APROVADA";
    if (status === "REPROVADO") tipoNotificacao = "PERGUNTA_REPROVADA";
    if (status === "BLOQUEADO") tipoNotificacao = "PERGUNTA_BLOQUEADA";

    await this.notificacaoModel.create({
      usuario: {
        connect: { USUARIO_ID: pergunta.criado_por },
      },
      pergunta: {
        connect: { Pergunta_ID: id },
      },
      tipo: tipoNotificacao,
      mensagem: `Sua pergunta "${pergunta.tema}" foi ${status === "APROVADO" ? "aprovada" : status === "REPROVADO" ? "reprovada" : "bloqueada"}.${motivo ? ` Motivo: ${motivo}` : ""}`,
      palavras_encontradas: pergunta.palavras_detectadas || [],
      gravidade: 1,
    });

    return perguntaRevisada;
  }

  async excluirPergunta(id: number, usuarioLogado: any, req?: Request) {
    if (!usuarioLogado) {
      throw new Error("Usuário não autenticado");
    }

    if (usuarioLogado.role !== "DEV") {
      throw new Error(
        "Acesso negado. Apenas DEV pode excluir perguntas permanentemente.",
      );
    }

    const pergunta = await this.perguntaModel.findById(id);
    if (!pergunta) {
      throw new Error("Pergunta não encontrada");
    }

    const dadosPergunta = {
      id: pergunta.Pergunta_ID,
      tema: pergunta.tema,
      pergunta: pergunta.pergunta,
    };

    const result = await this.perguntaModel.delete(id);

    // 📝 LOG: Exclusão de pergunta
    await this.auditLogService.registrar({
      usuario_id: usuarioLogado.id,
      acao: "DELETE_PERGUNTA",
      dados_anteriores: dadosPergunta,
      pergunta_id: id,
      req,
    });

    return result;
  }

  async listarPerguntasPendentes(proconId?: number) {
    return this.perguntaModel.findAll(
      proconId,
      "PENDENTE_REVISAO" as StatusModeracao,
      undefined,
    );
  }

  private async buscarCoordenadores(proconId: number) {
    const { prisma } = await import("../config/database");
    return prisma.usuario.findMany({
      where: {
        procon_id: proconId,
        role: { in: ["COORDENADOR", "DIRETOR", "DEV"] },
        ativo: true,
      },
      select: { USUARIO_ID: true, nome: true, email: true },
    });
  }
}
