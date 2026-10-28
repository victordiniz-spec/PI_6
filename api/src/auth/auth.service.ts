
import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";

import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dados: LoginDto) {
    const email = dados.email.trim().toLowerCase();

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException(
        "E-mail ou senha inválidos",
      );
    }

    const senhaCorreta = await argon2.verify(
      usuario.senhaHash,
      dados.senha,
    ).catch(() => false);

    if (!senhaCorreta) {
      throw new UnauthorizedException(
        "E-mail ou senha inválidos",
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
    });

    return {
      accessToken,
      tokenType: "Bearer",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    };
  }
}
