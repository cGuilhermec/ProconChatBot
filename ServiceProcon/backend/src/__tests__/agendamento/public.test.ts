// src/__tests__/agendamento/public.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

const CPF_VALIDO = "44470962856"; // ⬅️ CPF VÁLIDO DEFINIDO AQUI

describe("Testes de Agendamento - Rotas Públicas (WhatsApp)", () => {
  let proconId: number;
  let tokenAdmin: string;

  before(async () => {
    console.log("🚀 Criando dados para testes de Agendamento...");

    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    const admin = await DbHelper.createTestUser("DEV", proconId);
    tokenAdmin = await DbHelper.getToken(admin.email);

    console.log(`✅ Procon ID: ${proconId}`);
  });

  // ============ TESTES DE DIAS DISPONÍVEIS ============

  describe("GET /agendamento/dias-disponiveis", () => {
    it("Deve retornar lista de dias com vagas", async () => {
      const response = await apiRequest("/agendamento/dias-disponiveis", {
        method: "GET",
        query: { procon_id: String(proconId) },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.dados));
    });

    it("Deve retornar erro 400 quando procon_id não é informado", async () => {
      const response = await apiRequest("/agendamento/dias-disponiveis", {
        method: "GET",
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE HORÁRIOS DISPONÍVEIS ============

  describe("GET /agendamento/horarios-disponiveis", () => {
    it("Deve retornar lista de horários disponíveis", async () => {
      const data = new Date();
      data.setDate(data.getDate() + 7);
      const dataStr = data.toISOString().split("T")[0];

      const response = await apiRequest("/agendamento/horarios-disponiveis", {
        method: "GET",
        query: {
          procon_id: String(proconId),
          data: dataStr,
        },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.horarios));
    });

    it("Deve retornar erro 400 quando procon_id não é informado", async () => {
      const response = await apiRequest("/agendamento/horarios-disponiveis", {
        method: "GET",
        query: { data: "2026-12-25" },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });

    it("Deve retornar erro 400 quando data não é informada", async () => {
      const response = await apiRequest("/agendamento/horarios-disponiveis", {
        method: "GET",
        query: { procon_id: String(proconId) },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE CRIAÇÃO DE AGENDAMENTO ============

  describe("POST /agendamento - Criar agendamento", () => {
    let dataFutura: Date;
    let dataStr: string;

    before(async () => {
      dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + 14);
      // Ajustar para dia útil (segunda a sexta)
      while (dataFutura.getDay() === 0 || dataFutura.getDay() === 6) {
        dataFutura.setDate(dataFutura.getDate() + 1);
      }
      dataStr = dataFutura.toISOString().split("T")[0];
    });

    it("Deve criar agendamento com sucesso", async () => {
      const response = await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "João Silva Teste",
          cpf: CPF_VALIDO, // ⬅️ USANDO CPF VÁLIDO
          telefone: "(11) 99999-9999",
          data_agendamento: dataStr,
          horario_agendamento: "09:00",
          observacao: "Teste de agendamento",
        },
      });

      console.log(`Resposta criar agendamento: ${response.status}`);
      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(response.body.dados.id);
      assert.strictEqual(response.body.dados.nome_usuario, "João Silva Teste");
    });

    it("Deve retornar erro quando CPF é inválido", async () => {
      const response = await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Teste Invalido",
          cpf: "11111111111", // CPF inválido permanece
          telefone: "(11) 99999-9999",
          data_agendamento: dataStr,
          horario_agendamento: "09:00",
        },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
      assert.ok(response.body.erro.includes("CPF inválido"));
    });

    it("Deve retornar erro quando data é passado", async () => {
      const response = await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Teste Data Passada",
          cpf: CPF_VALIDO, // ⬅️ USANDO CPF VÁLIDO
          telefone: "(11) 99999-9999",
          data_agendamento: "2020-01-01",
          horario_agendamento: "09:00",
        },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
      assert.ok(response.body.erro.includes("no mínimo amanhã"));
    });

    it("Deve retornar erro quando horário é inválido", async () => {
      const response = await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Teste Horario Invalido",
          cpf: CPF_VALIDO, // ⬅️ USANDO CPF VÁLIDO
          telefone: "(11) 99999-9999",
          data_agendamento: dataStr,
          horario_agendamento: "25:00",
        },
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE BUSCA POR CPF ============

  describe("GET /agendamento/buscar-por-cpf", () => {
    let cpfTeste: string;

    before(async () => {
      cpfTeste = CPF_VALIDO; // ⬅️ USANDO CPF VÁLIDO
      const dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + 21);
      while (dataFutura.getDay() === 0 || dataFutura.getDay() === 6) {
        dataFutura.setDate(dataFutura.getDate() + 1);
      }
      const dataStr = dataFutura.toISOString().split("T")[0];

      await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Busca CPF Teste",
          cpf: cpfTeste,
          telefone: "(11) 99999-9999",
          data_agendamento: dataStr,
          horario_agendamento: "10:00",
        },
      });
    });

    it("Deve buscar agendamentos por CPF", async () => {
      const response = await apiRequest("/agendamento/buscar-por-cpf", {
        method: "GET",
        query: { cpf: cpfTeste },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.ok(Array.isArray(response.body.dados));
      assert.ok(response.body.total > 0);
    });

    it("Deve retornar erro 400 quando CPF não é informado", async () => {
      const response = await apiRequest("/agendamento/buscar-por-cpf", {
        method: "GET",
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });

  // ============ TESTES DE CANCELAMENTO ============

  describe("DELETE /agendamento/:id - Cancelar agendamento", () => {
    let agendamentoId: number;
    let cpfTeste: string;

    before(async () => {
      cpfTeste = CPF_VALIDO; // ⬅️ USANDO CPF VÁLIDO
      const dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + 28);
      while (dataFutura.getDay() === 0 || dataFutura.getDay() === 6) {
        dataFutura.setDate(dataFutura.getDate() + 1);
      }
      const dataStr = dataFutura.toISOString().split("T")[0];

      const response = await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Cancelar Teste",
          cpf: cpfTeste,
          telefone: "(11) 99999-9999",
          data_agendamento: dataStr,
          horario_agendamento: "14:00",
        },
      });
      agendamentoId = response.body.dados.id;
    });

    it("Deve cancelar agendamento com sucesso", async () => {
      const response = await apiRequest(`/agendamento/${agendamentoId}`, {
        method: "DELETE",
        body: { cpf: cpfTeste },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
    });

  });
});
