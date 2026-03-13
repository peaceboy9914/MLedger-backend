import { CompanyUserRole, CompanyUserStatus } from '../../modules/company-users/entities/company-user.entity';

export interface TenantContext {
  companyId: string;
  membershipId: string;
  role: CompanyUserRole;
  status: CompanyUserStatus;
  userId: string;
}

