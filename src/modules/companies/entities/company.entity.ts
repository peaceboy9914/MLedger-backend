import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { ShareClass } from 'src/modules/share-classes/entities/share-class.entity';
import { CompanyUser } from '../../company-users/entities/company-user.entity';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('companies')
export class Company extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  registrationNumber: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  authorizedCapital: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  issuedCapital: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  paidUpCapital: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 1 })
  parValue: number;

  @Column({ nullable: true })
  companyCode: string;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE,
  })
  status: CompanyStatus;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => ShareClass, (shareClass) => shareClass.company)
  shareClasses: ShareClass[];

  @OneToMany(() => CompanyUser, (companyUser) => companyUser.company)
  companyUsers: CompanyUser[];
}