import { BadRequestException } from '@nestjs/common';
import { CompanyStatus } from '../../modules/companies/entities/company.entity';
import { AuditAction } from '../../modules/audit-logs/entities/audit-log.entity';

const ALLOWED_TRANSITIONS: Readonly<
  Record<CompanyStatus, readonly CompanyStatus[]>
> = {
  [CompanyStatus.PENDING_REVIEW]: [
    CompanyStatus.ACTIVE,
    CompanyStatus.SUSPENDED,
    CompanyStatus.ARCHIVED,
  ],
  [CompanyStatus.ACTIVE]: [
    CompanyStatus.SUSPENDED,
    CompanyStatus.ARCHIVED,
  ],
  [CompanyStatus.SUSPENDED]: [
    CompanyStatus.ACTIVE,
    CompanyStatus.ARCHIVED,
  ],
  [CompanyStatus.ARCHIVED]: [],
};

/**
 * Ensures the status change is allowed, not a no-op, and not from ARCHIVED.
 * @throws BadRequestException when invalid or redundant.
 */
export function assertValidCompanyStatusTransition(
  from: CompanyStatus,
  to: CompanyStatus,
): void {
  if (from === to) {
    throw new BadRequestException(
      `Company is already in status ${from}`,
    );
  }

  if (from === CompanyStatus.ARCHIVED) {
    throw new BadRequestException(
      'Archived companies cannot change status',
    );
  }

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Cannot transition company status from ${from} to ${to}`,
    );
  }
}

/**
 * Maps a validated transition to the most specific audit action.
 */
export function auditActionForCompanyStatusTransition(
  from: CompanyStatus,
  to: CompanyStatus,
): AuditAction {
  if (to === CompanyStatus.SUSPENDED) {
    return AuditAction.COMPANY_SUSPENDED;
  }
  if (to === CompanyStatus.ARCHIVED) {
    return AuditAction.COMPANY_ARCHIVED;
  }
  if (to === CompanyStatus.PENDING_REVIEW) {
    return AuditAction.COMPANY_MARKED_PENDING_REVIEW;
  }
  if (
    from === CompanyStatus.SUSPENDED &&
    to === CompanyStatus.ACTIVE
  ) {
    return AuditAction.COMPANY_REACTIVATED;
  }
  return AuditAction.COMPANY_STATUS_UPDATED;
}
