import { CompanyStatus } from '../../../modules/companies/entities/company.entity';

export class PlatformCompanyListItemDto {
  id: string;
  name: string;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class PlatformCompanyDetailDto {
  id: string;
  name: string;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
  authorizedCapital: number;
  suspendedAt: Date | null;
  suspendedByUserId: string | null;
  suspensionReason: string | null;
}

