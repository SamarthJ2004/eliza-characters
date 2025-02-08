export class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    return this.cache.get(key);
  }

  async set(key, value) {
    this.cache.set(key, value);
    return true;
  }

  async delete(key) {
    return this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
    return true;
  }
}