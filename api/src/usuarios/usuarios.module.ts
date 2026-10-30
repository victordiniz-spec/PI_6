import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
