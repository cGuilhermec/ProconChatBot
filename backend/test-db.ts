// test-db.ts
import { prisma } from "./src/config/database";

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Conexão OK:", result);
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

test();
