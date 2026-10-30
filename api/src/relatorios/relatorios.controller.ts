
import {
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import {
  FiltrosRelatorio,
  RelatoriosService,
} from "./relatorios.service";

// ==========================================
// GUARD: ADMINISTRADOR OU SUPERVISOR
// ==========================================

@Injectable()
class AdminOuSupervisorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{
        usuario?: {
          id?: string;
          perfil?: string;
        };
      }>();

    const perfil = request.usuario?.perfil;

    if (
      perfil === "ADMIN" ||
      perfil === "SUPERVISOR"
    ) {
      return true;
    }

    throw new ForbiddenException(
      "Acesso permitido somente a administradores e supervisores.",
    );
  }
}

// ==========================================
// CONTROLLER DE RELATÓRIOS
// ==========================================

@Controller("relatorios")
@UseGuards(
  JwtAuthGuard,
  AdminOuSupervisorGuard,
)
export class RelatoriosController {
  constructor(
    private readonly service: RelatoriosService,
  ) {}

  @Get("producao")
  producao(
    @Query("inicio") inicio?: string,
    @Query("fim") fim?: string,
    @Query("ordemId") ordemId?: string,
    @Query("maquinaId") maquinaId?: string,
    @Query("operadorId") operadorId?: string,
  ) {
    const filtros: FiltrosRelatorio = {
      inicio,
      fim,
      ordemId,
      maquinaId,
      operadorId,
    };

    return this.service.producao(filtros);
  }
}
