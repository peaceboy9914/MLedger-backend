import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareClass } from './entities/share-class.entity';

@Module({
	imports: [TypeOrmModule.forFeature([ShareClass])],
})
export class ShareClassesModule {}
