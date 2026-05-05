// src/__tests__/pergunta/public.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Pergunta - Rotas Públicas (RAG)", () => {
  let proconId: number;
  let tokenAdmin: string;

  before(async () => {
    console.log("🚀 Criando dados para testes de Pergunta...");

    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    const admin = await DbHelper.createTestUser("DEV", proconId);
    tokenAdmin = await DbHelper.getToken(admin.email);

    // Criar algumas perguntas para os testes
    await apiRequest("/pergunta", {
      method: "POST",
      token: tokenAdmin,
      body: {
        procon_id: proconId,
        tema: "cobranca_servico_nao_contratado",
        pergunta: "Estão cobrando um seguro no meu cartão que não contratei",
        resposta: "O consumidor pode registrar reclamação no Procon...",
        base_legal: ["Art. 6º, III, CDC"],
        documentos: ["RG", "CPF", "Faturas"],
      },
    });

    await apiRequest("/pergunta", {
      method: "POST",
      token: tokenAdmin,
      body: {
        procon_id: proconId,
        tema: "cancelamento_plano_telefone",
        pergunta: "Não consigo cancelar meu plano de telefone",
        resposta: "O consumidor pode registrar reclamação no Procon...",
        base_legal: ["Art. 39, V, CDC"],
        documentos: ["Contrato", "Faturas"],
      },
    });

    console.log(`✅ Procon ID: ${proconId}`);
  });

  // ============ TESTES DE BUSCA RAG ============

  describe("POST /perguntas/buscar - Busca RAG", () => {
    it("Deve retornar perguntas relevantes para a consulta", async () => {
      const response = await apiRequest("/perguntas/buscar", {
        method: "POST",
        body: {
          procon_id: proconId,
          pergunta: "seguro no cartão",
        },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.resultados));
    });

    it("Deve retornar erro 400 quando procon_id não é informado", async () => {
      const response = await apiRequest("/perguntas/buscar", {
        method: "POST",
        body: {
          pergunta: "seguro no cartão",
        },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });

    it("Deve retornar erro 400 quando pergunta não é informada", async () => {
      const response = await apiRequest("/perguntas/buscar", {
        method: "POST",
        body: {
          procon_id: proconId,
        },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE LISTAGEM PÚBLICA ============

  describe("GET /perguntas - Listar perguntas públicas", () => {
    it("Deve listar perguntas com sucesso", async () => {
      const response = await apiRequest("/perguntas", {
        method: "GET",
        query: { procon_id: String(proconId) },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.dados));
      assert.ok(response.body.total > 0);
    });

    it("Deve retornar erro 400 quando procon_id não é informado", async () => {
      const response = await apiRequest("/perguntas", {
        method: "GET",
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE BUSCA POR ID ============

  describe("GET /pergunta/:id - Buscar pergunta por ID", () => {
    let perguntaId: number;

    before(async () => {
      const response = await apiRequest("/perguntas", {
        method: "GET",
        query: { procon_id: String(proconId) },
      });
      perguntaId = response.body.dados[0].Pergunta_ID;
    });

    it("Deve buscar pergunta por ID com sucesso", async () => {
      const response = await apiRequest(`/pergunta/${perguntaId}`, {
        method: "GET",
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.Pergunta_ID, perguntaId);
    });

    it("Deve retornar erro 404 quando pergunta não existe", async () => {
      const response = await apiRequest("/pergunta/99999", {
        method: "GET",
      });

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.sucesso, false);
    });
  });
});
