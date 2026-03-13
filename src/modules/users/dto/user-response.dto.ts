import { UserRole, UserStatus } from '../entities/user.entity';

/** Use for any user-facing API responses from the users module. Excludes passwordHash. */
export class UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
}

