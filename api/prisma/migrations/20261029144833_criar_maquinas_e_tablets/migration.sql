-- CreateEnum
CREATE TYPE "SituacaoMaquina" AS ENUM ('ATIVA', 'MANUTENCAO', 'INATIVA');

-- CreateEnum
CREATE TYPE "SituacaoTablet" AS ENUM ('PENDENTE', 'AUTORIZADO', 'BLOQUEADO');

-- CreateTable
CREATE TABLE "maquinas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "situacao" "SituacaoMaquina" NOT NULL DEFAULT 'ATIVA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tablets" (
    "id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "nome" TEXT,
    "situacao" "SituacaoTablet" NOT NULL DEFAULT 'PENDENTE',
    "maquinaId" TEXT,
    "autorizadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tablets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maquinas_codigo_key" ON "maquinas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tablets_identificador_key" ON "tablets"("identificador");

-- CreateIndex
CREATE INDEX "tablets_maquinaId_idx" ON "tablets"("maquinaId");

-- AddForeignKey
ALTER TABLE "tablets" ADD CONSTRAINT "tablets_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
