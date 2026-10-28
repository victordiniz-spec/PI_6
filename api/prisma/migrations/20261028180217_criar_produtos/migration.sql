-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "cor" TEXT,
    "acabamento" TEXT,
    "larguraMm" INTEGER,
    "espessuraMm" INTEGER,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");
