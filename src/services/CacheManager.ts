type FaviconResult = {
  src: string;
  size: {
      width: number;
      height: number;
  };
}

type CachedObject = {
  key: string;
  value: FaviconResult[]
  expiration: number;
}

class CacheManager {
  private cache: CachedObject[] = [];

  public get(key: string): any {
    const cachedObject = this.cache.find((obj) => obj.key === key);

    if (!cachedObject || cachedObject.expiration < Date.now()) {
      this.cache = this.cache.filter((obj) => obj.key !== key);
      return null;
    }

    return cachedObject.value;
  }

  public set(key: string, value: any, expiration: number): void {
    this.cache.push({ key, value, expiration });
  }
}

const cacheManager = new CacheManager();

export default cacheManager;