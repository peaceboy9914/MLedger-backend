import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Company } from '../../companies/entities/company.entity';
import { CompanyUser } from '../../company-users/entities/company-user.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  FINANCE = 'FINANCE',
  AUDITOR = 'AUDITOR',
  SHAREHOLDER = 'SHAREHOLDER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
export class User extends BaseEntity {
  @Column()
  fullName: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  /** Not selected by default; use findByEmailForAuth or query builder addSelect when needed. */
  @Column({ select: false })
  passwordHash: string;

  /**
   * Legacy / compatibility only. For tenant-aware role, use company_users.role (CompanyUser).
   * Do not use for authorization; use CompanyMembershipGuard + tenant context instead.
   */
  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  /**
   * Legacy / compatibility only. For tenant membership, use company_users (CompanyUser).
   * Do not use for authorization; use company_users membership as source of truth.
   */
  @ManyToOne(() => Company, (company) => company.users, {
    nullable: true, // Super Admin doesn't belong to a company
    onDelete: 'CASCADE',
  })
  company: Company;

  @OneToMany(() => CompanyUser, (companyUser) => companyUser.user)
  companyUsers: CompanyUser[];
}