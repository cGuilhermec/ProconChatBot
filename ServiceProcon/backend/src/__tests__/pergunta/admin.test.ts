// src/__tests__/pergunta/admin.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Pergunta - Rotas Administrativas", () => {
  let proconId: number;
  let tokenAdmin: string;
  let tokenFuncionario: string;
  let perguntaId: number;

  before(async () => {
    console.log("🚀 Criando dados para testes administrativos...");

    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    const admin = await DbHelper.createTestUser("DEV", proconId);
    const funcionario = await DbHelper.createTestUser("FUNCIONARIO", proconId);

    tokenAdmin = await DbHelper.getToken(admin.email);
    tokenFuncionario = await DbHelper.getToken(funcionario.email);

    console.log(`✅ Procon ID: ${proconId}`);
  });

  // ============ TESTES DE CRIAÇÃO ============

  describe("POST /pergunta - Criar pergunta", () => {
    it("Deve criar pergunta com sucesso (DEV)", async () => {
      const response = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenAdmin,
        body: {
          procon_id: proconId,
          tema: "emprestimo_nao_contratado",
          pergunta: "Estão descontando empréstimo que não contratei",
          resposta: "O consumidor pode registrar reclamação no Procon...",
          base_legal: ["Art. 42, CDC"],
          documentos: ["Extrato bancário", "RG"],
        },
      });

      console.log(`Resposta criar pergunta: ${response.status}`);
      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(response.body.dados.id);

      perguntaId = response.body.dados.id;
    });

    it("Deve retornar erro 401 quando não autenticado", async () => {
      const response = await apiRequest("/pergunta", {
        method: "POST",
        body: {
          procon_id: proconId,
          tema: "teste_sem_token",
          pergunta: "Teste sem autenticação",
          resposta: "Resposta teste",
        },
      });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.sucesso, false);
    });

    it("Deve retornar erro quando tema já existe", async () => {
      const response = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenAdmin,
        body: {
          procon_id: proconId,
          tema: "emprestimo_nao_contratado", // Mesmo tema da pergunta criada no before
          pergunta: "Outra pergunta com mesmo tema",
          resposta: "Resposta teste",
        },
      });

      console.log("Resposta erro tema duplicado:", response.body);

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);

      // Verificar se a mensagem de erro contém o texto esperado
      const mensagemErro = response.body.erro || response.body.mensagem || "";
      assert.ok(
        mensagemErro.includes("já existe") ||
          mensagemErro.includes("Já existe"),
        `Mensagem de erro não contém "já existe": ${mensagemErro}`,
      );
    });
  });

  // ============ TESTES DE LISTAGEM ADMIN ============

  describe("GET /admin/perguntas - Listar perguntas (admin)", () => {
    it("Deve listar perguntas com sucesso (DEV)", async () => {
      const response = await apiRequest("/admin/perguntas", {
        method: "GET",
        token: tokenAdmin,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.dados));
    });

    it("Deve retornar erro 401 quando não autenticado", async () => {
      const response = await apiRequest("/admin/perguntas", {
        method: "GET",
      });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE ATUALIZAÇÃO ============

  describe("PUT /pergunta/:id - Atualizar pergunta", () => {
    it("Deve atualizar pergunta com sucesso", async () => {
      const response = await apiRequest(`/pergunta/${perguntaId}`, {
        method: "PUT",
        token: tokenAdmin,
        body: {
          resposta: "Resposta atualizada com mais detalhes sobre o CDC",
        },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
    });

    it("Deve retornar erro 401 quando não autenticado", async () => {
      const response = await apiRequest(`/pergunta/${perguntaId}`, {
        method: "PUT",
        body: { resposta: "Tentativa sem token" },
      });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE ATIVAÇÃO/DESATIVAÇÃO ============

  describe("PUT /pergunta/:id/desativar - Desativar pergunta", () => {
    it("Deve desativar pergunta com sucesso", async () => {
      const response = await apiRequest(`/pergunta/${perguntaId}/desativar`, {
        method: "PUT",
        token: tokenAdmin,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.ativo, false);
    });
  });

  describe("PUT /pergunta/:id/ativar - Ativar pergunta", () => {
    it("Deve ativar pergunta com sucesso", async () => {
      const response = await apiRequest(`/pergunta/${perguntaId}/ativar`, {
        method: "PUT",
        token: tokenAdmin,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.ativo, true);
    });
  });

  // ============ TESTES DE EXCLUSÃO ============

  describe("DELETE /pergunta/:id - Excluir pergunta", () => {
    let perguntaParaExcluir: number;

    before(async () => {
      const response = await apiRequest("/pergunta", {
        method: "POST",
        token: tokenAdmin,
        body: {
          procon_id: proconId,
          tema: "pergunta_para_excluir",
          pergunta: "Esta pergunta será excluída",
          resposta: "Resposta teste",
        },
      });
      perguntaParaExcluir = response.body.dados.id;
    });

    it("Deve excluir pergunta com sucesso (apenas DEV)", async () => {
      const response = await apiRequest(`/pergunta/${perguntaParaExcluir}`, {
        method: "DELETE",
        token: tokenAdmin,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
    });

    it("Deve retornar erro 404 ao buscar pergunta excluída", async () => {
      const response = await apiRequest(`/pergunta/${perguntaParaExcluir}`, {
        method: "GET",
      });

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.sucesso, false);
    });
  });
});
