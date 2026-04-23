-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FUNCIONARIO', 'COORDENADOR', 'DIRETOR', 'DEV');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'COMPARECEU', 'FALTOU');

-- CreateTable
CREATE TABLE "Procon" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "horario_abertura" TIMESTAMP(3) NOT NULL,
    "horario_fechamento" TIMESTAMP(3) NOT NULL,
    "duracao_atendimento_minutos" INTEGER NOT NULL DEFAULT 30,
    "vagas_por_horario" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" SERIAL NOT NULL,
    "procon_id" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "nome" TEXT NOT NULL,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FUNCIONARIO',
    "procon_id" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pergunta" (
    "id" SERIAL NOT NULL,
    "procon_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "atualizado_por" INTEGER NOT NULL,
    "tema" TEXT NOT NULL,
    "pergunta" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "base_legal" JSONB,
    "documentos" JSONB,
    "observacao" TEXT,
    "embedding" vector,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pergunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" SERIAL NOT NULL,
    "procon_id" INTEGER NOT NULL,
    "nome_usuario" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "data_agendamento" TIMESTAMP(3) NOT NULL,
    "horario_agendamento" TIMESTAMP(3) NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "pergunta_id" INTEGER,
    "acao" TEXT NOT NULL,
    "dados_anteriores" JSONB,
    "dados_novos" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Procon_cidade_idx" ON "Procon"("cidade");

-- CreateIndex
CREATE INDEX "Procon_estado_idx" ON "Procon"("estado");

-- CreateIndex
CREATE INDEX "Feriado_procon_id_data_idx" ON "Feriado"("procon_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_procon_id_data_key" ON "Feriado"("procon_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_role_idx" ON "Usuario"("role");

-- CreateIndex
CREATE INDEX "Usuario_procon_id_idx" ON "Usuario"("procon_id");

-- CreateIndex
CREATE INDEX "Pergunta_procon_id_ativo_idx" ON "Pergunta"("procon_id", "ativo");

-- CreateIndex
CREATE INDEX "Pergunta_criado_por_idx" ON "Pergunta"("criado_por");

-- CreateIndex
CREATE INDEX "Pergunta_atualizado_por_idx" ON "Pergunta"("atualizado_por");

-- CreateIndex
CREATE INDEX "Pergunta_tema_idx" ON "Pergunta"("tema");

-- CreateIndex
CREATE INDEX "Agendamento_procon_id_data_agendamento_horario_agendamento__idx" ON "Agendamento"("procon_id", "data_agendamento", "horario_agendamento", "status");

-- CreateIndex
CREATE INDEX "Agendamento_procon_id_cpf_data_agendamento_idx" ON "Agendamento"("procon_id", "cpf", "data_agendamento");

-- CreateIndex
CREATE INDEX "Agendamento_status_idx" ON "Agendamento"("status");

-- CreateIndex
CREATE INDEX "Agendamento_data_agendamento_idx" ON "Agendamento"("data_agendamento");

-- CreateIndex
CREATE INDEX "AuditLog_usuario_id_created_at_idx" ON "AuditLog"("usuario_id", "created_at");

-- CreateIndex
CREATE INDEX "AuditLog_pergunta_id_created_at_idx" ON "AuditLog"("pergunta_id", "created_at");

-- CreateIndex
CREATE INDEX "AuditLog_acao_idx" ON "AuditLog"("acao");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- AddForeignKey
ALTER TABLE "Feriado" ADD CONSTRAINT "Feriado_procon_id_fkey" FOREIGN KEY ("procon_id") REFERENCES "Procon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_procon_id_fkey" FOREIGN KEY ("procon_id") REFERENCES "Procon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pergunta" ADD CONSTRAINT "Pergunta_procon_id_fkey" FOREIGN KEY ("procon_id") REFERENCES "Procon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pergunta" ADD CONSTRAINT "Pergunta_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pergunta" ADD CONSTRAINT "Pergunta_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_procon_id_fkey" FOREIGN KEY ("procon_id") REFERENCES "Procon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_pergunta_id_fkey" FOREIGN KEY ("pergunta_id") REFERENCES "Pergunta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
