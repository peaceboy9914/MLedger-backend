import { Company } from "src/modules/companies/entities/company.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('shareholders')
export class Shareholder {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    fullName: string;

    @Column({ unique: true, nullable: true })
    email?: string;

    @Column({ unique: true, nullable: true })
    nationalId?: string;

    @Column({ nullable: true})
    address?: string;

    @Column({ default: true})
    isActive: boolean;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}