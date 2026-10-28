import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsuariosController } from './usuarios.controller';

@Module({ imports: [AuthModule], controllers: [UsuariosController] })
export class UsuariosModule {}
