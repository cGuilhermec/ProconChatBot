// src/__tests__/usuario/crud.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de CRUD do Usuário", () => {
  let proconId: number;
  let tokenDev: string;
  let tokenFunc: string;
  let devEmail: string;
  let funcEmail: string;

  before(async () => {
    console.log("🚀 Iniciando CRUD tests before...");

    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;
    console.log(`✅ Procon criado com ID: ${proconId}`);

    const dev = await DbHelper.createTestUser("DEV", proconId);
    const func = await DbHelper.createTestUser("FUNCIONARIO", proconId);

    devEmail = dev.email;
    funcEmail = func.email;

    console.log(`📧 DEV Email: ${devEmail}`);
    console.log(`📧 FUNC Email: ${funcEmail}`);

    tokenDev = await DbHelper.getToken(devEmail);
    tokenFunc = await DbHelper.getToken(funcEmail);

    console.log(`✅ Tokens gerados - DEV: ${tokenDev ? "OK" : "FALHOU"}`);
    console.log(`✅ Tokens gerados - FUNC: ${tokenFunc ? "OK" : "FALHOU"}`);
  });

  it("Deve criar usuário com sucesso (DEV)", async () => {
    const response = await apiRequest("/usuario", {
      method: "POST",
      token: tokenDev,
      body: {
        nome: "Novo Usuario",
        email: `novo${Date.now()}@teste.com`,
        senha: "123456",
        role: "FUNCIONARIO",
        procon_id: proconId,
      },
    });

    console.log(`Resposta criar usuário: status ${response.status}`);
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.sucesso, true);
  });

  it("Deve listar usuários com sucesso (DEV)", async () => {
    const response = await apiRequest("/usuarios", {
      method: "GET",
      token: tokenDev,
    });

    console.log(`Resposta listar: status ${response.status}`);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.sucesso, true);
  });

  it("Deve retornar perfil do usuário logado", async () => {
    console.log(`🔍 Testando /me com token do funcionário: ${funcEmail}`);
    console.log(`🔑 Token FUNC: ${tokenFunc?.substring(0, 50)}...`);

    const response = await apiRequest("/me", {
      method: "GET",
      token: tokenFunc,
    });

    console.log(`Resposta perfil: status ${response.status}`);
    console.log(`Resposta body: ${JSON.stringify(response.body)}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.sucesso, true);
    assert.strictEqual(response.body.dados.email, funcEmail);
  });
});
