import { Injectable } from '@nestjs/common';
import { AuditLogsService, ListAuditLogsOptions } from '../../modules/audit-logs/audit-logs.service';
import { ListPlatformAuditLogsQueryDto } from './dto/list-platform-audit-logs-query.dto';

@Injectable()
export class PlatformAuditLogsService {
  constructor(private readonly auditLogs: AuditLogsService) {}

  async list(
    query: ListPlatformAuditLogsQueryDto,
  ): Promise<Awaited<ReturnType<AuditLogsService['listAll']>>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const options: ListAuditLogsOptions = {
      page,
      limit,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
    };

    const from =
      query.fromDate && !Number.isNaN(Date.parse(query.fromDate))
        ? new Date(query.fromDate)
        : undefined;
    const to =
      query.toDate && !Number.isNaN(Date.parse(query.toDate))
        ? new Date(query.toDate)
        : undefined;

    if (from) {
      options.from = from;
    }
    if (to) {
      options.to = to;
    }
    if (query.companyId) {
      (options as any).companyId = query.companyId;
    }

    return this.auditLogs.listAll(options as any);
  }
}

