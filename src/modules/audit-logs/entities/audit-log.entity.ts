import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { CompanyUser } from '../../company-users/entities/company-user.entity';
import { User } from '../../users/entities/user.entity';

export type AuditMetadataPrimitive = string | number | boolean | null;
export type AuditMetadata =
  | AuditMetadataPrimitive
  | { [key: string]: AuditMetadata }
  | AuditMetadata[];

export enum AuditEntityType {
  SHAREHOLDER = 'shareholder',
  SHARE_TRANSACTION = 'share_transaction',
  COMPANY_USER = 'company_user',
}

export enum AuditAction {
  SHAREHOLDER_CREATED = 'SHAREHOLDER_CREATED',
  SHAREHOLDER_UPDATED = 'SHAREHOLDER_UPDATED',
  SHARE_ISSUED = 'SHARE_ISSUED',
  SHARE_TRANSFERRED = 'SHARE_TRANSFERRED',
  MEMBER_ADDED = 'MEMBER_ADDED',
}

@Entity('audit_logs')
@Index(['companyId', 'createdAt'])
@Index(['companyId', 'action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;
  @Index()
  @Column()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: true })
  actorUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorUserId' })
  actorUser?: User | null;

  @Column({ nullable: true })
  actorMembershipId: string | null;

  @ManyToOne(() => CompanyUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorMembershipId' })
  actorMembership?: CompanyUser | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  entityType: AuditEntityType | string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: AuditMetadata | null;
}

