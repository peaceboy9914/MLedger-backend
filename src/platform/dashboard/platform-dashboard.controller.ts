import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../guards/platform-roles.guard';
import { PlatformRoles } from '../decorators/platform-roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';
import { PlatformDashboardService } from './platform-dashboard.service';
import { PlatformDashboardSummaryDto } from './dto/platform-dashboard-summary.dto';
import { PlatformRecentCompanyEventsResponseDto } from './dto/platform-dashboard-recent-company-events.dto';
import { PlatformRecentAuditActivityResponseDto } from './dto/platform-dashboard-recent-audit-activity.dto';

@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(UserRole.SUPER_ADMIN)
@Controller('platform/dashboard')
export class PlatformDashboardController {
  constructor(private readonly dashboard: PlatformDashboardService) {}

  @Get('summary')
  async getSummary(): Promise<PlatformDashboardSummaryDto> {
    return this.dashboard.getSummary();
  }

  @Get('recent-company-events')
  async getRecentCompanyEvents(
    @Query('limit') limit?: string,
  ): Promise<PlatformRecentCompanyEventsResponseDto> {
    const parsedLimit = Number(limit);
    const effectiveLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 50
        ? parsedLimit
        : 20;
    return this.dashboard.getRecentCompanyEvents(effectiveLimit);
  }

  @Get('recent-audit-activity')
  async getRecentAuditActivity(
    @Query('limit') limit?: string,
  ): Promise<PlatformRecentAuditActivityResponseDto> {
    const parsedLimit = Number(limit);
    const effectiveLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 50
        ? parsedLimit
        : 20;
    return this.dashboard.getRecentAuditActivity(effectiveLimit);
  }
}

