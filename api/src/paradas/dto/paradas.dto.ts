import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class IniciarParadaDto {
  @IsUUID()
  maquinaId!: string;

  @IsOptional()
  @IsUUID()
  ordemProducaoId?: string;

  @IsString()
  @MaxLength(80)
  motivo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

export class EncerrarParadaDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoesEncerramento?: string;
}
