// src/__tests__/usuario/status.test.ts
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Ativação/Desativação de Usuário", () => {
  let proconId: number;
  let tokenDev: string;
  let usuarioId: number;
  let devEmail: string;

  before(async () => {
    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    const dev = await DbHelper.createTestUser("DEV", proconId);
    const usuario = await DbHelper.createTestUser("FUNCIONARIO", proconId);

    usuarioId = usuario.USUARIO_ID;
    devEmail = dev.email;
    tokenDev = await DbHelper.getToken(devEmail);
  });

  it("Deve desativar usuário com sucesso", async () => {
    const response = await apiRequest(`/desativar/${usuarioId}`, {
      method: "PUT",
      token: tokenDev,
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.sucesso, true);
    assert.strictEqual(response.body.usuario.ativo, false);
  });

  it("Deve ativar usuário com sucesso", async () => {
    const response = await apiRequest(`/ativar/${usuarioId}`, {
      method: "PUT",
      token: tokenDev,
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.sucesso, true);
    assert.strictEqual(response.body.usuario.ativo, true);
  });
});
