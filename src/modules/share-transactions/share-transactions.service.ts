import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShareTransaction } from './entities/share-transaction.entity';
import { Repository } from 'typeorm';
import { Shareholder } from '../shareholders/entities/shareholder.entity';

@Injectable()
export class ShareTransactionsService {

    constructor(
        @InjectRepository(ShareTransaction)
        private readonly repo: Repository<ShareTransaction>,
        @InjectRepository(Shareholder)
        private readonly shareholdersRepo: Repository<Shareholder>,
    ) {}

    async getShareholderBalance(companyId: string, shareholderId: string) {

        const shareholder = await this.shareholdersRepo.findOne({
            where: {
                id: shareholderId,
                company: { id: companyId },
            },
        });

        if (!shareholder) {
            throw new NotFoundException('Shareholder not found');
        }

        const received = await this.repo
            .createQueryBuilder('tx')
            .select('SUM(tx.shares)', 'sum')
            .where('tx.companyId = :companyId', { companyId })
            .andWhere('tx.toShareholderId = :shareholderId', {
                shareholderId,
            })
            .getRawOne();

        const sent = await this.repo
            .createQueryBuilder('tx')
            .select('SUM(tx.shares)', 'sum')
            .where('tx.companyId = :companyId', { companyId })
            .andWhere('tx.fromShareholderId = :shareholderId', {
                shareholderId,
            })
            .getRawOne();

        const receivedShares = parseInt(received?.sum, 10) || 0;
        const sentShares = parseInt(sent?.sum, 10) || 0;

        return receivedShares - sentShares;
    }
}
