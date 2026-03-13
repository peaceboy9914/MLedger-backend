import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CompanyUserRole, CompanyUserStatus } from '../entities/company-user.entity';

export class CreateCompanyUserDto {
  @IsUUID()
  userId: string;

  @IsEnum(CompanyUserRole)
  role: CompanyUserRole;

  @IsEnum(CompanyUserStatus)
  status: CompanyUserStatus;

  @IsOptional()
  @IsUUID()
  invitedByUserId?: string;
}

