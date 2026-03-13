import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareTransaction } from './entities/share-transaction.entity';
import { ShareTransactionsService } from './share-transactions.service';
import { ShareTransactionsController } from './share-transactions.controller';

@Module({
	imports: [TypeOrmModule.forFeature([ShareTransaction])],
	exports: [TypeOrmModule],
	providers: [ShareTransactionsService],
	controllers: [ShareTransactionsController],
})
export class ShareTransactionsModule {}
