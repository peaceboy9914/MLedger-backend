import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';

export enum CompanyUserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  LEGAL = 'LEGAL',
  FINANCE = 'FINANCE',
  VIEWER = 'VIEWER',
}

export enum CompanyUserStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('company_users')
@Index(['companyId', 'userId'], { unique: true })
@Index(['userId'])
@Index(['companyId', 'status'])
@Index(['companyId', 'role'])
export class CompanyUser extends BaseEntity {
  @Column()
  companyId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: CompanyUserRole,
  })
  role: CompanyUserRole;

  @Column({
    type: 'enum',
    enum: CompanyUserStatus,
  })
  status: CompanyUserStatus;

  @Column({ nullable: true })
  invitedByUserId?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt?: Date | null;

  @ManyToOne(() => Company, (company) => company.companyUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => User, (user) => user.companyUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedByUser?: User | null;
}

