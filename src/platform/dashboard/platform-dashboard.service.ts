import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyStatus } from '../../modules/companies/entities/company.entity';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { AuditLog, AuditAction, AuditEntityType } from '../../modules/audit-logs/entities/audit-log.entity';
import { PlatformDashboardSummaryDto } from './dto/platform-dashboard-summary.dto';
import {
  PlatformCompanyEventDto,
  PlatformCompanyEventType,
  PlatformRecentCompanyEventsResponseDto,
} from './dto/platform-dashboard-recent-company-events.dto';
import {
  PlatformRecentAuditActivityItemDto,
  PlatformRecentAuditActivityResponseDto,
} from './dto/platform-dashboard-recent-audit-activity.dto';

@Injectable()
export class PlatformDashboardService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogsRepo: Repository<AuditLog>,
  ) {}

  async getSummary(): Promise<PlatformDashboardSummaryDto> {
    const [companiesCounts, usersCounts, activityCounts] = await Promise.all([
      this.getCompaniesCounts(),
      this.getUsersCounts(),
      this.getActivityCounts(),
    ]);

    return {
      companies: companiesCounts,
      users: usersCounts,
      activity: activityCounts,
    };
  }

  private async getCompaniesCounts() {
    const total = await this.companiesRepo.count();

    const [active, suspended, pendingReview, archived] = await Promise.all([
      this.companiesRepo.count({ where: { status: CompanyStatus.ACTIVE } }),
      this.companiesRepo.count({ where: { status: CompanyStatus.SUSPENDED } }),
      this.companiesRepo.count({
        where: { status: CompanyStatus.PENDING_REVIEW },
      }),
      this.companiesRepo.count({ where: { status: CompanyStatus.ARCHIVED } }),
    ]);

    return {
      total,
      active,
      suspended,
      pendingReview,
      archived,
    };
  }

  private async getUsersCounts() {
    const total = await this.usersRepo.count();
    const superAdmins = await this.usersRepo.count({
      where: { role: UserRole.SUPER_ADMIN },
    });

    return {
      total,
      superAdmins,
    };
  }

  private async getActivityCounts() {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const onboardedLast30Days = await this.companiesRepo.count({
      where: { createdAt: { $gte: from } as any },
    } as any);

    const statusChangeActions: string[] = [
      AuditAction.COMPANY_STATUS_UPDATED,
      AuditAction.COMPANY_SUSPENDED,
      AuditAction.COMPANY_REACTIVATED,
      AuditAction.COMPANY_ARCHIVED,
      AuditAction.COMPANY_MARKED_PENDING_REVIEW,
    ];

    const statusChangesLast30Days = await this.auditLogsRepo.count({
      where: {
        action: statusChangeActions as any,
        createdAt: { $gte: from } as any,
      } as any,
    } as any);

    return {
      onboardedLast30Days,
      statusChangesLast30Days,
    };
  }

  async getRecentCompanyEvents(
    limit = 20,
  ): Promise<PlatformRecentCompanyEventsResponseDto> {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentCompanies = await this.companiesRepo
      .createQueryBuilder('company')
      .where('company.createdAt >= :from', { from })
      .orderBy('company.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    const statusChangeActions: string[] = [
      AuditAction.COMPANY_STATUS_UPDATED,
      AuditAction.COMPANY_SUSPENDED,
      AuditAction.COMPANY_REACTIVATED,
      AuditAction.COMPANY_ARCHIVED,
      AuditAction.COMPANY_MARKED_PENDING_REVIEW,
    ];

    const recentStatusChanges = await this.auditLogsRepo
      .createQueryBuilder('log')
      .innerJoin('log.company', 'company')
      .where('log.action IN (:...actions)', { actions: statusChangeActions })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    const onboardEvents: PlatformCompanyEventDto[] = recentCompanies.map(
      (c) => ({
        type: PlatformCompanyEventType.COMPANY_ONBOARDED,
        companyId: c.id,
        companyName: c.name,
        createdAt: c.createdAt,
      }),
    );

    const statusEvents: PlatformCompanyEventDto[] = recentStatusChanges.map(
      (log) => ({
        type: PlatformCompanyEventType.COMPANY_STATUS_CHANGED,
        companyId: log.companyId,
        companyName: (log as any).company?.name ?? '',
        createdAt: log.createdAt,
        metadata: log.metadata as any,
      }),
    );

    const combined = [...onboardEvents, ...statusEvents].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return {
      items: combined.slice(0, limit),
    };
  }

  async getRecentAuditActivity(
    limit = 20,
  ): Promise<PlatformRecentAuditActivityResponseDto> {
    const relevantActions: string[] = [
      AuditAction.COMPANY_STATUS_UPDATED,
      AuditAction.COMPANY_SUSPENDED,
      AuditAction.COMPANY_REACTIVATED,
      AuditAction.COMPANY_ARCHIVED,
      AuditAction.COMPANY_MARKED_PENDING_REVIEW,
    ];

    const logs = await this.auditLogsRepo
      .createQueryBuilder('log')
      .where('log.action IN (:...actions)', { actions: relevantActions })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    const items: PlatformRecentAuditActivityItemDto[] = logs.map((log) => ({
      id: log.id,
      action: log.action as AuditAction,
      companyId: log.companyId,
      entityType: log.entityType as AuditEntityType,
      entityId: log.entityId,
      actorUserId: log.actorUserId,
      createdAt: log.createdAt,
      metadata: log.metadata,
    }));

    return { items };
  }
}

