// src/model/feriado.model.ts
import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

export class FeriadoModel {
  async create(data: Prisma.FeriadoCreateInput) {
    return prisma.feriado.create({ data });
  }

  async findAll(proconId?: number) {
    const where: any = {};
    if (proconId) {
      where.procon_id = proconId;
    }
    return prisma.feriado.findMany({
      where,
      orderBy: { data: "asc" },
      include: {
        procon: {
          select: {
            PROCON_ID: true,
            nome: true,
            cidade: true,
          },
        },
      },
    });
  }

  async findById(id: number) {
    return prisma.feriado.findUnique({
      where: { FERIADO_ID: id }, // ⬅️ Usar FERIADO_ID
      include: {
        procon: {
          select: {
            PROCON_ID: true,
            nome: true,
            cidade: true,
          },
        },
      },
    });
  }

  async findByData(proconId: number, data: Date) {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.feriado.findFirst({
      where: {
        procon_id: proconId,
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  async update(id: number, data: Prisma.FeriadoUpdateInput) {
    return prisma.feriado.update({
      where: { FERIADO_ID: id }, // ⬅️ Usar FERIADO_ID
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async delete(id: number) {
    return prisma.feriado.delete({
      where: { FERIADO_ID: id }, // ⬅️ Usar FERIADO_ID
    });
  }

  async isFeriado(proconId: number, data: Date): Promise<boolean> {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    const feriado = await prisma.feriado.findFirst({
      where: {
        procon_id: proconId,
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return !!feriado;
  }
}
