
import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";

import { TabletsController } from "./tablets.controller";
import { TabletsService } from "./tablets.service";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    TabletsController,
  ],
  providers: [
    TabletsService,
  ],
  exports: [
    TabletsService,
  ],
})
export class TabletsModule {}
