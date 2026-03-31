import { AuditAction, AuditEntityType } from '../../../modules/audit-logs/entities/audit-log.entity';

export class PlatformRecentAuditActivityItemDto {
  id: string;
  action: AuditAction | string;
  companyId: string;
  entityType: AuditEntityType | string;
  entityId: string | null;
  actorUserId: string | null;
  createdAt: Date;
  metadata: any;
}

export class PlatformRecentAuditActivityResponseDto {
  items: PlatformRecentAuditActivityItemDto[];
}

