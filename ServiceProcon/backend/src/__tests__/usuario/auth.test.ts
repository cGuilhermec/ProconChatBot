// src/__tests__/usuario/auth.test.ts
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Autenticação - Login", () => {
  let testEmail: string;
  let proconId: number;

  before(async () => {
    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;
    const user = await DbHelper.createTestUser(
      "FUNCIONARIO",
      proconId,
      true,
      false,
    );
    testEmail = user.email;
  });

  it("Deve fazer login com sucesso", async () => {
    const response = await apiRequest("/login", {
      method: "POST",
      body: {
        email: testEmail,
        senha: "123456",
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.sucesso, true);
    assert.ok(response.body.token);
  });
});
