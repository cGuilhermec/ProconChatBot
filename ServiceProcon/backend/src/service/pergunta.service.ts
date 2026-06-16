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

  // src/service/pergunta.service.ts

  // src/service/pergunta.service.ts

  async buscarPerguntasRag(proconId: number, pergunta: string) {
    console.log(`🔍 RAG - Buscando por: "${pergunta}"`);

    // Limpar a pergunta (remover pontuação, etc)
    const perguntaLimpa = pergunta
      .toLowerCase()
      .replace(/[?¿!¡.,;:]/g, "")
      .trim();

    // Extrair palavras-chave da pergunta do usuário
    const palavrasChaveUsuario = this.extractImportantWords(perguntaLimpa);
    console.log(`📝 Palavras-chave da pergunta:`, palavrasChaveUsuario);

    // Se não tem palavras-chave relevantes (pergunta muito vaga), retorna vazio
    if (palavrasChaveUsuario.length === 0) {
      console.log(`⚠️ Pergunta sem palavras-chave relevantes`);
      return [];
    }

    // Primeira tentativa: busca com a frase completa
    let resultados = await this.perguntaModel.buscarPorSimilaridade(
      proconId,
      perguntaLimpa,
    );

    // Filtrar resultados irrelevantes
    resultados = this.filtrarResultadosRelevantes(
      resultados,
      palavrasChaveUsuario,
      perguntaLimpa,
    );

    // Se encontrou resultados relevantes, retorna
    if (resultados.length > 0) {
      console.log(
        `✅ RAG - Encontrou ${resultados.length} resultados relevantes`,
      );
      return resultados;
    }

    // Segunda tentativa: buscar por palavras-chave individuais
    let resultadosPorPalavra: any[] = [];
    for (const palavra of palavrasChaveUsuario) {
      if (palavra.length >= 3) {
        const busca = await this.perguntaModel.buscarPorSimilaridade(
          proconId,
          palavra,
        );
        resultadosPorPalavra.push(...busca);
      }
    }

    // Remover duplicatas
    const resultadosUnicos = Array.from(
      new Map(
        resultadosPorPalavra.map((item) => [item.Pergunta_ID, item]),
      ).values(),
    );

    // Filtrar resultados irrelevantes
    const resultadosFiltrados = this.filtrarResultadosRelevantes(
      resultadosUnicos,
      palavrasChaveUsuario,
      perguntaLimpa,
    );

    if (resultadosFiltrados.length === 0) {
      console.log(
        `⚠️ Nenhum resultado relevante encontrado para: "${pergunta}"`,
      );
      return [];
    }

    console.log(`✅ RAG - Encontrou ${resultadosFiltrados.length} resultados`);
    return resultadosFiltrados.slice(0, 3);
  }

  /**
   * Filtra resultados irrelevantes baseado nas palavras-chave da pergunta
   */
  private filtrarResultadosRelevantes(
    resultados: any[],
    palavrasChaveUsuario: string[],
    perguntaOriginal: string,
  ): any[] {
    return resultados.filter((resultado) => {
      // Verificar se pelo menos UMA palavra-chave do usuário aparece no resultado
      const temPalavraChave = palavrasChaveUsuario.some((palavra) => {
        return (
          resultado.tema?.toLowerCase().includes(palavra) ||
          resultado.pergunta?.toLowerCase().includes(palavra) ||
          resultado.resposta?.toLowerCase().includes(palavra)
        );
      });

      if (!temPalavraChave) {
        console.log(
          `❌ Resultado irrelevante: "${resultado.tema}" - nenhuma palavra-chave encontrada`,
        );
        return false;
      }

      // Verificar se o score é minimamente aceitável
      if (resultado.score < 15) {
        console.log(
          `❌ Resultado com score muito baixo: ${resultado.tema} (${resultado.score})`,
        );
        return false;
      }

      // Caso especial: se a pergunta tem "estacionamento" e o resultado não tem nada relacionado
      if (
        perguntaOriginal.includes("estacionamento") &&
        !resultado.tema?.toLowerCase().includes("estacionamento") &&
        !resultado.pergunta?.toLowerCase().includes("estacionamento") &&
        !resultado.resposta?.toLowerCase().includes("estacionamento")
      ) {
        console.log(
          `❌ Resultado irrelevante: pergunta sobre estacionamento, mas resultado não tem relação`,
        );
        return false;
      }

      // Caso especial: se a pergunta tem "procon" e "jacarei" (local específico)
      if (
        perguntaOriginal.includes("jacarei") &&
        !resultado.resposta?.toLowerCase().includes("jacarei")
      ) {
        console.log(
          `❌ Resultado irrelevante: pergunta específica sobre Jacareí, mas resposta não menciona`,
        );
        return false;
      }

      return true;
    });
  }

  private extractImportantWords(frase: string): string[] {
    const stopWords = [
      "o",
      "a",
      "os",
      "as",
      "um",
      "uma",
      "uns",
      "umas",
      "de",
      "da",
      "do",
      "das",
      "dos",
      "em",
      "no",
      "na",
      "nos",
      "nas",
      "para",
      "com",
      "por",
      "tem",
      "ter",
      "há",
      "ha",
      "como",
      "que",
      "qual",
      "quais",
      "onde",
      "quando",
      "pode",
      "ser",
      "estar",
      "está",
      "e",
      "é",
      "aqui",
      "ali",
      "la",
      "lá",
      "isso",
      "aquilo",
      "este",
      "esse",
      "aquele",
      "sobre",
      "entre",
      "sem",
      "sob",
      "trás",
      "após",
      "antes",
      "durante",
      "mediante",
    ];

    return frase
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (palavra) =>
          palavra.length > 2 &&
          !stopWords.includes(palavra) &&
          !palavra.match(/^\d+$/),
      );
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

    // 🔥 ALTERAÇÃO: TODA pergunta vai para PENDENTE_REVISAO
    const statusModeracao = "PENDENTE_REVISAO"; // Sempre pendente
    const ativo = false; // Sempre inativo até aprovação

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
      palavras_detectadas: palavras.length > 0 ? palavras : [], // Mantém registro mesmo se vazio
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

    // 🔥 SEMPRE notificar coordenadores, independente de palavras detectadas
    const coordenadores = await this.buscarCoordenadores(data.procon_id);

    for (const coord of coordenadores) {
      // Define o tipo de notificação baseado na gravidade das palavras
      let tipo: TipoNotificacao = "PENDENTE_REVISAO";
      let mensagem = `Nova pergunta aguardando revisão.`;

      if (palavras.length > 0) {
        tipo = gravidadeMaxima >= 5 ? "REVISAO_URGENTE" : "PENDENTE_REVISAO";
        mensagem = `Nova pergunta aguardando revisão. Palavras detectadas: ${palavras.join(", ")}`;
      }

      await this.notificacaoModel.create({
        usuario: {
          connect: { USUARIO_ID: coord.USUARIO_ID },
        },
        pergunta: {
          connect: { Pergunta_ID: pergunta.Pergunta_ID },
        },
        tipo: tipo,
        mensagem: mensagem,
        palavras_encontradas: palavras,
        gravidade: palavras.length > 0 ? gravidadeMaxima : 1,
      });
    }

    // 🔔 Emitir notificação em tempo real para coordenadores via WebSocket
    io.to("coordenadores").emit("nova_pergunta_pendente", {
      pergunta_id: pergunta.Pergunta_ID,
      tema: pergunta.tema,
      pergunta: pergunta.pergunta,
      criado_por: usuarioLogado.nome,
      palavras: palavras,
      tem_palavras_sensiveis: palavras.length > 0,
      created_at: new Date(),
    });

    console.log(
      `📢 WebSocket: Notificação enviada para coordenadores sobre pergunta ID: ${pergunta.Pergunta_ID} (${palavras.length > 0 ? "com" : "sem"} palavras sensíveis)`,
    );

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
      ativo: perguntaExistente.ativo,
    };

    // Detectar palavras sensíveis no conteúdo editado
    const textoCompleto = `${data.pergunta || perguntaExistente.pergunta} ${data.resposta || perguntaExistente.resposta} ${data.observacao || perguntaExistente.observacao || ""}`;
    const { palavras, gravidadeMaxima } =
      this.detectarPalavrasSensiveis(textoCompleto);

    const updateData: any = {
      ...data,
      atualizado_por: usuarioLogado.id,
      versao: perguntaExistente.versao + 1,
      updated_at: new Date(),
      // 🔥 ALTERAÇÃO: Sempre volta para validação ao editar
      status_moderacao: "PENDENTE_REVISAO",
      ativo: false,
      palavras_detectadas: palavras.length > 0 ? palavras : [],
    };

    // Se NÃO houver palavras ofensivas, ainda assim fica pendente (precisa de aprovação)
    // Se houver palavras ofensivas, a notificação será de urgência

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
        status_moderacao: "PENDENTE_REVISAO",
        palavras_detectadas: palavras,
      },
      pergunta_id: id,
      req,
    });

    // 🔥 SEMPRE notificar coordenadores sobre a edição
    const coordenadores = await this.buscarCoordenadores(
      perguntaExistente.procon_id,
    );

    for (const coord of coordenadores) {
      let tipo: TipoNotificacao = "PENDENTE_REVISAO";
      let mensagem = `Pergunta "${perguntaExistente.tema}" foi editada e aguarda revisão.`;

      if (palavras.length > 0) {
        tipo = gravidadeMaxima >= 5 ? "REVISAO_URGENTE" : "PENDENTE_REVISAO";
        mensagem = `Pergunta "${perguntaExistente.tema}" foi editada e contém palavras sensíveis: ${palavras.join(", ")}. Revisão urgente necessária!`;
      }

      await this.notificacaoModel.create({
        usuario: {
          connect: { USUARIO_ID: coord.USUARIO_ID },
        },
        pergunta: {
          connect: { Pergunta_ID: id },
        },
        tipo: tipo,
        mensagem: mensagem,
        palavras_encontradas: palavras,
        gravidade: palavras.length > 0 ? gravidadeMaxima : 1,
      });
    }

    // 🔔 Emitir notificação em tempo real
    io.to("coordenadores").emit("pergunta_editada_pendente", {
      pergunta_id: id,
      tema: pergunta.tema,
      pergunta: pergunta.pergunta,
      editado_por: usuarioLogado.nome,
      palavras: palavras,
      tem_palavras_sensiveis: palavras.length > 0,
      updated_at: new Date(),
    });

    console.log(
      `📢 WebSocket: Notificação de edição enviada para coordenadores sobre pergunta ID: ${id} (${palavras.length > 0 ? "com" : "sem"} palavras sensíveis)`,
    );

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
