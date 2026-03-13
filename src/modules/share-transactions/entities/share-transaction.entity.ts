import { Company } from "src/modules/companies/entities/company.entity";
import { Shareholder } from "src/modules/shareholders/entities/shareholder.entity";
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

    @Index()
    @ManyToOne(() => Company)
    @JoinColumn({ name: "companyId" })
    company: Company;

    @Index()
    @ManyToOne(() => Shareholder, { nullable: true })
    @JoinColumn({ name: "fromShareholderId" })
    fromShareholder?: Shareholder;

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
