export enum PlatformCompanyEventType {
  COMPANY_ONBOARDED = 'COMPANY_ONBOARDED',
  COMPANY_STATUS_CHANGED = 'COMPANY_STATUS_CHANGED',
}

export class PlatformCompanyEventDto {
  type: PlatformCompanyEventType;
  companyId: string;
  companyName: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class PlatformRecentCompanyEventsResponseDto {
  items: PlatformCompanyEventDto[];
}

