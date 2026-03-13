import { UserRole, UserStatus } from '../../users/entities/user.entity';

export class CompanyUserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
}
