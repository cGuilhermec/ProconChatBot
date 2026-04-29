// src/__tests__/setup.test.ts
import { before, after } from "node:test";
import { prisma } from "../config/database";
import { DbHelper } from "./helpers/db.helper";

before(async () => {
  console.log("═══════════════════════════════════════");
  console.log("🧹 LIMPANDO TODOS OS DADOS DE TESTE...");
  console.log("═══════════════════════════════════════");
  await DbHelper.cleanAllTestData();
  console.log("🚀 Iniciando suite de testes...");
});

after(async () => {
  console.log("═══════════════════════════════════════");
  console.log("🧹 LIMPANDO DADOS CRIADOS NESTA EXECUÇÃO...");
  console.log("═══════════════════════════════════════");
  await DbHelper.cleanTestData();
  console.log("✅ Finalizando suite de testes...");
  await prisma.$disconnect();
});
