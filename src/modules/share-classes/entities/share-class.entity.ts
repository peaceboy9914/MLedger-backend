import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity('share_classes')
export class ShareClass extends BaseEntity {
	@ManyToOne(() => Company, (company) => company.shareClasses, {
		onDelete: 'CASCADE',
	})
	company: Company;
}