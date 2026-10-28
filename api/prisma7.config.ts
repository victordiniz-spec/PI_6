
import "dotenv/config";

import { defineConfig, env } from "prisma/config";

/**
 * PRODSYNC ERP
 *
 * Configuracao do Prisma ORM 7
 *
 * Banco de dados: PostgreSQL
 * Ambiente: Desenvolvimento
 */

export default defineConfig({
  // Localizacao do schema do banco
  schema: "prisma/schema.prisma",

  // Configuracao das migracoes
  migrations: {
    path: "prisma/migrations",
  },

  // Conexao com o PostgreSQL
  datasource: {
    url: env("DATABASE_URL"),
  },
});
