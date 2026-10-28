
import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo das rotas da API
  app.setGlobalPrefix("api");

  // Validação dos dados recebidos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Permitir acesso do painel web durante desenvolvimento
  app.enableCors({
    origin: ["http://localhost:5173"],
  });

  // Porta do backend
  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  console.log(
    `PRODSYNC ERP - API funcionando em http://localhost:${port}/api`,
  );
}

void bootstrap();
