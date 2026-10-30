import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApontamentosController } from './apontamentos.controller';
import { ApontamentosService } from './apontamentos.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ApontamentosController],
  providers: [ApontamentosService],
})
export class ApontamentosModule {}
