import { TenantContext } from '../common/interfaces/tenant-context.interface';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

