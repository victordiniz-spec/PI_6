import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { RequisicaoAutenticada } from './jwt-auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    if (req.usuario?.perfil !== 'ADMIN') throw new ForbiddenException('Acesso permitido somente a administradores.');
    return true;
  }
}
