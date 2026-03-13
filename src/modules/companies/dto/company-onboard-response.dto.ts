import { CompanyStatus } from '../entities/company.entity';

export class CompanySummaryDto {
  id: string;
  name: string;
  registrationNumber: string;
  status: CompanyStatus;
}

export class CompanyAdminSummaryDto {
  id: string;
  fullName: string;
  email: string;
}

export class CompanyOnboardResponseDto {
  company: CompanySummaryDto;
  adminUser: CompanyAdminSummaryDto;
}

