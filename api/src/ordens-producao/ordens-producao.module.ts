import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { OrdensProducaoController } from "./ordens-producao.controller";

import { OrdensProducaoService } from "./ordens-producao.service";

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    OrdensProducaoController,
  ],
  providers: [
    OrdensProducaoService,
  ],
})
export class OrdensProducaoModule {}
