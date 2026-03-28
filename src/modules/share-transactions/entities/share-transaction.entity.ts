import { Company } from '../../companies/entities/company.entity';
import { Shareholder } from '../../shareholders/entities/shareholder.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum TransactionType {
    ISSUE = "ISSUE",
    TRANSFER = "TRANSFER",
    BUYBACK = "BUYBACK",
}

@Entity("share_transactions")
@Index(["companyId", "type"])
@Index(["companyId", "toShareholderId"])
@Index(["companyId", "fromShareholderId"])
export class ShareTransaction {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "enum", enum: TransactionType })
    type: TransactionType;

    @Column({ type: "uuid" })
    companyId: string;

    @Index()
    @ManyToOne(() => Company, { nullable: false })
    @JoinColumn({ name: "companyId" })
    company: Company;

    @Column({ type: "uuid", nullable: true })
    fromShareholderId?: string;

    @Index()
    @ManyToOne(() => Shareholder, { nullable: true })
    @JoinColumn({ name: "fromShareholderId" })
    fromShareholder?: Shareholder;

    @Column({ type: "uuid", nullable: true })
    toShareholderId?: string;

    @Index()
    @ManyToOne(() => Shareholder, { nullable: true })
    @JoinColumn({ name: "toShareholderId" })
    toShareholder?: Shareholder;

    @Column()
    shares: number;

    @Column({ nullable: true })
    note: string;

    @CreateDateColumn()
    createdAt: Date;
}
