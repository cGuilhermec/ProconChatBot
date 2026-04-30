import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";


export class ProconModel {
  async findAll(): Promise<any[]> {
    return prisma.procon.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  async findById(id: number): Promise<any | null> {
    return prisma.procon.findUnique({
      where: { PROCON_ID: id },
      include: {
        feriados: true,
        usuarios: {
          select: {
            USUARIO_ID: true,
            nome: true,
            email: true,
            role: true,
            ativo: true,
          },
        },
      },
    });
  }

  async getProconByNomeAndCidade(
    nome: string,
    cidade: string,
  ): Promise<any | null> {
    return prisma.procon.findFirst({
      where: {
        nome: {
          equals: nome,
          mode: "insensitive",
        },
        cidade: {
          equals: cidade,
          mode: "insensitive",
        },
      },
    });
  }

  async create(data: Prisma.ProconCreateInput): Promise<any> {
    return prisma.procon.create({ data });
  }

  async update(id: number, data: Prisma.ProconUpdateInput): Promise<any> {
    return prisma.procon.update({
      where: { PROCON_ID: id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async delete(id: number): Promise<any> {
    return prisma.procon.delete({
      where: { PROCON_ID: id },
    });
  }

  async desativar(id: number): Promise<any> {
    return prisma.procon.update({
      where: { PROCON_ID: id },
      data: {
        ativo: false,
        updated_at: new Date(),
      },
    });
  }

  async ativar(id: number): Promise<any> {
    return prisma.procon.update({
      where: { PROCON_ID: id },
      data: {
        ativo: true,
        updated_at: new Date(),
      },
    });
  }

  async findAllAtivos(): Promise<any[]> {
    return prisma.procon.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });
  }
}
