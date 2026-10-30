
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

// ==========================================
// PERFIS DE USUÁRIOS
// ==========================================

export type PerfilUsuarioDto =
  | "ADMIN"
  | "SUPERVISOR"
  | "OPERADOR";

const PERFIS_PERMITIDOS = [
  "ADMIN",
  "SUPERVISOR",
  "OPERADOR",
] as const;

// ==========================================
// CADASTRAR USUÁRIO
// ==========================================

export class CriarUsuarioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  senha!: string;

  @IsOptional()
  @IsIn(PERFIS_PERMITIDOS)
  perfil?: PerfilUsuarioDto;
}

// ==========================================
// ATUALIZAR USUÁRIO
// ==========================================

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsIn(PERFIS_PERMITIDOS)
  perfil?: PerfilUsuarioDto;

  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  senha?: string;
}

// ==========================================
// ATIVAR / DESATIVAR USUÁRIO
// ==========================================

export class AtualizarSituacaoUsuarioDto {
  @IsBoolean()
  ativo!: boolean;
}
