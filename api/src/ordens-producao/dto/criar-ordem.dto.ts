import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CriarOrdemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  numero!: string;

  @IsUUID()
  produtoId!: string;

  @IsInt()
  @Min(1)
  quantidadePlanejada!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
}
