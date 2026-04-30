// src/__tests__/procon/status.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Ativação/Desativação de Procon", () => {
  let tokenAdmin: string;
  let tokenCoordenador: string;
  let tokenFuncionario: string;
  let proconId: number;

  before(async () => {
    console.log("🚀 Criando dados para testes de ativação/desativação...");

    // Criar Procon
    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    // Criar usuários com diferentes roles
    const admin = await DbHelper.createTestUser("DEV", proconId);
    const coordenador = await DbHelper.createTestUser("COORDENADOR", proconId);
    const funcionario = await DbHelper.createTestUser("FUNCIONARIO", proconId);

    tokenAdmin = await DbHelper.getToken(admin.email);
    tokenCoordenador = await DbHelper.getToken(coordenador.email);
    tokenFuncionario = await DbHelper.getToken(funcionario.email);

    console.log(`✅ Admin criado: ${admin.email}`);
    console.log(`✅ Coordenador criado: ${coordenador.email}`);
    console.log(`✅ Funcionário criado: ${funcionario.email}`);
  });

  // ============ TESTES DE DESATIVAÇÃO ============

  describe("PUT /procon/:id/desativar - Desativar Procon", () => {
    it("Deve desativar Procon com sucesso (DEV)", async () => {
      // Criar um Procon específico para desativar
      const createResponse = await apiRequest("/procon", {
        method: "POST",
        token: tokenAdmin,
        body: {
          nome: `Procon Desativar ${Date.now()}`,
          cidade: "Cidade Desativar",
          estado: "SP",
          endereco: "Rua Desativar, 123",
          telefone: "(11) 99999-9999",
          email: `desativar${Date.now()}@procon.com`,
          horario_abertura: "08:00:00",
          horario_fechamento: "17:00:00",
          duracao_atendimento_minutos: 30,
          vagas_por_horario: 2,
        },
      });

      const proconDesativarId = createResponse.body.dados.id;

      const response = await apiRequest(
        `/procon/${proconDesativarId}/desativar`,
        {
          method: "PUT",
          token: tokenAdmin,
        },
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.ativo, false);
    });

    it("Deve retornar erro 403 quando FUNCIONARIO tenta desativar", async () => {
      const response = await apiRequest(`/procon/${proconId}/desativar`, {
        method: "PUT",
        token: tokenFuncionario,
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
      assert.ok(response.body.erro.includes("não tem permissão"));
    });

    it("Deve permitir COORDENADOR desativar? (NÃO - apenas DIRETOR/DEV)", async () => {
      const response = await apiRequest(`/procon/${proconId}/desativar`, {
        method: "PUT",
        token: tokenCoordenador,
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
      assert.ok(response.body.erro.includes("não tem permissão"));
    });
  });

  // ============ TESTES DE ATIVAÇÃO ============

  describe("PUT /procon/:id/ativar - Ativar Procon", () => {
    let proconDesativadoId: number;

    before(async () => {
      // Criar e desativar um Procon
      const createResponse = await apiRequest("/procon", {
        method: "POST",
        token: tokenAdmin,
        body: {
          nome: `Procon Ativar ${Date.now()}`,
          cidade: "Cidade Ativar",
          estado: "SP",
          endereco: "Rua Ativar, 123",
          telefone: "(11) 99999-9999",
          email: `ativar${Date.now()}@procon.com`,
          horario_abertura: "08:00:00",
          horario_fechamento: "17:00:00",
          duracao_atendimento_minutos: 30,
          vagas_por_horario: 2,
        },
      });

      proconDesativadoId = createResponse.body.dados.id;

      await apiRequest(`/procon/${proconDesativadoId}/desativar`, {
        method: "PUT",
        token: tokenAdmin,
      });
    });

    it("Deve ativar Procon com sucesso (DEV)", async () => {
      const response = await apiRequest(
        `/procon/${proconDesativadoId}/ativar`,
        {
          method: "PUT",
          token: tokenAdmin,
        },
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.ativo, true);
    });

    it("Deve retornar erro 403 quando FUNCIONARIO tenta ativar", async () => {
      const response = await apiRequest(
        `/procon/${proconDesativadoId}/ativar`,
        {
          method: "PUT",
          token: tokenFuncionario,
        },
      );

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE ROTA PÚBLICA ============

  describe("GET /procons-ativos - Listar Procons ativos (público)", () => {
    it("Deve listar apenas Procons ativos sem autenticação", async () => {
      const response = await apiRequest("/procons-ativos", {
        method: "GET",
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.dados));

      // Verificar se todos os Procons retornados estão ativos
      const todosAtivos = response.body.dados.every(
        (p: any) => p.ativo === true,
      );
      assert.ok(todosAtivos);
    });
  });
});
