/**
 * Shipping Provider Interface
 * ===========================
 * Tüm kargo firmaları için soyutlama katmanı.
 * Yeni firma eklemek: bu interface'i implemente et, factory'ye kaydet.
 */

export interface CreateShipmentParams {
  cargoKey: string;
  invoiceNumber?: string;
  receiverName: string;
  receiverAddress: string;
  receiverCity: string;
  receiverDistrict: string;
  receiverPhone: string;
  receiverEmail?: string;
  weight?: number;
  description?: string;
  cargoType?: 'STANDARD' | 'VALUABLE';
  paymentType?: 'PREPAID' | 'COLLECT';
  collectionPrice?: number;
}

export interface CreateShipmentResult {
  success: boolean;
  trackingNumber?: string;
  jobId?: string;
  error?: string;
}

export interface TrackingResult {
  success: boolean;
  status?: string;
  location?: string;
  date?: string;
  details?: TrackingEvent[];
  error?: string;
}

export interface TrackingEvent {
  operation: string;
  location: string;
  date: string;
  statusCode?: string;
}

export interface CancelResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface BarcodeResult {
  success: boolean;
  pdfBase64?: string;
  error?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  mode?: string;
}

export interface ShippingProvider {
  readonly name: string;
  readonly code: string;

  createShipment(params: CreateShipmentParams): Promise<CreateShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingResult>;
  cancelShipment(trackingNumber: string): Promise<CancelResult>;
  createBarcode(trackingNumbers: string[]): Promise<BarcodeResult>;
  testConnection(): Promise<ConnectionTestResult>;
}
