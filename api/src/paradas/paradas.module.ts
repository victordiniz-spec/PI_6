import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ParadasController } from './paradas.controller';
import { ParadasService } from './paradas.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ParadasController],
  providers: [ParadasService],
})
export class ParadasModule {}
