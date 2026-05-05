// src/jobs/atualizarAgendamentos.ts
import cron from "node-cron";
import { prisma } from "../config/database";

export const iniciarJobAgendamentos = () => {
  // Executar todos os dias à meia-noite
  cron.schedule("0 0 * * *", async () => {
    console.log("🔄 Executando job de atualização de agendamentos...");

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    try {
      // Marcar como COMPARECEU os agendamentos de hoje
      const compareceu = await prisma.agendamento.updateMany({
        where: {
          data_agendamento: {
            gte: hoje,
            lt: amanha,
          },
          status: "PENDENTE",
        },
        data: { status: "COMPARECEU" },
      });

      // Marcar como FALTOU os agendamentos de dias anteriores
      const faltou = await prisma.agendamento.updateMany({
        where: {
          data_agendamento: { lt: hoje },
          status: "PENDENTE",
        },
        data: { status: "FALTOU" },
      });

      console.log(
        `✅ ${compareceu.count} agendamentos marcados como COMPARECEU`,
      );
      console.log(`✅ ${faltou.count} agendamentos marcados como FALTOU`);
    } catch (error) {
      console.error("❌ Erro no job de agendamentos:", error);
    }
  });

  console.log("⏰ Job de atualização de agendamentos agendado (meia-noite)");
};
