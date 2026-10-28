import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { PerfilUsuario } from '../../generated/prisma/enums';

export class CriarUsuarioDto {
  @IsString() @MinLength(2) @MaxLength(120)
  nome!: string;

  @IsEmail() @MaxLength(254)
  email!: string;

  @IsString() @MinLength(12) @MaxLength(128)
  senha!: string;

  @IsEnum(PerfilUsuario)
  perfil!: PerfilUsuario;
}
