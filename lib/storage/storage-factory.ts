import 'server-only';
import type { StorageProvider } from './storage-interface';

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;
  const provider = process.env.STORAGE_PROVIDER ?? 'local';
  if (provider === 'vercel-kv') {
    const { VercelKVProvider } = require('./vercel-kv-provider');
    instance = new VercelKVProvider();
  } else {
    const { LocalStorageProvider } = require('./local-storage-provider');
    instance = new LocalStorageProvider();
  }
  return instance!;
}
