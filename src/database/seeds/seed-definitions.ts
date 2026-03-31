import { CompanyStatus } from '../../modules/companies/entities/company.entity';
import { CompanyUserRole } from '../../modules/company-users/entities/company-user.entity';

/** Fixed registration numbers for idempotent re-runs */
export const SEED_REGISTRATION = {
  ACTIVE: 'REG-MDL-SEED-ACTIVE',
  PENDING_REVIEW: 'REG-MDL-SEED-PENDING',
  SUSPENDED: 'REG-MDL-SEED-SUSPENDED',
  ARCHIVED: 'REG-MDL-SEED-ARCHIVED',
} as const;

export const SEED_SUPER_ADMIN = {
  fullName: 'Platform Super Admin',
  email: 'mahdinurazaman@mledger.com',
  password: 'mamunusaka',
} as const;

/** Shared dev password for seeded tenant users (not printed in logs). */
export const SEED_TENANT_USER_PASSWORD = 'SeedTenant123!';

export interface SeedCompanyDefinition {
  name: string;
  companyCode?: string;
  registrationNumber: string;
  authorizedCapital: number;
  status: CompanyStatus;
  suspensionReason?: string;
  owner: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  };
}

export const SEED_COMPANIES: SeedCompanyDefinition[] = [
  {
    name: 'Aurora Capital Partners (Demo Active)',
    companyCode: 'AURORA',
    registrationNumber: SEED_REGISTRATION.ACTIVE,
    authorizedCapital: 5_000_000,
    status: CompanyStatus.ACTIVE,
    owner: {
      fullName: 'Alex Rivera',
      email: 'owner.active@mdl-seed.local',
      password: SEED_TENANT_USER_PASSWORD,
      phone: '+1-555-0100',
    },
  },
  {
    name: 'Beacon Compliance Ltd (Pending Review)',
    companyCode: 'BEACON',
    registrationNumber: SEED_REGISTRATION.PENDING_REVIEW,
    authorizedCapital: 2_500_000,
    status: CompanyStatus.PENDING_REVIEW,
    owner: {
      fullName: 'Sam Okonkwo',
      email: 'owner.pending@mdl-seed.local',
      password: SEED_TENANT_USER_PASSWORD,
    },
  },
  {
    name: 'Cedar Ridge Manufacturing (Suspended)',
    companyCode: 'CEDAR',
    registrationNumber: SEED_REGISTRATION.SUSPENDED,
    authorizedCapital: 8_000_000,
    status: CompanyStatus.SUSPENDED,
    suspensionReason: 'Seeded suspension for platform QA',
    owner: {
      fullName: 'Jordan Kim',
      email: 'owner.suspended@mdl-seed.local',
      password: SEED_TENANT_USER_PASSWORD,
    },
  },
  {
    name: 'Delta Ledger Archive (Archived)',
    companyCode: 'DELTA',
    registrationNumber: SEED_REGISTRATION.ARCHIVED,
    authorizedCapital: 1_000_000,
    status: CompanyStatus.ARCHIVED,
    owner: {
      fullName: 'Morgan Patel',
      email: 'owner.archived@mdl-seed.local',
      password: SEED_TENANT_USER_PASSWORD,
    },
  },
];

export interface SeedExtraMemberDefinition {
  fullName: string;
  email: string;
  password: string;
  role: CompanyUserRole;
}

/** Attached to the ACTIVE seeded company only */
export const SEED_EXTRA_MEMBERS: SeedExtraMemberDefinition[] = [
  {
    fullName: 'Riley Chen',
    email: 'tenant.admin@mdl-seed.local',
    password: SEED_TENANT_USER_PASSWORD,
    role: CompanyUserRole.ADMIN,
  },
  {
    fullName: 'Taylor Brooks',
    email: 'tenant.finance@mdl-seed.local',
    password: SEED_TENANT_USER_PASSWORD,
    role: CompanyUserRole.FINANCE,
  },
  {
    fullName: 'Casey Nguyen',
    email: 'tenant.legal@mdl-seed.local',
    password: SEED_TENANT_USER_PASSWORD,
    role: CompanyUserRole.LEGAL,
  },
  {
    fullName: 'Jamie Foster',
    email: 'tenant.viewer@mdl-seed.local',
    password: SEED_TENANT_USER_PASSWORD,
    role: CompanyUserRole.VIEWER,
  },
];
