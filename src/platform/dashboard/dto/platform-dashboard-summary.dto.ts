export class PlatformCompaniesSummaryDto {
  total: number;
  active: number;
  suspended: number;
  pendingReview: number;
  archived: number;
}

export class PlatformUsersSummaryDto {
  total: number;
  superAdmins: number;
}

export class PlatformActivitySummaryDto {
  onboardedLast30Days: number;
  statusChangesLast30Days: number;
}

export class PlatformDashboardSummaryDto {
  companies: PlatformCompaniesSummaryDto;
  users: PlatformUsersSummaryDto;
  activity: PlatformActivitySummaryDto;
}

