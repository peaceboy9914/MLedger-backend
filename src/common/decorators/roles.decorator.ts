import { SetMetadata } from '@nestjs/common';
import { CompanyUserRole } from '../../modules/company-users/entities/company-user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: CompanyUserRole[]) => SetMetadata(ROLES_KEY, roles);

