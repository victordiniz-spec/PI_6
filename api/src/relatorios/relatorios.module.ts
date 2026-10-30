import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}
