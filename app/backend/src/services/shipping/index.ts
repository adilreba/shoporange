/**
 * Shipping Provider Factory
 * =========================
 * Kargo firması kodundan provider instance'ı üretir.
 * Yeni firma eklemek için PROVIDERS map'ine ekle.
 */

import { YurticiProvider } from './yurtici';
import { MockShippingProvider } from './mock';
import type { ShippingProvider } from './provider';

// Provider registry
const PROVIDERS: Record<string, () => ShippingProvider> = {
  yurtici: () => new YurticiProvider(),
  aras: () => new MockShippingProvider('Aras Kargo', 'aras'),
  mng: () => new MockShippingProvider('MNG Kargo', 'mng'),
  ptt: () => new MockShippingProvider('PTT Kargo', 'ptt'),
  surat: () => new MockShippingProvider('Sürat Kargo', 'surat'),
  hepsijet: () => new MockShippingProvider('HepsiJet', 'hepsijet'),
  trendyol: () => new MockShippingProvider('Trendyol Express', 'trendyol'),
};

export type ShippingProviderCode =
  | 'yurtici'
  | 'aras'
  | 'mng'
  | 'ptt'
  | 'surat'
  | 'hepsijet'
  | 'trendyol';

export const SUPPORTED_PROVIDERS: ShippingProviderCode[] = [
  'yurtici',
  'aras',
  'mng',
  'ptt',
  'surat',
  'hepsijet',
  'trendyol',
];

export function getProvider(code: string): ShippingProvider {
  const factory = PROVIDERS[code];
  if (!factory) {
    throw new Error(`Desteklenmeyen kargo firması: ${code}`);
  }
  return factory();
}

export function isSupportedProvider(code: string): boolean {
  return code in PROVIDERS;
}

export function listProviders(): Array<{ code: string; name: string }> {
  return Object.entries(PROVIDERS).map(([code, factory]) => {
    const instance = factory();
    return { code, name: instance.name };
  });
}

export { YurticiProvider, MockShippingProvider };
export type { ShippingProvider };
