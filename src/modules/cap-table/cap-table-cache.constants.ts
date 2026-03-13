/** Cache key for cap-table by company. Used by CapTableCacheInterceptor and invalidation. */
export function getCapTableCacheKey(companyId: string): string {
  return `cap-table:${companyId}`;
}
