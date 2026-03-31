import { CompanyStatus } from '../../../modules/companies/entities/company.entity';
import { CompanyUserRole } from '../../../modules/company-users/entities/company-user.entity';

export class OnboardedPlatformCompanyDto {
  id: string;
  name: string;
  status: CompanyStatus;
  authorizedCapital: number;
  createdAt: Date;
}

export class OnboardedPlatformInitialOwnerDto {
  userId: string;
  fullName: string;
  email: string;
  role: CompanyUserRole.OWNER;
}

export class OnboardPlatformCompanyResponseDto {
  company: OnboardedPlatformCompanyDto;
  initialOwner: OnboardedPlatformInitialOwnerDto;
}

