import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareCertificate } from './entities/share-certificate.entity';
import { ShareCertificatesController } from './share-certificates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShareCertificate])],
  controllers: [ShareCertificatesController],
  exports: [TypeOrmModule],
})
export class ShareCertificatesModule {}
