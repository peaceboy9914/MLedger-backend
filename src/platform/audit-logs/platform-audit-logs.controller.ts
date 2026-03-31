import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../guards/platform-roles.guard';
import { PlatformRoles } from '../decorators/platform-roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';
import { PlatformAuditLogsService } from './platform-audit-logs.service';
import { ListPlatformAuditLogsQueryDto } from './dto/list-platform-audit-logs-query.dto';
import type { AuditLog } from '../../modules/audit-logs/entities/audit-log.entity';

@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(UserRole.SUPER_ADMIN)
@Controller('platform/audit-logs')
export class PlatformAuditLogsController {
  constructor(private readonly service: PlatformAuditLogsService) {}

  @Get()
  async list(
    @Query() query: ListPlatformAuditLogsQueryDto,
  ): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.service.list(query);
  }
}

