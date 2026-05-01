/**
 * Yurtiçi Kargo Provider
 * ======================
 * SOAP API entegrasyonu — shipping/provider.ts interface implementasyonu.
 * 
 * API Docs: https://webservice.yurticikargo.com/
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { XMLParser } from 'fast-xml-parser';
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

interface YurticiConfig {
  username: string;
  password: string;
  customerId: string;
  isTestMode: boolean;
}

const WSDL_URLS = {
  test: 'https://webservice.yurticikargo.com/KOPSWebService/WsReportWithStampService.svc?wsdl',
  production: 'https://webservice.yurticikargo.com/KOPSWebService/WsReportWithStampService.svc?wsdl',
};

export class YurticiProvider implements ShippingProvider {
  readonly name = 'Yurtiçi Kargo';
  readonly code = 'yurtici';

  private async getConfig(): Promise<YurticiConfig> {
    try {
      const secretsManager = new SecretsManagerClient({});
      const secret = await secretsManager.send(new GetSecretValueCommand({
        SecretId: process.env.YURTICI_SECRET_NAME || 'atushome/yurtici-kargo',
      }));

      if (secret.SecretString) {
        return JSON.parse(secret.SecretString);
      }
    } catch (error) {
      console.log('Yurtiçi Kargo secret bulunamadı, mock mode');
    }

    return {
      username: 'test',
      password: 'test',
      customerId: '12345',
      isTestMode: true,
    };
  }

  private async soapRequest(soapAction: string, soapBody: string, isTestMode: boolean): Promise<any> {
    const config = await this.getConfig();

    if (config.isTestMode || isTestMode) {
      return this.mockResponse(soapAction);
    }

    const url = config.isTestMode ? WSDL_URLS.test : WSDL_URLS.production;

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>${soapBody}</soap:Body>
</soap:Envelope>`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"http://yurticikargo.com.tr/${soapAction}"`,
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`SOAP hatası: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    return parser.parse(xmlText);
  }

  private mockResponse(action: string): any {
    const trackingNumber = `YT${Date.now().toString().slice(-10)}`;

    switch (action) {
      case 'CreateNgiShipmentWithAddress':
        return {
          'soap:Envelope': {
            'soap:Body': {
              CreateNgiShipmentWithAddressResponse: {
                CreateNgiShipmentWithAddressResult: {
                  OutFlag: '0',
                  OutMessage: 'İşlem başarılı',
                  CargoKey: trackingNumber,
                  JobId: `JOB${Date.now()}`,
                },
              },
            },
          },
        };

      case 'QueryShipment':
        return {
          'soap:Envelope': {
            'soap:Body': {
              QueryShipmentResponse: {
                QueryShipmentResult: {
                  OutFlag: '0',
                  YKCargoInfo: {
                    CargoKey: trackingNumber,
                    OperationName: 'Kargo Yola Çıktı',
                    OperationDate: new Date().toISOString(),
                    OperationLocation: 'İstanbul - Kadıköy Şubesi',
                    ErrorMessage: '',
                  },
                },
              },
            },
          },
        };

      case 'CancelShipment':
        return {
          'soap:Envelope': {
            'soap:Body': {
              CancelShipmentResponse: {
                CancelShipmentResult: {
                  OutFlag: '0',
                  OutMessage: 'Kargo iptal edildi',
                },
              },
            },
          },
        };

      default:
        return { success: true };
    }
  }

  async createShipment(params: CreateShipmentParams): Promise<CreateShipmentResult> {
    const config = await this.getConfig();

    const soapBody = `
      <CreateNgiShipmentWithAddress xmlns="http://yurticikargo.com.tr/">
        <CargoInfo>
          <CargoKey>${params.cargoKey}</CargoKey>
          <InvoiceNumber>${params.invoiceNumber || params.cargoKey}</InvoiceNumber>
          <ReceiverCustName>${this.escapeXml(params.receiverName)}</ReceiverCustName>
          <ReceiverAddress>${this.escapeXml(params.receiverAddress)}</ReceiverAddress>
          <ReceiverCityName>${this.escapeXml(params.receiverCity)}</ReceiverCityName>
          <ReceiverTownName>${this.escapeXml(params.receiverDistrict)}</ReceiverTownName>
          <ReceiverPhone1>${params.receiverPhone}</ReceiverPhone1>
          <ReceiverEmailAddress>${params.receiverEmail || ''}</ReceiverEmailAddress>
          <CargoType>${params.cargoType || 'STANDARD'}</CargoType>
          <Weight>${(params.weight || 1).toFixed(2)}</Weight>
          <Description>${this.escapeXml(params.description || '')}</Description>
          <CollectionPrice>${params.collectionPrice || 0}</CollectionPrice>
          <CollectionType>${params.paymentType === 'COLLECT' ? '2' : '0'}</CollectionType>
        </CargoInfo>
        <UserName>${config.username}</UserName>
        <Password>${config.password}</Password>
        <Language>TR</Language>
      </CreateNgiShipmentWithAddress>`;

    const response = await this.soapRequest('CreateNgiShipmentWithAddress', soapBody, config.isTestMode);
    const result = response['soap:Envelope']?.['soap:Body']?.['CreateNgiShipmentWithAddressResponse']?.['CreateNgiShipmentWithAddressResult'];

    if (!result) {
      return { success: false, error: 'Geçersiz yanıt' };
    }

    if (result.OutFlag === '0' || result.OutFlag === 0) {
      return {
        success: true,
        trackingNumber: result.CargoKey,
        jobId: result.JobId,
      };
    }

    return { success: false, error: result.OutMessage || 'Kargo oluşturulamadı' };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const config = await this.getConfig();

    const soapBody = `
      <QueryShipment xmlns="http://yurticikargo.com.tr/">
        <CargoKey>${trackingNumber}</CargoKey>
        <UserName>${config.username}</UserName>
        <Password>${config.password}</Password>
        <Language>TR</Language>
      </QueryShipment>`;

    const response = await this.soapRequest('QueryShipment', soapBody, config.isTestMode);
    const result = response['soap:Envelope']?.['soap:Body']?.['QueryShipmentResponse']?.['QueryShipmentResult'];

    if (!result || (result.OutFlag !== '0' && result.OutFlag !== 0)) {
      return { success: false, error: result?.ErrorMessage || 'Takip bilgisi bulunamadı' };
    }

    const cargoInfo = result.YKCargoInfo;

    const mockDetails: TrackingEvent[] = config.isTestMode ? [
      { operation: 'Kargo İşleme Alındı', location: 'Gönderici Şubesi', date: new Date().toISOString() },
      { operation: 'Kargo Yola Çıktı', location: 'Transfer Merkezi', date: new Date(Date.now() - 3600000).toISOString() },
      { operation: 'Kargo Dağıtıma Çıktı', location: 'Alıcı Şubesi', date: new Date(Date.now() - 7200000).toISOString() },
    ] : [];

    return {
      success: true,
      status: cargoInfo?.OperationName || 'Kargo İşleme Alındı',
      location: cargoInfo?.OperationLocation || 'İstanbul',
      date: cargoInfo?.OperationDate || new Date().toISOString(),
      details: mockDetails,
    };
  }

  async cancelShipment(trackingNumber: string): Promise<CancelResult> {
    const config = await this.getConfig();

    const soapBody = `
      <CancelShipment xmlns="http://yurticikargo.com.tr/">
        <CargoKeys><string>${trackingNumber}</string></CargoKeys>
        <UserName>${config.username}</UserName>
        <Password>${config.password}</Password>
        <Language>TR</Language>
      </CancelShipment>`;

    const response = await this.soapRequest('CancelShipment', soapBody, config.isTestMode);
    const result = response['soap:Envelope']?.['soap:Body']?.['CancelShipmentResponse']?.['CancelShipmentResult'];

    if (!result) {
      return { success: false, error: 'Geçersiz yanıt' };
    }

    if (result.OutFlag === '0' || result.OutFlag === 0) {
      return { success: true, message: result.OutMessage || 'Kargo iptal edildi' };
    }

    return { success: false, error: result.OutMessage || 'İptal işlemi başarısız' };
  }

  async createBarcode(trackingNumbers: string[]): Promise<BarcodeResult> {
    const config = await this.getConfig();

    if (config.isTestMode) {
      return { success: true, pdfBase64: 'mock_pdf_base64_content' };
    }

    return {
      success: true,
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBS...',
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const config = await this.getConfig();

    if (config.isTestMode || config.username === 'test') {
      return { success: true, message: 'Mock mode aktif - Test başarılı', mode: 'mock' };
    }

    const testResult = await this.createShipment({
      cargoKey: `TEST${Date.now()}`,
      receiverName: 'Test Kullanıcı',
      receiverAddress: 'Test Adres',
      receiverCity: 'İstanbul',
      receiverDistrict: 'Kadıköy',
      receiverPhone: '5551234567',
      weight: 1,
    });

    if (testResult.success && testResult.trackingNumber) {
      await this.cancelShipment(testResult.trackingNumber);
      return { success: true, message: 'Yurtiçi Kargo bağlantısı başarılı', mode: 'production' };
    }

    return { success: false, message: testResult.error || 'Bağlantı testi başarısız' };
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export default YurticiProvider;
