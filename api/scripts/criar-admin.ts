
import "dotenv/config";

import * as argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const nome = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();
  const senha = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!connectionString || !nome || !email || !senha) {
    throw new Error(
      "Configure DATABASE_URL, BOOTSTRAP_ADMIN_NAME, " +
      "BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD.",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail inválido.");
  }

  if (senha.length < 12) {
    throw new Error("A senha deve ter pelo menos 12 caracteres.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const totalAdmins = await prisma.usuario.count({
      where: { perfil: "ADMIN" },
    });

    if (totalAdmins > 0) {
      throw new Error(
        "Já existe um administrador. " +
        "Utilize o gerenciamento de usuários para novos cadastros.",
      );
    }

    const existente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existente) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const senhaHash = await argon2.hash(senha, {
      type: argon2.argon2id,
    });

    await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        perfil: "ADMIN",
        ativo: true,
      },
    });

    console.log("Administrador criado com sucesso!");
    console.log(`E-mail: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro: unknown) => {
  console.error(
    erro instanceof Error ? erro.message : "Erro inesperado.",
  );
  process.exitCode = 1;
});
