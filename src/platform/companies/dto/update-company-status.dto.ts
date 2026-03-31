import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanyStatus } from '../../../modules/companies/entities/company.entity';

export class UpdateCompanyStatusDto {
  @IsEnum(CompanyStatus)
  status: CompanyStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

