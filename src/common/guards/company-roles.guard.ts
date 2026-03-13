import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CompanyUserRole } from '../../modules/company-users/entities/company-user.entity';
import { TenantContext } from '../interfaces/tenant-context.interface';

@Injectable()
export class CompanyRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<CompanyUserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (!requiredRoles.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant as TenantContext | undefined;

    if (!tenant?.role) {
      throw new ForbiddenException('No tenant role available');
    }

    if (!requiredRoles.includes(tenant.role)) {
      throw new ForbiddenException('Insufficient role for this operation');
    }

    return true;
  }
}

