import { CompanyUserRole, CompanyUserStatus } from '../entities/company-user.entity';

export class CompanyUserResponseDto {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyUserRole;
  status: CompanyUserStatus;
  invitedByUserId?: string | null;
  joinedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

