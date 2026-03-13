import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CompanyUsersService } from './company-users.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { CompanyUserResponseDto } from './dto/company-user-response.dto';
import { CompanyUserRole, CompanyUserStatus } from './entities/company-user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyMembershipGuard } from '../../common/guards/company-membership.guard';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';

@Controller('companies/:companyId/members')
export class CompanyUsersController {
  constructor(private readonly companyUsersService: CompanyUsersService) {}

  @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
  @Roles(CompanyUserRole.OWNER)
  @Post()
  async create(
    @Param('companyId') companyId: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateCompanyUserDto,
  ): Promise<CompanyUserResponseDto> {
    return this.companyUsersService.createMembership(
      companyId,
      dto.userId,
      dto.role as CompanyUserRole,
      dto.status as CompanyUserStatus,
      dto.invitedByUserId,
      tenant,
    );
  }

  @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
  @Roles(CompanyUserRole.OWNER)
  @Get()
  async listCompanyMembers(
    @Param('companyId') companyId: string,
  ): Promise<CompanyUserResponseDto[]> {
    return this.companyUsersService.listCompanyMembers(companyId);
  }
}

