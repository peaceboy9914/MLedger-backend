import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyMembershipGuard } from '../../common/guards/company-membership.guard';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyUserRole } from '../company-users/entities/company-user.entity';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { PaginatedAuditLogsResponseDto, AuditLogResponseDto } from './dto/audit-log-response.dto';

@Controller('companies/:companyId/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @UseGuards(JwtAuthGuard, CompanyMembershipGuard, CompanyRolesGuard)
  @Roles(CompanyUserRole.OWNER, CompanyUserRole.ADMIN, CompanyUserRole.LEGAL)
  @Get()
  async listForCompany(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<PaginatedAuditLogsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const from =
      query.fromDate && !Number.isNaN(Date.parse(query.fromDate))
        ? new Date(query.fromDate)
        : undefined;
    const to =
      query.toDate && !Number.isNaN(Date.parse(query.toDate))
        ? new Date(query.toDate)
        : undefined;

    const result = await this.auditLogs.listForCompany(tenant.companyId, {
      page,
      limit,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      from,
      to,
    });

    const data: AuditLogResponseDto[] = result.data.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      companyId: log.companyId,
      actorUserId: log.actorUserId,
      actorMembershipId: log.actorMembershipId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
    }));

    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}

