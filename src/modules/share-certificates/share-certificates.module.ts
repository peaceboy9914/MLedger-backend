import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyUsersModule } from '../company-users/company-users.module';
import { ShareCertificate } from './entities/share-certificate.entity';
import { ShareCertificatesController } from './share-certificates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareCertificate]),
    CompanyUsersModule,
  ],
  controllers: [ShareCertificatesController],
  exports: [TypeOrmModule],
})
export class ShareCertificatesModule {}
