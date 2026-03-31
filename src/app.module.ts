import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ShareClassesModule } from './modules/share-classes/share-classes.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TelegramBotModule } from './modules/telegram-bot/telegram-bot.module';
import { ShareholdersModule } from './modules/shareholders/shareholders.module';
import { SharesModule } from './modules/shares/shares.module';
import { ShareTransactionsModule } from './modules/share-transactions/share-transactions.module';
import { ShareCertificatesModule } from './modules/share-certificates/share-certificates.module';
import { CapTableModule } from './modules/cap-table/cap-table.module';
import { CompanyUsersModule } from './modules/company-users/company-users.module';
import { HealthModule } from './health/health.module';
import { PlatformModule } from './platform/platform.module';

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    CacheModule.register({ isGlobal: true }),

    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },
    ]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
      migrations: [__dirname + '/migrations/*.js'],
      migrationsRun: false, // Run migrations via CLI (typeorm migration:run) or set true for one-time init
    }),

    AuthModule,

    UsersModule,

    CompaniesModule,

    ShareClassesModule,

    CertificatesModule,

    AuditLogsModule,

    SubscriptionsModule,

    TelegramBotModule,

    ShareholdersModule,

    SharesModule,

    ShareTransactionsModule,

    ShareCertificatesModule,

    CapTableModule,

    CompanyUsersModule,

    PlatformModule,
  ],
})
export class AppModule {}