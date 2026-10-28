-- CreateEnum
CREATE TYPE "SituacaoOP" AS ENUM ('PENDENTE', 'EM_PRODUCAO', 'PAUSADA', 'FINALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "ordens_producao" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidadePlanejada" INTEGER NOT NULL,
    "quantidadeProduzida" INTEGER NOT NULL DEFAULT 0,
    "situacao" "SituacaoOP" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "dataPrevisao" TIMESTAMP(3),
    "iniciadaEm" TIMESTAMP(3),
    "finalizadaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_producao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordens_producao_numero_key" ON "ordens_producao"("numero");

-- CreateIndex
CREATE INDEX "ordens_producao_produtoId_idx" ON "ordens_producao"("produtoId");

-- CreateIndex
CREATE INDEX "ordens_producao_situacao_idx" ON "ordens_producao"("situacao");

-- AddForeignKey
ALTER TABLE "ordens_producao" ADD CONSTRAINT "ordens_producao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
