// src/__tests__/helpers/db.helper.ts
import { prisma } from "../../config/database";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret_key_for_jwt";

// Guardar os IDs criados DURANTE os testes
const createdIds = {
  procons: [] as number[],
  usuarios: [] as number[],
  feriados: [] as number[], // ⬅️ ADICIONAR
};

export class DbHelper {
  // Limpar TODOS os dados de teste do banco (independente de quando foram criados)
  static async cleanAllTestData() {
    console.log("🧹 Limpando TODOS os dados de teste do banco...");

    // ⬅️ 1. Limpar Feriados primeiro (por causa das chaves estrangeiras)
    const deletedFeriados = await prisma.feriado.deleteMany({
      where: {
        OR: [
          { nome: { contains: "Natal" } },
          { nome: { contains: "Ano Novo" } },
          { nome: { contains: "Tiradentes" } },
          { nome: { contains: "Padroeira" } },
          { nome: { contains: "Proclamação" } },
          { nome: { contains: "Trabalhador" } },
          { nome: { contains: "Feriado" } },
          { nome: { contains: "[TESTE]" } },
        ],
      },
    });

    // 2. Limpar usuários com emails de teste (@teste.com)
    const deletedUsers = await prisma.usuario.deleteMany({
      where: {
        OR: [
          { email: { contains: "@teste.com" } },
          { nome: { contains: "[TESTE]" } },
          { email: { contains: "test." } },
        ],
      },
    });

    // 3. Limpar Procons com emails de teste (@teste.com) OU que tenham [TESTE] no nome
    const deletedProcons = await prisma.procon.deleteMany({
      where: {
        OR: [
          { email: { contains: "@teste.com" } },
          { nome: { contains: "[TESTE]" } },
          { email: { contains: "teste" } },
          { nome: { contains: "Procon Teste" } },
          { nome: { contains: "Procon Duplicado" } },
          { nome: { contains: "Procon Desativar" } },
          { nome: { contains: "Procon Ativar" } },
          { nome: { contains: "Procon Busca" } },
          { nome: { contains: "Procon Update" } },
          { nome: { contains: "Procon Atualizado" } },
        ],
      },
    });

    console.log(`🗑️ Deletados ${deletedFeriados.count} feriados de teste`);
    console.log(`🗑️ Deletados ${deletedUsers.count} usuários de teste`);
    console.log(`🗑️ Deletados ${deletedProcons.count} procons de teste`);

    // Limpar os arrays locais
    createdIds.procons = [];
    createdIds.usuarios = [];
    createdIds.feriados = []; // ⬅️ ADICIONAR
  }

  // Limpar APENAS os dados criados nesta execução
  static async cleanTestData() {
    console.log(
      `🧹 Limpando dados de teste desta execução: ${createdIds.usuarios.length} usuários, ${createdIds.procons.length} procons, ${createdIds.feriados.length} feriados`,
    );

    if (createdIds.usuarios.length > 0) {
      await prisma.usuario.deleteMany({
        where: { USUARIO_ID: { in: createdIds.usuarios } },
      });
      createdIds.usuarios = [];
    }

    if (createdIds.procons.length > 0) {
      await prisma.procon.deleteMany({
        where: { PROCON_ID: { in: createdIds.procons } },
      });
      createdIds.procons = [];
    }

    // ⬅️ ADICIONAR LIMPEZA DE FERIADOS
    if (createdIds.feriados.length > 0) {
      await prisma.feriado.deleteMany({
        where: { FERIADO_ID: { in: createdIds.feriados } },
      });
      createdIds.feriados = [];
    }
  }

  // ⬅️ ADICIONAR MÉTODO PARA CRIAR FERIADO DE TESTE
  static async createTestFeriado(
    proconId: number,
    nome: string,
    data: Date,
    recorrente: boolean = false,
  ) {
    const feriado = await prisma.feriado.create({
      data: {
        procon_id: proconId,
        data: data,
        nome: nome,
        recorrente: recorrente,
      },
    });

    createdIds.feriados.push(feriado.FERIADO_ID);
    console.log(
      `📅 Feriado de teste criado: ${feriado.nome} (ID ${feriado.FERIADO_ID})`,
    );
    return feriado;
  }

  static async createTestProcon() {
    const timestamp = Date.now();
    const procon = await prisma.procon.create({
      data: {
        nome: `[TESTE] Procon ${timestamp}`,
        cidade: "[TESTE] Cidade Teste",
        estado: "TS",
        endereco: "[TESTE] Rua Teste, 123",
        telefone: "(11) 99999-9999",
        email: `teste${timestamp}@teste.com`,
        horario_abertura: new Date("1970-01-01T08:00:00"),
        horario_fechamento: new Date("1970-01-01T17:00:00"),
        duracao_atendimento_minutos: 30,
        vagas_por_horario: 2,
      },
    });

    createdIds.procons.push(procon.PROCON_ID);
    console.log(`📦 Procon de teste criado: ID ${procon.PROCON_ID}`);
    return procon;
  }

  static async createTestUser(
    role: string,
    proconId: number,
    ativo: boolean = true,
    primeiro_acesso: boolean = false,
  ) {
    const senhaHash = await hash("123456", 8);
    const timestamp = Date.now();
    const email = `test.${role.toLowerCase()}.${timestamp}@teste.com`;

    const user = await prisma.usuario.create({
      data: {
        nome: `[TESTE] ${role} ${timestamp}`,
        email: email,
        senha: senhaHash,
        role: role as any,
        procon_id: proconId,
        ativo,
        primeiro_acesso,
      },
    });

    createdIds.usuarios.push(user.USUARIO_ID);
    console.log(
      `👤 Usuário de teste criado: ${user.email} (ID ${user.USUARIO_ID})`,
    );
    return user;
  }

  static async getToken(userEmail: string) {
    const user = await prisma.usuario.findUnique({
      where: { email: userEmail },
      select: {
        USUARIO_ID: true,
        email: true,
        nome: true,
        role: true,
        procon_id: true,
        ativo: true,
        primeiro_acesso: true,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userEmail}`);
    }

    return jwt.sign(
      {
        id: user.USUARIO_ID,
        email: user.email,
        nome: user.nome,
        role: user.role,
        procon_id: user.procon_id,
        ativo: user.ativo,
        primeiro_acesso: user.primeiro_acesso,
      },
      JWT_SECRET,
      { expiresIn: "2h" },
    );
  }
}
