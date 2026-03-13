import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { getCapTableCacheKey } from './cap-table-cache.constants';

/**
 * Invalidates cap-table cache for a company. Call after successful share
 * issue or transfer so the next GET returns fresh data.
 */
@Injectable()
export class CapTableCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async invalidateCapTable(companyId: string): Promise<void> {
    const key = getCapTableCacheKey(companyId);
    await this.cache.del(key);
  }
}
