-- CreateTable
CREATE TABLE "paradas_producao" (
    "id" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "ordemProducaoId" TEXT,
    "motivo" TEXT NOT NULL,
    "observacoes" TEXT,
    "observacoesEncerramento" TEXT,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradoEm" TIMESTAMP(3),
    "iniciadoPorId" TEXT NOT NULL,
    "encerradoPorId" TEXT,

    CONSTRAINT "paradas_producao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "paradas_producao_maquinaId_encerradoEm_idx" ON "paradas_producao"("maquinaId", "encerradoEm");

-- CreateIndex
CREATE INDEX "paradas_producao_ordemProducaoId_idx" ON "paradas_producao"("ordemProducaoId");

-- CreateIndex
CREATE INDEX "paradas_producao_iniciadoEm_idx" ON "paradas_producao"("iniciadoEm");

-- AddForeignKey
ALTER TABLE "paradas_producao" ADD CONSTRAINT "paradas_producao_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradas_producao" ADD CONSTRAINT "paradas_producao_ordemProducaoId_fkey" FOREIGN KEY ("ordemProducaoId") REFERENCES "ordens_producao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradas_producao" ADD CONSTRAINT "paradas_producao_iniciadoPorId_fkey" FOREIGN KEY ("iniciadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradas_producao" ADD CONSTRAINT "paradas_producao_encerradoPorId_fkey" FOREIGN KEY ("encerradoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
