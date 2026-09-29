export class PageCache<Value> {
  private values = new Map<string, Value>();
  private pending = new Map<string, Promise<Value>>();
  private version = 0;

  get(key: string) {
    return this.values.get(key);
  }

  load(key: string, loader: () => Promise<Value>) {
    const cached = this.values.get(key);
    if (cached !== undefined) return Promise.resolve(cached);

    const pendingRequest = this.pending.get(key);
    if (pendingRequest) return pendingRequest;

    const requestVersion = this.version;
    const request = loader()
      .then((value) => {
        if (requestVersion === this.version) this.values.set(key, value);
        return value;
      })
      .finally(() => {
        if (this.pending.get(key) === request) this.pending.delete(key);
      });

    this.pending.set(key, request);
    return request;
  }

  clear() {
    this.version += 1;
    this.values.clear();
    this.pending.clear();
  }
}

export function createPageCacheKey(options: { page: number; pageSize: number; search: string; type: string }) {
  return JSON.stringify([
    options.search.trim().toLowerCase(),
    options.type,
    options.pageSize,
    options.page,
  ]);
}
