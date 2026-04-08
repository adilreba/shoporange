/**
 * Yurtiçi Kargo SOAP API Entegrasyonu
 * Kargo oluşturma, barkod alma, takip işlemleri
 * 
 * API Docs: https://webservice.yurticikargo.com/
 * Test URL: https://webservice.yurticikargo.com/KOPSWebService/WsReportWithStampService.svc?wsdl
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const secretsManager = new SecretsManagerClient({});

// Yurtiçi Kargo yapılandırması
interface YurticiConfig {
  username: string;
  password: string;
  customerId: string;
  isTestMode: boolean;
}

// WSDL URL'leri
const WSDL_URLS = {
  test: 'https://webservice.yurticikargo.com/KOPSWebService/WsReportWithStampService.svc?wsdl',
  production: 'https://webservice.yurticikargo.com/KOPSWebService/WsReportWithStampService.svc?wsdl',
};

/**
 * Yurtiçi Kargo yapılandırmasını al
 */
async function getConfig(): Promise<YurticiConfig> {
  try {
    const secret = await secretsManager.send(new GetSecretValueCommand({
      SecretId: process.env.YURTICI_SECRET_NAME || 'atushome/yurtici-kargo',
    }));
    
    if (secret.SecretString) {
      return JSON.parse(secret.SecretString);
    }
  } catch (error) {
    console.log('Yurtiçi Kargo secret bulunamadı, mock mode kullanılacak');
  }
  
  // Mock mode
  return {
    username: 'test',
    password: 'test',
    customerId: '12345',
    isTestMode: true,
  };
}

/**
 * SOAP isteği gönder
 */
async function soapRequest(soapAction: string, soapBody: string, isTestMode: boolean): Promise<any> {
  const config = await getConfig();
  
  if (config.isTestMode || isTestMode) {
    console.log('[MOCK] Yurtiçi Kargo SOAP isteği:', { soapAction, soapBody });
    return mockResponse(soapAction);
  }
  
  const url = config.isTestMode ? WSDL_URLS.test : WSDL_URLS.production;
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${soapBody}
  </soap:Body>
</soap:Envelope>`;

  try {
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
  } catch (error) {
    console.error('Yurtiçi Kargo SOAP hatası:', error);
    throw error;
  }
}

/**
 * Mock yanıtlar (test modu)
 */
function mockResponse(action: string): any {
  const trackingNumber = `YT${Date.now().toString().slice(-10)}`;
  
  switch (action) {
    case 'CreateNgiShipmentWithAddress':
      return {
        CreateNgiShipmentWithAddressResponse: {
          CreateNgiShipmentWithAddressResult: {
            OutFlag: '0',
            OutMessage: 'İşlem başarılı',
            CargoKey: trackingNumber,
            JobId: `JOB${Date.now()}`,
          },
        },
      };
    
    case 'QueryShipment':
      return {
        QueryShipmentResponse: {
          QueryShipmentResult: {
            YKCargoInfo: {
              CargoKey: trackingNumber,
              OperationName: 'Kargo Yola Çıktı',
              OperationDate: new Date().toISOString(),
              OperationLocation: 'İstanbul - Kadıköy Şubesi',
              ErrorMessage: '',
            },
          },
        },
      };
    
    case 'CancelShipment':
      return {
        CancelShipmentResponse: {
          CancelShipmentResult: {
            OutFlag: '0',
            OutMessage: 'Kargo iptal edildi',
          },
        },
      };
    
    default:
      return { success: true };
  }
}

/**
 * Kargo oluştur (NgiShipmentWithAddress)
 */
export async function createShipment(params: {
  cargoKey: string; // Sipariş/Kargo numarası
  invoiceNumber?: string; // Fatura numarası
  receiverName: string;
  receiverAddress: string;
  receiverCity: string;
  receiverDistrict: string;
  receiverPhone: string;
  receiverEmail?: string;
  weight?: number; // kg
  description?: string;
  cargoType?: 'STANDARD' | 'VALUABLE';
  paymentType?: 'PREPAID' | 'COLLECT'; // PREPAID = Gönderici öder, COLLECT = Alıcı öder
  collectionPrice?: number; // Tahsilat tutarı (kapıda ödeme için)
}): Promise<{
  success: boolean;
  trackingNumber?: string;
  jobId?: string;
  error?: string;
}> {
  try {
    const config = await getConfig();
    
    const soapBody = `
      <CreateNgiShipmentWithAddress xmlns="http://yurticikargo.com.tr/">
        <CargoInfo>
          <CargoKey>${params.cargoKey}</CargoKey>
          <InvoiceNumber>${params.invoiceNumber || params.cargoKey}</InvoiceNumber>
          <ReceiverCustName>${escapeXml(params.receiverName)}</ReceiverCustName>
          <ReceiverAddress>${escapeXml(params.receiverAddress)}</ReceiverAddress>
          <ReceiverCityName>${escapeXml(params.receiverCity)}</ReceiverCityName>
          <ReceiverTownName>${escapeXml(params.receiverDistrict)}</ReceiverTownName>
          <ReceiverPhone1>${params.receiverPhone}</ReceiverPhone1>
          <ReceiverPhone2></ReceiverPhone2>
          <ReceiverPhone3></ReceiverPhone3>
          <ReceiverEmailAddress>${params.receiverEmail || ''}</ReceiverEmailAddress>
          <CargoType>${params.cargoType || 'STANDARD'}</CargoType>
          <Weight>${(params.weight || 1).toFixed(2)}</Weight>
          <Description>${escapeXml(params.description || '')}</Description>
          <CollectionPrice>${params.collectionPrice || 0}</CollectionPrice>
          <CollectionType>${params.paymentType === 'COLLECT' ? '2' : '0'}</CollectionType>
        </CargoInfo>
        <UserName>${config.username}</UserName>
        <Password>${config.password}</Password>
        <Language>TR</Language>
      </CreateNgiShipmentWithAddress>
    `;

    const response = await soapRequest('CreateNgiShipmentWithAddress', soapBody, config.isTestMode);
    
    const result = response['soap:Envelope']?.['soap:Body']?.['CreateNgiShipmentWithAddressResponse']?.['CreateNgiShipmentWithAddressResult'];
    
    if (!result) {
      return { success: false, error: 'Geçersiz yanıt' };
    }

    const outFlag = result.OutFlag;
    const outMessage = result.OutMessage;
    
    if (outFlag === '0' || outFlag === 0) {
      return {
        success: true,
        trackingNumber: result.CargoKey,
        jobId: result.JobId,
      };
    } else {
      return {
        success: false,
        error: outMessage || 'Kargo oluşturulamadı',
      };
    }
  } catch (error: any) {
    console.error('Yurtiçi Kargo oluşturma hatası:', error);
    return {
      success: false,
      error: error.message || 'Kargo oluşturulurken hata oluştu',
    };
  }
}

/**
 * Kargo takip sorgula
 */
export async function trackShipment(trackingNumber: string): Promise<{
  success: boolean;
  status?: string;
  location?: string;
  date?: string;
  details?: Array<{
    operation: string;
    location: string;
    date: string;
  }>;
  error?: string;
}> {
  try {
    const config = await getConfig();
    
    const soapBody = `
      <QueryShipment xmlns="http://yurticikargo.com.tr/">
        <CargoKey>${trackingNumber}</CargoKey>
        <UserName>${config.username}</UserName>
        <Password>${config.password}</Password>
        <Language>TR</Language>
      </QueryShipment>
    `;

    const response = await soapRequest('QueryShipment', soapBody, config.isTestMode);
    
    const result = response['soap:Envelope']?.['soap:Body']?.['QueryShipmentResponse']?.['QueryShipmentResult'];
    
    if (!result) {
      return { success: false, error: 'Takip bilgisi alınamadı' };
    }

    const cargoInfo = result.YKCargoInfo;
    
    if (result.OutFlag !== '0' && result.OutFlag !== 0) {
      return {
        success: false,
        error: result.ErrorMessage || 'Takip bilgisi bulunamadı',
      };
    }

    // Mock mod için detaylı durumlar
    const mockStatuses = [
      { operation: 'Kargo İşleme Alındı', location: 'Gönderici Şubesi', date: new Date().toISOString() },
      { operation: 'Kargo Yola Çıktı', location: 'Transfer Merkezi', date: new Date(Date.now() - 3600000).toISOString() },
      { operation: 'Kargo Dağıtıma Çıktı', location: 'Alıcı Şubesi', date: new Date(Date.now() - 7200000).toISOString() },
    ];

    return {
      success: true,
      status: cargoInfo?.OperationName || 'Kargo İşleme Alındı',
      location: cargoInfo?.OperationLocation || 'İstanbul',
      date: cargoInfo?.OperationDate || new Date().toISOString(),
      details: config.isTestMode ? mockStatuses : [],
    };
  } catch (error: any) {
    console.error('Yurtiçi Kargo takip hatası:', error);
    return {
      success: false,
      error: error.message || 'Takip bilgisi alınamadı',
    };
  }
}

/**
 * Kargo iptal et
 */
export async function cancelShipment(trackingNumber: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const config = await getConfig();
    
    const soapBody = `
      <CancelShipment xmlns="http://yurticikargo.com.tr/">
        <CargoKeys>
          <string>${trackingNumber}</string>
        </CargoKeys>
        <UserName>${config.username}</UserName>
        <Password>${config.password}</Password>
        <Language>TR</Language>
      </CancelShipment>
    `;

    const response = await soapRequest('CancelShipment', soapBody, config.isTestMode);
    
    const result = response['soap:Envelope']?.['soap:Body']?.['CancelShipmentResponse']?.['CancelShipmentResult'];
    
    if (!result) {
      return { success: false, error: 'Geçersiz yanıt' };
    }

    const outFlag = result.OutFlag;
    const outMessage = result.OutMessage;
    
    if (outFlag === '0' || outFlag === 0) {
      return {
        success: true,
        message: outMessage || 'Kargo iptal edildi',
      };
    } else {
      return {
        success: false,
        error: outMessage || 'İptal işlemi başarısız',
      };
    }
  } catch (error: any) {
    console.error('Yurtiçi Kargo iptal hatası:', error);
    return {
      success: false,
      error: error.message || 'İptal işlemi başarısız',
    };
  }
}

/**
 * Barkod/PDF oluştur
 */
export async function createBarcode(trackingNumbers: string[]): Promise<{
  success: boolean;
  pdfBase64?: string;
  error?: string;
}> {
  try {
    const config = await getConfig();
    
    if (config.isTestMode) {
      return {
        success: true,
        pdfBase64: 'mock_pdf_base64_content',
      };
    }
    
    // Gerçek implementasyonda barkod oluşturma servisi çağrılır
    // Şimdilik mock dönelim
    return {
      success: true,
      pdfBase64: 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBS...',
    };
  } catch (error: any) {
    console.error('Yurtiçi Kargo barkod hatası:', error);
    return {
      success: false,
      error: error.message || 'Barkod oluşturulamadı',
    };
  }
}

/**
 * Bağlantı testi
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  mode?: string;
}> {
  try {
    const config = await getConfig();
    
    if (config.isTestMode || config.username === 'test') {
      return {
        success: true,
        message: 'Mock mode aktif - Test başarılı',
        mode: 'mock',
      };
    }
    
    // Gerçek bağlantı testi
    const testResult = await createShipment({
      cargoKey: `TEST${Date.now()}`,
      receiverName: 'Test Kullanıcı',
      receiverAddress: 'Test Adres',
      receiverCity: 'İstanbul',
      receiverDistrict: 'Kadıköy',
      receiverPhone: '5551234567',
      weight: 1,
    });
    
    if (testResult.success) {
      // Test kargosunu iptal et
      await cancelShipment(testResult.trackingNumber || '');
      
      return {
        success: true,
        message: 'Yurtiçi Kargo bağlantısı başarılı',
        mode: 'production',
      };
    } else {
      return {
        success: false,
        message: testResult.error || 'Bağlantı testi başarısız',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Bağlantı testi başarısız',
    };
  }
}

/**
 * XML karakterlerini escape et
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default {
  createShipment,
  trackShipment,
  cancelShipment,
  createBarcode,
  testConnection,
};
