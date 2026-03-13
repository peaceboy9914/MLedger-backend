import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompanyUsersService } from '../../modules/company-users/company-users.service';
import { TenantContext } from '../interfaces/tenant-context.interface';
import { CompanyUserStatus } from '../../modules/company-users/entities/company-user.entity';
import { Request } from 'express';

@Injectable()
export class CompanyMembershipGuard implements CanActivate {
  constructor(
    private readonly companyUsersService: CompanyUsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const user = request.user as { id?: string } | undefined;
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    const raw = request.params?.companyId;
    const companyId = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;

    if (!companyId) {
      throw new ForbiddenException('Company context is required');
    }

    const membership = await this.companyUsersService.findActiveMembership(
      companyId,
      user.id,
    );

    if (!membership || membership.status !== CompanyUserStatus.ACTIVE) {
      throw new ForbiddenException('No active membership for this company');
    }

    const tenant: TenantContext = {
      companyId: membership.companyId,
      membershipId: membership.id,
      role: membership.role,
      status: membership.status,
      userId: membership.userId,
    };

    request.tenant = tenant;

    return true;
  }
}

