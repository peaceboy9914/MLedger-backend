import { CompanyStatus } from '../entities/company.entity';

export class CompanyListItemDto {
  id: string;
  name: string;
  registrationNumber: string;
  status: CompanyStatus;
}
