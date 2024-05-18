import fs from 'fs'
import { Icon } from '../types';

type CachedObject = {
  key: string;
  value: Icon[]
  expiration: number;
}

type Cache = {
  [key: string]: CachedObject;
}

class CacheManager {
  private cache: Cache = {};

  public get(key: string): Icon[] | undefined {
    const cachedObject = this.cache[key];
    return cachedObject?.value;
  }

  public set(key: string, value: Icon[], expiration: number): void {
    this.cache[key] = {
      key,
      value,
      expiration
    };

    if (Object.keys(this.cache).length % 25 == 0) this.saveCache();
  }

  public loadCache(): void {
    try {
      const cacheRaw = fs.readFileSync('cache.json', 'utf-8');
      let cache = JSON.parse(cacheRaw);

      // Cache is still an array, convert to object
      if (cache.length)  {
        cache = cache.reduce((acc, cur) => {
          acc[cur.key] = cur;
          return acc;
        }, {});
      }

      this.cache = cache;
      console.log(`Cache loaded with ${Object.keys(this.cache).length} entries`);
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

  public getCache(): Cache {
    return this.cache;
  }

  public clearCache(): void {
    this.cache = {};
  }
}

const cacheManager = new CacheManager();
cacheManager.loadCache();

export default cacheManager;