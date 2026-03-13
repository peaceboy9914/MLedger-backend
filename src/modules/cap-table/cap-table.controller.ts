import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import { CapTableCacheInterceptor } from './cap-table-cache.interceptor';
import { CapTableService } from './cap-table.service';
import { CapTableEntryDto } from './dto/cap-table-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyMembershipGuard } from '../../common/guards/company-membership.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyUserRole } from '../company-users/entities/company-user.entity';

@Controller('cap-table')
@UseInterceptors(CapTableCacheInterceptor)
export class CapTableController {
  constructor(private readonly capTableService: CapTableService) {}

  @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
  @Roles(
    CompanyUserRole.OWNER,
    CompanyUserRole.ADMIN,
    CompanyUserRole.LEGAL,
    CompanyUserRole.FINANCE,
    CompanyUserRole.VIEWER,
  )
  @Get('companies/:companyId')
  @CacheTTL(30_000) // 30 seconds
  async getCapTable(
    @CurrentTenant() tenant: TenantContext,
    @Param('companyId', ParseUUIDPipe) _companyId: string,
  ): Promise<CapTableEntryDto[]> {
    return this.capTableService.getCapTable(tenant.companyId);
  }
}
