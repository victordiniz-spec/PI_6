
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CriarProdutoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descricao!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  acabamento?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  larguraMm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  espessuraMm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  unidade?: string;
}
