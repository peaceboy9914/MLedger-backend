import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Company, CompanyStatus } from '../entities/company.entity';
import type { TenantContext } from '../../../common/interfaces/tenant-context.interface';

@Injectable()
export class CompanyActiveGuard implements CanActivate {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const rawParam = request.params?.companyId;
    let companyId =
      typeof rawParam === 'string'
        ? rawParam
        : Array.isArray(rawParam)
          ? rawParam[0]
          : undefined;

    if (!companyId) {
      companyId = (request.tenant as TenantContext | undefined)?.companyId;
    }

    if (!companyId) {
      throw new ForbiddenException('Company context is required');
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      select: ['id', 'status'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== CompanyStatus.ACTIVE) {
      throw new ForbiddenException(this.messageForStatus(company.status));
    }

    return true;
  }

  private messageForStatus(status: CompanyStatus): string {
    switch (status) {
      case CompanyStatus.PENDING_REVIEW:
        return 'Company is pending review and cannot perform this action';
      case CompanyStatus.SUSPENDED:
        return 'Company is suspended and cannot perform this action';
      case CompanyStatus.ARCHIVED:
        return 'Company is archived and cannot perform this action';
      default:
        return 'Company cannot perform this action';
    }
  }
}
