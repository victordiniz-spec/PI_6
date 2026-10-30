import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CriarApontamentoDto {
  @IsUUID() ordemId!: string;
  @IsUUID() maquinaId!: string;
  @IsUUID() operadorId!: string;
  @IsInt() @Min(1) quantidadeBoa!: number;
  @IsInt() @Min(0) quantidadeRejeitada!: number;
  @IsOptional() @IsString() @MaxLength(500) observacoes?: string;
}
