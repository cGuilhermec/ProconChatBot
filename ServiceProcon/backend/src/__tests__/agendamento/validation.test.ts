// src/__tests__/agendamento/validation.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert";
import { apiRequest } from "../helpers/http.helper";
import { DbHelper } from "../helpers/db.helper";

describe("Testes de Validação - Agendamento", () => {
  let proconId: number;
  let cpfTeste: string = "12345678900";

  before(async () => {
    const procon = await DbHelper.createTestProcon();
    proconId = procon.PROCON_ID;
  });

  // ============ TESTES DE VALIDAÇÃO DE CPF ============

  describe("Validação de CPF", () => {
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 7);
    const dataStr = dataFutura.toISOString().split("T")[0];

    const casosCPF = [
      { cpf: "12345678900", valido: true, descricao: "CPF válido" },
      {
        cpf: "11111111111",
        valido: false,
        descricao: "CPF com dígitos repetidos",
      },
      {
        cpf: "1234567890", // 10 dígitos
        valido: false,
        descricao: "CPF com menos de 11 dígitos",
      },
      {
        cpf: "123456789000",
        valido: false,
        descricao: "CPF com mais de 11 dígitos",
      },
      { cpf: "123.456.789-00", valido: true, descricao: "CPF formatado" },
      {
        cpf: "12345678901",
        valido: false,
        descricao: "CPF com dígitos verificadores inválidos",
      },
    ];

    for (const caso of casosCPF) {
      it(`Deve ${caso.valido ? "aceitar" : "rejeitar"} - ${caso.descricao}`, async () => {
        const response = await apiRequest("/agendamento", {
          method: "POST",
          body: {
            procon_id: proconId,
            nome_usuario: "Teste Validação",
            cpf: caso.cpf,
            telefone: "(11) 99999-9999",
            data_agendamento: dataStr,
            horario_agendamento: "09:00",
          },
        });

        if (caso.valido) {
          assert.strictEqual(response.status, 201);
          assert.strictEqual(response.body.sucesso, true);
        } else {
          assert.strictEqual(response.status, 400);
          assert.ok(response.body.erro?.includes("CPF inválido"));
        }
      });
    }
  });

  // ============ TESTES DE VALIDAÇÃO DE DATA ============

  describe("Validação de Data", () => {
    it("Deve rejeitar data no passado", async () => {
      const response = await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Teste Data Passada",
          cpf: cpfTeste,
          telefone: "(11) 99999-9999",
          data_agendamento: "2020-01-01",
          horario_agendamento: "09:00",
        },
      });

      assert.strictEqual(response.status, 400);
      assert.ok(response.body.erro?.includes("no mínimo amanhã"));
    });

    it("Deve rejeitar final de semana", async () => {
      // Encontrar um sábado
      let data = new Date();
      data.setDate(data.getDate() + 7);
      while (data.getDay() !== 6) {
        data.setDate(data.getDate() + 1);
      }
      const dataStr = data.toISOString().split("T")[0];

      const response = await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Teste Final Semana",
          cpf: cpfTeste,
          telefone: "(11) 99999-9999",
          data_agendamento: dataStr,
          horario_agendamento: "09:00",
        },
      });

      assert.strictEqual(response.status, 400);
      assert.ok(response.body.erro?.includes("finais de semana"));
    });
  });

  // ============ TESTES DE VALIDAÇÃO DE HORÁRIO ============

  describe("Validação de Horário", () => {
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 7);
    const dataStr = dataFutura.toISOString().split("T")[0];

    const casosHorario = [
      { horario: "08:00", valido: true, descricao: "Horário de abertura" },
      { horario: "12:00", valido: true, descricao: "Horário comercial" },
      {
        horario: "17:00",
        valido: false,
        descricao: "Horário de fechamento (não disponível)",
      },
      { horario: "06:00", valido: false, descricao: "Antes do expediente" },
      { horario: "20:00", valido: false, descricao: "Depois do expediente" },
      {
        horario: "09:15",
        valido: false,
        descricao: "Horário inválido (fora do intervalo)",
      },
    ];

    for (const caso of casosHorario) {
      it(`Deve ${caso.valido ? "aceitar" : "rejeitar"} - ${caso.descricao}`, async () => {
        const response = await apiRequest("/agendamento", {
          method: "POST",
          body: {
            procon_id: proconId,
            nome_usuario: "Teste Horário",
            cpf: cpfTeste,
            telefone: "(11) 99999-9999",
            data_agendamento: dataStr,
            horario_agendamento: caso.horario,
          },
        });

        if (caso.valido) {
          // Pode ser erro de data duplicada, mas o que importa é que não é erro de horário
          assert.ok(
            response.status === 201 ||
              response.body.erro?.includes("já possui"),
          );
        } else {
          assert.strictEqual(response.status, 400);
        }
      });
    }
  });

  // ============ TESTES DE CONFLITO ============

  describe("Conflitos de Agendamento", () => {
    let dataFutura: Date;
    let dataStr: string;

    before(async () => {
      dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + 14);
      while (dataFutura.getDay() === 0 || dataFutura.getDay() === 6) {
        dataFutura.setDate(dataFutura.getDate() + 1);
      }
      dataStr = dataFutura.toISOString().split("T")[0];
    });

    it("Deve permitir apenas um agendamento por CPF no mesmo dia", async () => {
      // Primeiro agendamento
      await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Conflito Teste 1",
          cpf: "99988877766",
          telefone: "(11) 99999-9999",
          data_agendamento: dataStr,
          horario_agendamento: "09:00",
        },
      });

      // Segundo agendamento no mesmo dia (deve falhar)
      const response = await apiRequest("/agendamento", {
        method: "POST",
        body: {
          procon_id: proconId,
          nome_usuario: "Conflito Teste 2",
          cpf: "99988877766",
          telefone: "(11) 99999-9999",
          data_agendamento: dataStr,
          horario_agendamento: "14:00",
        },
      });

      assert.strictEqual(response.status, 400);
      assert.ok(response.body.erro?.includes("já possui um agendamento"));
    });
  });
});
