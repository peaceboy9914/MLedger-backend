import {
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { getCapTableCacheKey } from './cap-table-cache.constants';

/**
 * Cache interceptor that uses a deterministic key by companyId so cap-table
 * responses can be invalidated after share issue/transfer.
 */
@Injectable()
export class CapTableCacheInterceptor extends CacheInterceptor {
  protected trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const companyId = request.tenant?.companyId ?? request.params?.companyId;
    if (!companyId) return undefined;
    return getCapTableCacheKey(companyId);
  }
}
