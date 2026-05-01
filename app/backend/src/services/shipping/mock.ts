/**
 * Mock Shipping Provider
 * ======================
 * Henüz API entegrasyonu yapılmamış kargo firmaları için mock implementasyon.
 * Gerçek API'ler entegre edildiğinde bu dosya değiştirilecek.
 * 
 * Desteklenen firmalar: aras, mng, ptt, surat, hepsijet, trendyol
 */

import type {
  ShippingProvider,
  CreateShipmentParams,
  CreateShipmentResult,
  TrackingResult,
  TrackingEvent,
  CancelResult,
  BarcodeResult,
  ConnectionTestResult,
} from './provider';

export class MockShippingProvider implements ShippingProvider {
  readonly name: string;
  readonly code: string;

  constructor(name: string, code: string) {
    this.name = name;
    this.code = code;
  }

  async createShipment(params: CreateShipmentParams): Promise<CreateShipmentResult> {
    console.log(`[MOCK ${this.code}] Kargo oluşturma:`, params.cargoKey);

    const prefix = this.code.substring(0, 2).toUpperCase();
    const trackingNumber = `${prefix}${Date.now().toString().slice(-10)}`;

    // Gerçekçi gecikme
    await delay(500 + Math.random() * 1000);

    return {
      success: true,
      trackingNumber,
      jobId: `JOB-${this.code.toUpperCase()}-${Date.now()}`,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    console.log(`[MOCK ${this.code}] Takip sorgusu:`, trackingNumber);

    await delay(300 + Math.random() * 700);

    const statuses = ['Kargo İşleme Alındı', 'Kargo Yola Çıktı', 'Transfer Merkezinde', 'Dağıtıma Çıktı', 'Teslim Edildi'];
    const locations = ['Gönderici Şubesi', 'Transfer Merkezi', 'Alıcı Şubesi', 'Dağıtım Rotası', 'Teslim Noktası'];

    const details: TrackingEvent[] = statuses.slice(0, 3 + Math.floor(Math.random() * 3)).map((op, i) => ({
      operation: op,
      location: locations[i] || locations[locations.length - 1],
      date: new Date(Date.now() - (statuses.length - i) * 3600000 * 4).toISOString(),
      statusCode: `ST${i}`,
    }));

    return {
      success: true,
      status: details[details.length - 1]?.operation || 'Kargo İşleme Alındı',
      location: details[details.length - 1]?.location || 'İstanbul',
      date: new Date().toISOString(),
      details,
    };
  }

  async cancelShipment(trackingNumber: string): Promise<CancelResult> {
    console.log(`[MOCK ${this.code}] İptal:`, trackingNumber);
    await delay(400 + Math.random() * 600);

    return {
      success: true,
      message: `${this.name} kargosu iptal edildi`,
    };
  }

  async createBarcode(trackingNumbers: string[]): Promise<BarcodeResult> {
    console.log(`[MOCK ${this.code}] Barkod oluşturma:`, trackingNumbers.length, 'adet');
    await delay(300);

    return {
      success: true,
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBS...',
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    await delay(500);

    return {
      success: true,
      message: `${this.name} - Test modu aktif (Gerçek API entegrasyonu bekleniyor)`,
      mode: 'mock',
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default MockShippingProvider;
