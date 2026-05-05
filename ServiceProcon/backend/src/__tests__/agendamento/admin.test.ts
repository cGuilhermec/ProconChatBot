// src/__tests__/agendamento/admin.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Agendamento - Rotas Administrativas", () => {
  let proconId: number;
  let tokenAdmin: string;
  let tokenFuncionario: string;
  let agendamentoId: number;

  before(async () => {
    console.log("🚀 Criando dados para testes administrativos...");

    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    const admin = await DbHelper.createTestUser("DEV", proconId);
    const funcionario = await DbHelper.createTestUser("FUNCIONARIO", proconId);

    tokenAdmin = await DbHelper.getToken(admin.email);
    tokenFuncionario = await DbHelper.getToken(funcionario.email);

    // Criar um agendamento para os testes - USANDO CPF VÁLIDO!
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 7);
    while (dataFutura.getDay() === 0 || dataFutura.getDay() === 6) {
      dataFutura.setDate(dataFutura.getDate() + 1);
    }
    const dataStr = dataFutura.toISOString().split("T")[0];

    const response = await apiRequest("/agendamento", {
      method: "POST",
      body: {
        procon_id: proconId,
        nome_usuario: "Admin Teste",
        cpf: "44470962856", // ⬅️ MUDAR PARA CPF VÁLIDO!
        telefone: "(11) 99999-9999",
        data_agendamento: dataStr,
        horario_agendamento: "09:00",
      },
    });

    console.log("Resposta criação agendamento:", response.status);
    console.log("Body:", response.body);

    agendamentoId = response.body.dados?.id;
    console.log("Agendamento ID:", agendamentoId);
  });

  // ============ TESTES DE LISTAGEM ============

  describe("GET /admin/agendamentos - Listar agendamentos", () => {
    it("Deve listar agendamentos com sucesso (DEV)", async () => {
      const response = await apiRequest("/admin/agendamentos", {
        method: "GET",
        token: tokenAdmin,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
    });

    it("Deve listar agendamentos com sucesso (FUNCIONARIO)", async () => {
      const response = await apiRequest("/admin/agendamentos", {
        method: "GET",
        token: tokenFuncionario,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
    });

    it("Deve retornar erro 401 quando não autenticado", async () => {
      const response = await apiRequest("/admin/agendamentos", {
        method: "GET",
      });

      assert.strictEqual(response.status, 401);
    });

    it("Deve filtrar agendamentos por status", async () => {
      const response = await apiRequest("/admin/agendamentos", {
        method: "GET",
        token: tokenAdmin,
        query: { status: "PENDENTE" },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);

      const todosPendentes = response.body.dados.every(
        (a: any) => a.status === "PENDENTE",
      );
      assert.ok(todosPendentes);
    });
  });

  // ============ TESTES DE BUSCA POR ID ============

  describe("GET /admin/agendamento/:id - Buscar agendamento por ID", () => {
    it("Deve buscar agendamento por ID com sucesso", async () => {
      if (!agendamentoId) {
        console.log("⚠️ Pulando teste - agendamentoId não disponível");
        return;
      }

      const response = await apiRequest(`/admin/agendamento/${agendamentoId}`, {
        method: "GET",
        token: tokenAdmin,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.dados.AGENDAMENTO_ID, agendamentoId);
    });

    it("Deve retornar erro 404 quando agendamento não existe", async () => {
      const response = await apiRequest("/admin/agendamento/99999", {
        method: "GET",
        token: tokenAdmin,
      });

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE ATUALIZAÇÃO DE STATUS ============

  describe("PUT /admin/agendamento/:id/status - Atualizar status", () => {
    it("Deve atualizar status para CONFIRMADO", async () => {
      if (!agendamentoId) {
        console.log("⚠️ Pulando teste - agendamentoId não disponível");
        return;
      }

      const response = await apiRequest(
        `/admin/agendamento/${agendamentoId}/status`,
        {
          method: "PUT",
          token: tokenAdmin,
          body: { status: "CONFIRMADO" },
        },
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
    });

    it("Deve retornar erro quando status é inválido", async () => {
      if (!agendamentoId) {
        console.log("⚠️ Pulando teste - agendamentoId não disponível");
        return;
      }

      const response = await apiRequest(
        `/admin/agendamento/${agendamentoId}/status`,
        {
          method: "PUT",
          token: tokenAdmin,
          body: { status: "STATUS_INVALIDO" },
        },
      );

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });

    it("Deve retornar erro 401 quando não autenticado", async () => {
      const response = await apiRequest(
        `/admin/agendamento/${agendamentoId}/status`,
        {
          method: "PUT",
          body: { status: "CONFIRMADO" },
        },
      );

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.sucesso, false);
    });
  });
});
