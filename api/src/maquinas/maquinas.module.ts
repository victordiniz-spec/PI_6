
import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

import { MaquinasController } from "./maquinas.controller";
import { MaquinasService } from "./maquinas.service";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    MaquinasController,
  ],
  providers: [
    MaquinasService,
  ],
})
export class MaquinasModule {}
