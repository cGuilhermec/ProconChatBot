import { prisma } from "../config/database";
import { Procon } from "../types/procon.types";

export class ProconModel {
    
  async createProconDev(procon: Procon) {
    return prisma.procon.create({ data: procon });
  }

  async getProconByNomeAndCidade(nome: string, cidade: string) {
    return prisma.procon.findFirst({
      where: {
        nome: {
          equals: nome,
          mode: "insensitive", // Case insensitive
        },
        cidade: {
          equals: cidade,
          mode: "insensitive",
        },
      },
    });
  }
}
