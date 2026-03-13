import { Company } from "src/modules/companies/entities/company.entity";
import { Shareholder } from "src/modules/shareholders/entities/shareholder.entity";
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("share_certificates")
@Index(["companyId", "issuedAt"])
@Index(["companyId", "shareholderId"])
export class ShareCertificate {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    certificateNumber: string;

    @Column()
    companyId: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column()
    shareholderId: string;

    @ManyToOne(() => Shareholder)
    shareholder: Shareholder;

    @Column()
    sharesIssued: number;

    @CreateDateColumn()
    issuedAt: Date;
}