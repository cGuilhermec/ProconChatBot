// src/__tests__/pergunta/moderation.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Pergunta - Moderação", () => {
  let proconId: number;
  let tokenFuncionario: string;
  let tokenCoordenador: string;

  before(async () => {
    console.log("🚀 Criando dados para testes de moderação...");

    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    const funcionario = await DbHelper.createTestUser("FUNCIONARIO", proconId);
    const coordenador = await DbHelper.createTestUser("COORDENADOR", proconId);

    tokenFuncionario = await DbHelper.getToken(funcionario.email);
    tokenCoordenador = await DbHelper.getToken(coordenador.email);

    console.log(`✅ Procon ID: ${proconId}`);
  });

  // ============ TESTES DE DETECÇÃO DE PALAVRAS OFENSIVAS ============

  describe("Criação com palavras ofensivas", () => {
    it("Deve criar pergunta com status PENDENTE_REVISAO ao detectar palavra ofensiva", async () => {
      const response = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenFuncionario,
        body: {
          procon_id: proconId,
          tema: "teste_homofobia",
          pergunta: "Esse atendente é muito viado, não resolveu meu problema",
          resposta: "Resposta de teste",
        },
      });

      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(
        response.body.dados.status_moderacao,
        "PENDENTE_REVISAO",
      );
      assert.ok(response.body.dados.palavras_detectadas.includes("viado"));
      assert.ok(response.body.mensagem.includes("revisão"));
    });

    it("Deve detectar palavra ofensiva de racismo", async () => {
      const response = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenFuncionario,
        body: {
          procon_id: proconId,
          tema: "teste_racismo",
          pergunta: "Esse funcionário parece um macaco trabalhando aqui",
          resposta: "Resposta de teste",
        },
      });

      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(
        response.body.dados.status_moderacao,
        "PENDENTE_REVISAO",
      );
      assert.ok(response.body.dados.palavras_detectadas.includes("macaco"));
    });

    it("Deve criar pergunta normalmente sem palavras ofensivas", async () => {
      const response = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenFuncionario,
        body: {
          procon_id: proconId,
          tema: "teste_normal",
          pergunta: "Estão cobrando um seguro no meu cartão",
          resposta: "Resposta normal",
        },
      });

      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.status_moderacao, "APROVADO");
      assert.strictEqual(response.body.dados.palavras_detectadas.length, 0);
    });
  });

  // ============ TESTES DE LISTAGEM DE PENDENTES ============

  describe("GET /admin/perguntas/pendentes - Listar perguntas para revisão", () => {
    it("Deve listar perguntas pendentes para coordenador", async () => {
      const response = await apiRequest("/admin/perguntas/pendentes", {
        method: "GET",
        token: tokenCoordenador,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.dados));

      // Verificar se todas as pendentes têm status PENDENTE_REVISAO
      const todasPendentes = response.body.dados.every(
        (p: any) => p.status_moderacao === "PENDENTE_REVISAO",
      );
      assert.ok(todasPendentes);
    });

    it("Deve retornar erro 403 quando funcionário tenta listar pendentes", async () => {
      const response = await apiRequest("/admin/perguntas/pendentes", {
        method: "GET",
        token: tokenFuncionario,
      });

      assert.ok(
        response.status === 403 || response.status === 400,
        `Status deveria ser 403 ou 400, mas foi ${response.status}`,
      );
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE REVISÃO ============

  describe("PUT /admin/pergunta/:id/revisar - Revisar pergunta", () => {
    let perguntaPendenteId: number;

    before(async () => {
      const response = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenFuncionario,
        body: {
          procon_id: proconId,
          tema: "pergunta_para_revisar",
          pergunta: "Texto com palavra ofensiva viado para teste de revisão",
          resposta: "Resposta de teste",
        },
      });
      perguntaPendenteId = response.body.dados.id;
    });

    it("Deve aprovar pergunta pendente", async () => {
      const response = await apiRequest(
        `/admin/pergunta/${perguntaPendenteId}/revisar`,
        {
          method: "PUT",
          token: tokenCoordenador,
          body: {
            status: "APROVADO",
            motivo: "Aprovado após análise",
          },
        },
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.status_moderacao, "APROVADO");
    });

    it("Deve reprovar pergunta pendente", async () => {
      // Criar nova pergunta pendente
      const createResponse = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenFuncionario,
        body: {
          procon_id: proconId,
          tema: "pergunta_para_reprovar",
          pergunta: "Outra pergunta ofensiva com viado",
          resposta: "Resposta de teste",
        },
      });
      const novaPerguntaId = createResponse.body.dados.id;

      const response = await apiRequest(
        `/admin/pergunta/${novaPerguntaId}/revisar`,
        {
          method: "PUT",
          token: tokenCoordenador,
          body: {
            status: "REPROVADO",
            motivo: "Conteúdo ofensivo não permitido",
          },
        },
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.status_moderacao, "REPROVADO");
    });

    it("Deve retornar erro 403 quando funcionário tenta revisar", async () => {
      const response = await apiRequest(
        `/admin/pergunta/${perguntaPendenteId}/revisar`,
        {
          method: "PUT",
          token: tokenFuncionario,
          body: { status: "APROVADO" },
        },
      );

      assert.ok(
        response.status === 403 || response.status === 400,
        `Status deveria ser 403 ou 400, mas foi ${response.status}`,
      );
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE VISIBILIDADE PÓS-REVISÃO ============

  describe("Visibilidade após revisão", () => {
    let perguntaAprovadaId: number;
    let perguntaReprovadaId: number;

    before(async () => {
      // Criar pergunta para aprovação
      const aprovada = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenFuncionario,
        body: {
          procon_id: proconId,
          tema: "visibilidade_aprovada",
          pergunta: "Pergunta que será aprovada",
          resposta: "Resposta da pergunta aprovada",
        },
      });
      perguntaAprovadaId = aprovada.body.dados.id;

      // Criar pergunta para reprovação
      const reprovada = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenFuncionario,
        body: {
          procon_id: proconId,
          tema: "visibilidade_reprovada",
          pergunta: "Pergunta ofensiva com viado",
          resposta: "Resposta da pergunta reprovada",
        },
      });
      perguntaReprovadaId = reprovada.body.dados.id;

      // Aprovar uma, reprovar outra
      await apiRequest(`/admin/pergunta/${perguntaAprovadaId}/revisar`, {
        method: "PUT",
        token: tokenCoordenador,
        body: { status: "APROVADO" },
      });

      await apiRequest(`/admin/pergunta/${perguntaReprovadaId}/revisar`, {
        method: "PUT",
        token: tokenCoordenador,
        body: { status: "REPROVADO", motivo: "Conteúdo ofensivo" },
      });
    });

    it("Pergunta aprovada deve aparecer na listagem pública", async () => {
      const response = await apiRequest("/perguntas", {
        method: "GET",
        query: { procon_id: String(proconId) },
      });

      const encontrada = response.body.dados.find(
        (p: any) => p.Pergunta_ID === perguntaAprovadaId,
      );
      assert.ok(encontrada);
    });

    it("Pergunta reprovada NÃO deve aparecer na listagem pública", async () => {
      const response = await apiRequest("/perguntas", {
        method: "GET",
        query: { procon_id: String(proconId) },
      });

      const encontrada = response.body.dados.find(
        (p: any) => p.Pergunta_ID === perguntaReprovadaId,
      );
      assert.strictEqual(encontrada, undefined);
    });
  });
});
