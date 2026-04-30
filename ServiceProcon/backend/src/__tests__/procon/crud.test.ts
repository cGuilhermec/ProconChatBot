// src/__tests__/procon/crud.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de CRUD do Procon", () => {
    let tokenAdmin: string;
    let tokenFuncionario: string;
    let proconId: number;

    before(async () => {
        console.log("🚀 Criando dados para testes de Procon...");

        // Criar usuários para os testes
        const procon = await DbHelper.createTestProcon();
        proconId = procon.PROCON_ID;

        const admin = await DbHelper.createTestUser("DEV", proconId);
        const funcionario = await DbHelper.createTestUser("FUNCIONARIO", proconId);

        tokenAdmin = await DbHelper.getToken(admin.email);
        tokenFuncionario = await DbHelper.getToken(funcionario.email);

        console.log(`✅ Admin criado: ${admin.email}`);
        console.log(`✅ Funcionário criado: ${funcionario.email}`);
    });

    // ============ TESTES DE CRIAÇÃO ============

    describe("POST /procon - Criar Procon", () => {
        it("Deve criar Procon com sucesso (DEV)", async () => {
            const timestamp = Date.now();
            const response = await apiRequest("/procon", {
                method: "POST",
                token: tokenAdmin,
                body: {
                    nome: `Procon Teste ${timestamp}`,
                    cidade: "Cidade Teste",
                    estado: "SP",
                    endereco: "Rua Teste, 123",
                    telefone: "(11) 99999-9999",
                    email: `teste${timestamp}@procon.com`,
                    horario_abertura: "08:00:00",
                    horario_fechamento: "17:00:00",
                    duracao_atendimento_minutos: 30,
                    vagas_por_horario: 2,
                },
            });

            console.log(`Resposta criar Procon: ${response.status}`);
            assert.strictEqual(response.status, 201);
            assert.strictEqual(response.body.sucesso, true);
            assert.ok(response.body.dados.id);
            assert.strictEqual(response.body.dados.nome, `Procon Teste ${timestamp}`);
        });

        it("Deve retornar erro 401 quando não autenticado", async () => {
            const response = await apiRequest("/procon", {
                method: "POST",
                body: {
                    nome: "Procon Sem Token",
                    cidade: "Cidade Teste",
                    estado: "SP",
                    endereco: "Rua Teste, 123",
                    telefone: "(11) 99999-9999",
                    email: "semtoken@procon.com",
                    horario_abertura: "08:00:00",
                    horario_fechamento: "17:00:00",
                    duracao_atendimento_minutos: 30,
                    vagas_por_horario: 2,
                },
            });

            assert.strictEqual(response.status, 401);
            assert.strictEqual(response.body.sucesso, false);
        });

        it("Deve retornar erro 403 quando FUNCIONARIO tenta criar Procon", async () => {
            const response = await apiRequest("/procon", {
                method: "POST",
                token: tokenFuncionario,
                body: {
                    nome: "Procon Funcionario",
                    cidade: "Cidade Teste",
                    estado: "SP",
                    endereco: "Rua Teste, 123",
                    telefone: "(11) 99999-9999",
                    email: "funcionario@procon.com",
                    horario_abertura: "08:00:00",
                    horario_fechamento: "17:00:00",
                    duracao_atendimento_minutos: 30,
                    vagas_por_horario: 2,
                },
            });

            assert.strictEqual(response.status, 400);
            assert.strictEqual(response.body.sucesso, false);
            assert.ok(response.body.erro.includes("não tem permissão"));
        });

        it("Deve retornar erro quando nome e cidade já existem", async () => {
            // Primeiro criar um Procon
            const timestamp = Date.now();
            const nomeProcon = `Procon Duplicado ${timestamp}`;
            const cidadeProcon = `Cidade Duplicada ${timestamp}`;

            await apiRequest("/procon", {
                method: "POST",
                token: tokenAdmin,
                body: {
                    nome: nomeProcon,
                    cidade: cidadeProcon,
                    estado: "SP",
                    endereco: "Rua Teste, 123",
                    telefone: "(11) 99999-9999",
                    email: `duplicado${timestamp}@procon.com`,
                    horario_abertura: "08:00:00",
                    horario_fechamento: "17:00:00",
                    duracao_atendimento_minutos: 30,
                    vagas_por_horario: 2,
                },
            });

            // Tentar criar o mesmo Procon novamente
            const response = await apiRequest("/procon", {
                method: "POST",
                token: tokenAdmin,
                body: {
                    nome: nomeProcon,
                    cidade: cidadeProcon,
                    estado: "SP",
                    endereco: "Rua Teste, 123",
                    telefone: "(11) 99999-9999",
                    email: `duplicado2${timestamp}@procon.com`,
                    horario_abertura: "08:00:00",
                    horario_fechamento: "17:00:00",
                    duracao_atendimento_minutos: 30,
                    vagas_por_horario: 2,
                },
            });

            assert.strictEqual(response.status, 400);
            assert.strictEqual(response.body.sucesso, false);
            assert.ok(response.body.erro.includes("já existe"));
        });
    });

    // ============ TESTES DE LISTAGEM ============

    describe("GET /procons - Listar Procons", () => {
        it("Deve listar Procons com sucesso (DEV)", async () => {
            const response = await apiRequest("/procons", {
                method: "GET",
                token: tokenAdmin,
            });

            console.log(`Resposta listar Procons: ${response.status}`);
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.sucesso, true);
            assert.ok(Array.isArray(response.body.dados));
            assert.ok(response.body.total >= 0);
        });

        it("Deve retornar erro 401 quando não autenticado", async () => {
            const response = await apiRequest("/procons", {
                method: "GET",
            });

            assert.strictEqual(response.status, 401);
            assert.strictEqual(response.body.sucesso, false);
        });

        it("Deve filtrar apenas Procons ativos", async () => {
            const response = await apiRequest("/procons", {
                method: "GET",
                token: tokenAdmin,
                query: { apenasAtivos: "true" },
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.sucesso, true);
            assert.ok(Array.isArray(response.body.dados));
        });
    });

    // ============ TESTES DE BUSCA POR ID ============

    describe("GET /procon/:id - Buscar Procon por ID", () => {
        let testProconId: number;

        before(async () => {
            const response = await apiRequest("/procon", {
                method: "POST",
                token: tokenAdmin,
                body: {
                    nome: `Procon Busca ${Date.now()}`,
                    cidade: "Cidade Busca",
                    estado: "SP",
                    endereco: "Rua Busca, 123",
                    telefone: "(11) 99999-9999",
                    email: `busca${Date.now()}@procon.com`,
                    horario_abertura: "08:00:00",
                    horario_fechamento: "17:00:00",
                    duracao_atendimento_minutos: 30,
                    vagas_por_horario: 2,
                },
            });
            testProconId = response.body.dados.id;
        });

        it("Deve buscar Procon por ID com sucesso", async () => {
            const response = await apiRequest(`/procon/${testProconId}`, {
                method: "GET",
                token: tokenAdmin,
            });

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.sucesso, true);
            assert.strictEqual(response.body.dados.PROCON_ID, testProconId);
        });

        it("Deve retornar erro 404 quando Procon não existe", async () => {
            const response = await apiRequest("/procon/99999", {
                method: "GET",
                token: tokenAdmin,
            });

            assert.strictEqual(response.status, 404);
            assert.strictEqual(response.body.sucesso, false);
        });
    });

    // ============ TESTES DE ATUALIZAÇÃO ============

    // src/__tests__/procon/crud.test.ts

    describe("PUT /procon/:id - Atualizar Procon", () => {
        let testProconId: number;

        before(async () => {
            // Criar um Procon específico para o teste de atualização
            const timestamp = Date.now();
            const response = await apiRequest("/procon", {
                method: "POST",
                token: tokenAdmin,
                body: {
                    nome: `Procon Update Test ${timestamp}`,
                    cidade: `Cidade Update ${timestamp}`,
                    estado: "SP",
                    endereco: "Rua Update, 123",
                    telefone: "(11) 99999-9999",
                    email: `update${timestamp}@procon.com`,
                    horario_abertura: "08:00:00",
                    horario_fechamento: "17:00:00",
                    duracao_atendimento_minutos: 30,
                    vagas_por_horario: 2,
                },
            });
            testProconId = response.body.dados.id;
            console.log(`✅ Procon criado para update: ID ${testProconId}`);
        });

        it("Deve atualizar Procon com sucesso", async () => {
            const response = await apiRequest(`/procon/${testProconId}`, {
                method: "PUT",
                token: tokenAdmin,
                body: {
                    nome: "Procon Atualizado com Sucesso",
                    telefone: "(11) 88888-8888",
                },
            });

            console.log(`Resposta atualização: ${response.status}`);
            console.log(`Body: ${JSON.stringify(response.body)}`);
    
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.sucesso, true);
            assert.strictEqual(response.body.dados.nome, "Procon Atualizado com Sucesso");
            assert.strictEqual(response.body.dados.telefone, "(11) 88888-8888");
        });

        it("Deve retornar erro 401 quando não autenticado", async () => {
            const response = await apiRequest(`/procon/${testProconId}`, {
                method: "PUT",
                body: { nome: "Procon Sem Token" },
            });

            assert.strictEqual(response.status, 401);
            assert.strictEqual(response.body.sucesso, false);
        });

        it("Deve retornar erro 404 quando Procon não existe", async () => {
            const response = await apiRequest("/procon/99999", {
                method: "PUT",
                token: tokenAdmin,
                body: { nome: "Procon Inexistente" },
            });

            assert.strictEqual(response.status, 404);
            assert.strictEqual(response.body.sucesso, false);
        });
    });
});
