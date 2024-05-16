import fs from 'fs'

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

    if (!cachedObject || cachedObject.expiration < Date.now() || !cachedObject.value.length) {
      this.cache = this.cache.filter((obj) => obj.key !== key);
      return null;
    }

    return cachedObject.value;
  }

  public set(key: string, value: any, expiration: number): void {
    this.cache.push({ key, value, expiration });
    if(this.cache.length % 25 == 0) this.saveCache();
  }

  public loadCache(): void {
    try {
      const cache = fs.readFileSync('cache.json', 'utf-8');
      this.cache = JSON.parse(cache);
      console.log(`Cache loaded with ${this.cache.length} entries`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No cache found, creating cache file');
        this.saveCache();
        return;
      }
      console.error('Error loading cache:', error);
    }
  }

  public saveCache(): void {
    fs.writeFileSync('cache.json', JSON.stringify(this.cache, null, 2));
  }

  public getCache(): CachedObject[] {
    return this.cache;
  }

  public clearCache(): void {
    this.cache = [];
  }
}

const cacheManager = new CacheManager();
cacheManager.loadCache();

export default cacheManager;