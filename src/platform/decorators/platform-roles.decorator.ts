import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';

export const PLATFORM_ROLES_KEY = 'platform_roles';

export const PlatformRoles = (...roles: UserRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);

