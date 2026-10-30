-- CreateTable
CREATE TABLE "apontamentos_producao" (
    "id" TEXT NOT NULL,
    "ordemProducaoId" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "quantidadeProduzida" INTEGER NOT NULL,
    "quantidadeRejeitada" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apontamentos_producao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "apontamentos_producao_ordemProducaoId_idx" ON "apontamentos_producao"("ordemProducaoId");

-- CreateIndex
CREATE INDEX "apontamentos_producao_maquinaId_idx" ON "apontamentos_producao"("maquinaId");

-- CreateIndex
CREATE INDEX "apontamentos_producao_operadorId_idx" ON "apontamentos_producao"("operadorId");

-- CreateIndex
CREATE INDEX "apontamentos_producao_criadoEm_idx" ON "apontamentos_producao"("criadoEm");

-- AddForeignKey
ALTER TABLE "apontamentos_producao" ADD CONSTRAINT "apontamentos_producao_ordemProducaoId_fkey" FOREIGN KEY ("ordemProducaoId") REFERENCES "ordens_producao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apontamentos_producao" ADD CONSTRAINT "apontamentos_producao_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apontamentos_producao" ADD CONSTRAINT "apontamentos_producao_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
