// src/__tests__/usuario/senha.test.ts
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Gerenciamento de Senha", () => {
  let proconId: number;
  let tokenFunc: string;
  let tokenPrimeiroAcesso: string;
  let funcEmail: string;

  before(async () => {
    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;

    const userFunc = await DbHelper.createTestUser(
      "FUNCIONARIO",
      proconId,
      true,
      false,
    );
    const userPrimeiroAcesso = await DbHelper.createTestUser(
      "FUNCIONARIO",
      proconId,
      true,
      true,
    );

    funcEmail = userFunc.email;

    tokenFunc = await DbHelper.getToken(funcEmail);
    tokenPrimeiroAcesso = await DbHelper.getToken(userPrimeiroAcesso.email);
  });

  it("Deve permitir definir senha no primeiro acesso", async () => {
    const response = await apiRequest("/first-access", {
      method: "PUT",
      token: tokenPrimeiroAcesso,
      body: {
        novaSenha: "novaSenha123",
        confirmarSenha: "novaSenha123",
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.sucesso, true);
  });

  it("Deve retornar erro quando senhas não coincidem", async () => {
    const response = await apiRequest("/first-access", {
      method: "PUT",
      token: tokenPrimeiroAcesso,
      body: {
        novaSenha: "senha123",
        confirmarSenha: "senha456",
      },
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.sucesso, false);
  });

  it("Deve trocar senha com sucesso", async () => {
    const response = await apiRequest("/mudar-senha", {
      method: "PUT",
      token: tokenFunc,
      body: {
        senhaAtual: "123456",
        novaSenha: "novaSenha456",
        confirmarSenha: "novaSenha456",
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.sucesso, true);
  });

  it("Deve retornar erro quando senha atual está incorreta", async () => {
    const response = await apiRequest("/mudar-senha", {
      method: "PUT",
      token: tokenFunc,
      body: {
        senhaAtual: "senhaerrada",
        novaSenha: "novaSenha456",
        confirmarSenha: "novaSenha456",
      },
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.sucesso, false);
  });
});
