import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import { CompaniesService } from './companies.service';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { CompanyListItemDto } from './dto/company-list-item.dto';
import { CompanyOnboardResponseDto } from './dto/company-onboard-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyMembershipGuard } from '../../common/guards/company-membership.guard';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyUserRole } from '../company-users/entities/company-user.entity';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CapTableService } from '../cap-table/cap-table.service';
import type { CapTableEntryDto } from '../cap-table/dto/cap-table-entry.dto';
import { CapTableCacheInterceptor } from '../cap-table/cap-table-cache.interceptor';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly capTableService: CapTableService,
  ) {}

  // 🔥 Super Admin / platform onboarding endpoint (unchanged in this pass)
  @Post('onboard')
  async onboardCompany(
    @Body() dto: CreateCompanyWithAdminDto,
  ): Promise<CompanyOnboardResponseDto> {
    return this.companiesService.createCompanyWithAdmin(dto);
  }

  // 🔒 Tenant-scoped: cap table (normalized route; same cache key as GET /cap-table/companies/:companyId)
  @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
  @Roles(
    CompanyUserRole.OWNER,
    CompanyUserRole.ADMIN,
    CompanyUserRole.LEGAL,
    CompanyUserRole.FINANCE,
    CompanyUserRole.VIEWER,
  )
  @Get(':companyId/cap-table')
  @UseInterceptors(CapTableCacheInterceptor)
  @CacheTTL(30_000)
  async getCapTable(
    @CurrentTenant() tenant: TenantContext,
    @Param('companyId', ParseUUIDPipe) _companyId: string,
  ): Promise<CapTableEntryDto[]> {
    return this.capTableService.getCapTable(tenant.companyId);
  }

  // 🔒 Tenant-scoped: get one company by id (guard ensures membership; :companyId in path)
  @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
  @Roles(
    CompanyUserRole.OWNER,
    CompanyUserRole.ADMIN,
    CompanyUserRole.LEGAL,
    CompanyUserRole.FINANCE,
    CompanyUserRole.VIEWER,
  )
  @Get(':companyId')
  async getCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<CompanyListItemDto> {
    return this.companiesService.findOne(companyId);
  }
}