
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseController } from './database.controller';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './users/usuarios.module';
import { ProdutosModule } from './produtos/produtos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ProdutosModule,
  ],
  controllers: [
    AppController,
    DatabaseController,
  ],
  providers: [
    AppService,
  ],
})
export class AppModule {}
