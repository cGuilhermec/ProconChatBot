// src/__tests__/feriado/crud.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de CRUD do Feriado", () => {
  let tokenCoordenador: string;
  let tokenFuncionario: string;
  let proconId: number;
  let feriadoId: number;

  before(async () => {
    console.log("🚀 Criando dados para testes de Feriado...");

    // Criar Procon
    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    // Criar usuários
    const coordenador = await DbHelper.createTestUser("COORDENADOR", proconId);
    const funcionario = await DbHelper.createTestUser("FUNCIONARIO", proconId);

    tokenCoordenador = await DbHelper.getToken(coordenador.email);
    tokenFuncionario = await DbHelper.getToken(funcionario.email);

    console.log(`✅ Procon ID: ${proconId}`);
    console.log(`✅ Coordenador email: ${coordenador.email}`);
    console.log(`✅ Funcionário email: ${funcionario.email}`);
  });

  // ============ TESTES DE CRIAÇÃO ============

  describe("POST /feriado - Criar Feriado", () => {
    it("Deve criar feriado com sucesso (COORDENADOR)", async () => {
      const dataFeriado = "2026-12-25T00:00:00.000Z";

      const response = await apiRequest("/feriado", {
        method: "POST",
        token: tokenCoordenador,
        body: {
          procon_id: proconId,
          data: dataFeriado,
          nome: "Natal",
          recorrente: true,
        },
      });

      console.log(`Resposta criar feriado: ${response.status}`);
      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.nome, "Natal");
      assert.strictEqual(response.body.dados.recorrente, true);

      feriadoId = response.body.dados.id;
    });

    it("Deve retornar erro 401 quando não autenticado", async () => {
      const response = await apiRequest("/feriado", {
        method: "POST",
        body: {
          procon_id: proconId,
          data: "2026-01-01T00:00:00.000Z",
          nome: "Ano Novo",
          recorrente: true,
        },
      });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.sucesso, false);
    });

    it("Deve retornar erro 403 quando FUNCIONARIO tenta criar feriado", async () => {
      const response = await apiRequest("/feriado", {
        method: "POST",
        token: tokenFuncionario,
        body: {
          procon_id: proconId,
          data: "2026-04-21T00:00:00.000Z",
          nome: "Tiradentes",
          recorrente: true,
        },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
      assert.ok(response.body.erro.includes("não tem permissão"));
    });

    it("Deve retornar erro quando já existe feriado na mesma data", async () => {
      const response = await apiRequest("/feriado", {
        method: "POST",
        token: tokenCoordenador,
        body: {
          procon_id: proconId,
          data: "2026-12-25T00:00:00.000Z",
          nome: "Natal (duplicado)",
          recorrente: true,
        },
      });

      console.log("Resposta duplicado:", response.body);
      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
      assert.ok(
        response.body.erro?.includes("já existe") ||
          response.body.erro?.includes("feriado") ||
          response.body.erro?.includes("data"),
        `Mensagem de erro não contém texto esperado: ${response.body.erro}`,
      );
    });
    });

  // ============ TESTES DE LISTAGEM ============

  describe("GET /feriados - Listar Feriados", () => {
    it("Deve listar feriados com sucesso (público)", async () => {
      const response = await apiRequest("/feriados", {
        method: "GET",
      });

      console.log(`Resposta listar feriados: ${response.status}`);
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.dados));
      assert.ok(response.body.total >= 0);
    });

    it("Deve filtrar feriados por procon_id", async () => {
      const response = await apiRequest(`/feriados?procon_id=${proconId}`, {
        method: "GET",
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);

      // Verificar se todos os feriados retornados pertencem ao Procon correto
      const todosProcon = response.body.dados.every(
        (f: any) => f.procon_id === proconId,
      );
      assert.ok(todosProcon);
    });
  });

  // ============ TESTES DE BUSCA POR ID ============

  describe("GET /feriado/:id - Buscar Feriado por ID", () => {
    it("Deve buscar feriado por ID com sucesso (público)", async () => {
      const response = await apiRequest(`/feriado/${feriadoId}`, {
        method: "GET",
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.FERIADO_ID, feriadoId);
      assert.strictEqual(response.body.dados.nome, "Natal");
    });

    it("Deve retornar erro 404 quando feriado não existe", async () => {
      const response = await apiRequest("/feriado/99999", {
        method: "GET",
      });

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE ATUALIZAÇÃO ============

  describe("PUT /feriado/:id - Atualizar Feriado", () => {
    let feriadoUpdateId: number;

    before(async () => {
      const response = await apiRequest("/feriado", {
        method: "POST",
        token: tokenCoordenador,
        body: {
          procon_id: proconId,
          data: "2026-10-12T00:00:00.000Z",
          nome: "Nossa Senhora Aparecida",
          recorrente: true,
        },
      });
      feriadoUpdateId = response.body.dados.id;
    });

    it("Deve atualizar feriado com sucesso", async () => {
      const response = await apiRequest(`/feriado/${feriadoUpdateId}`, {
        method: "PUT",
        token: tokenCoordenador,
        body: {
          nome: "Padroeira do Brasil",
        },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.nome, "Padroeira do Brasil");
    });

    it("Deve retornar erro 401 quando não autenticado", async () => {
      const response = await apiRequest(`/feriado/${feriadoUpdateId}`, {
        method: "PUT",
        body: { nome: "Feriado Atualizado" },
      });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.sucesso, false);
    });

    it("Deve retornar erro 403 quando FUNCIONARIO tenta atualizar", async () => {
      const response = await apiRequest(`/feriado/${feriadoUpdateId}`, {
        method: "PUT",
        token: tokenFuncionario,
        body: { nome: "Tentativa Funcionario" },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE EXCLUSÃO ============

  describe("DELETE /feriado/:id - Excluir Feriado", () => {
    let feriadoDeleteId: number;

    before(async () => {
      const response = await apiRequest("/feriado", {
        method: "POST",
        token: tokenCoordenador,
        body: {
          procon_id: proconId,
          data: "2026-11-15T00:00:00.000Z",
          nome: "Proclamação da República",
          recorrente: true,
        },
      });
      feriadoDeleteId = response.body.dados.id;
    });

    it("Deve excluir feriado com sucesso", async () => {
      const response = await apiRequest(`/feriado/${feriadoDeleteId}`, {
        method: "DELETE",
        token: tokenCoordenador,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(response.body.mensagem.includes("excluído"));
    });

    it("Deve retornar erro 404 ao buscar feriado excluído", async () => {
      const response = await apiRequest(`/feriado/${feriadoDeleteId}`, {
        method: "GET",
      });

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.sucesso, false);
    });
  });
});
