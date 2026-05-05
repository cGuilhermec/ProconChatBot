// src/__tests__/feriado/isFeriado.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Verificação de Feriado", () => {
  let proconId: number;
  let tokenCoordenador: string;

  before(async () => {
    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    const coordenador = await DbHelper.createTestUser("COORDENADOR", proconId);
    tokenCoordenador = await DbHelper.getToken(coordenador.email);

    // Criar um feriado para teste
    await apiRequest("/feriado", {
      method: "POST",
      token: tokenCoordenador,
      body: {
        procon_id: proconId,
        data: "2026-05-01T00:00:00.000Z",
        nome: "Dia do Trabalhador",
        recorrente: true,
      },
    });
  });

  describe("GET /feriado/verificar - Verificar se é feriado", () => {
    it("Deve retornar true para uma data que é feriado", async () => {
      const response = await apiRequest(
        `/feriado/verificar?procon_id=${proconId}&data=2026-05-01`,
        {
          method: "GET",
        },
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.isFeriado, true);
    });

    it("Deve retornar false para uma data que não é feriado", async () => {
      const response = await apiRequest(
        `/feriado/verificar?procon_id=${proconId}&data=2026-05-15`,
        {
          method: "GET",
        },
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.sucesso, true);
      assert.strictEqual(response.body.isFeriado, false);
    });

    it("Deve retornar erro 400 quando procon_id não é fornecido", async () => {
      const response = await apiRequest("/feriado/verificar?data=2026-05-01", {
        method: "GET",
      });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
      assert.ok(
        response.body.mensagem.includes("Procon ID e data são obrigatórios"),
      );
    });

    it("Deve retornar erro 400 quando data não é fornecida", async () => {
      const response = await apiRequest(
        `/feriado/verificar?procon_id=${proconId}`,
        {
          method: "GET",
        },
      );

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.sucesso, false);
    });
  });
});
