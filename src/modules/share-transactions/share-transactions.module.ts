import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyUsersModule } from '../company-users/company-users.module';
import { Shareholder } from '../shareholders/entities/shareholder.entity';
import { ShareTransaction } from './entities/share-transaction.entity';
import { ShareTransactionsService } from './share-transactions.service';
import { ShareTransactionsController } from './share-transactions.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([ShareTransaction, Shareholder]),
		CompanyUsersModule,
	],
	exports: [TypeOrmModule],
	providers: [ShareTransactionsService],
	controllers: [ShareTransactionsController],
})
export class ShareTransactionsModule {}
