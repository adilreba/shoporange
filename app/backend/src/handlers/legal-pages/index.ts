import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.LEGAL_PAGES_TABLE || 'AtusHome-LegalPages';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://atushome.com',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
};

export interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary?: string;
  isPublished: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedBy?: string;
  metaTitle?: string;
  metaDescription?: string;
  order?: number;
}

// Türkiye için zorunlu yasal sayfalar - hazır şablonlar
const DEFAULT_PAGES: Omit<LegalPage, 'id' | 'createdAt' | 'lastUpdated'>[] = [
  {
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    summary: 'Kişisel verilerin işlenmesine ilişkin aydınlatma metni',
    content: `<h2>KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) AYDINLATMA METNİ</h2>
    
    <h3>1. Veri Sorumlusu</h3>
    <p>Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla [ŞİRKET ADI] tarafından hazırlanmıştır.</p>
    
    <h3>2. İşlenen Kişisel Veriler</h3>
    <p>Toplanan kişisel verileriniz şunlardır:</p>
    <ul>
      <li>Kimlik bilgileri (ad, soyad)</li>
      <li>İletişim bilgileri (e-posta, telefon, adres)</li>
      <li>Finansal bilgiler (ödeme bilgileri)</li>
      <li>İşlem güvenliği bilgileri (IP adresi, çerezler)</li>
    </ul>
    
    <h3>3. İletişim</h3>
    <p>Haklarınızı kullanmak için:<br>
    E-posta: info@atushome.com</p>`,
    isPublished: false,
    order: 1,
  },
  {
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    summary: 'Web sitesi gizlilik politikası ve çerez kullanımı',
    content: `<h2>GİZLİLİK POLİTİKASI</h2>
    
    <h3>1. Topladığımız Bilgiler</h3>
    <ul>
      <li>Kimlik bilgileri (ad, soyad)</li>
      <li>İletişim bilgileri (e-posta, telefon, adres)</li>
      <li>IP adresi ve cihaz bilgileri</li>
    </ul>
    
    <h3>2. İletişim</h3>
    <p>E-posta: privacy@atushome.com</p>`,
    isPublished: false,
    order: 2,
  },
  {
    slug: 'mesafeli-satis-sozlesmesi',
    title: 'Mesafeli Satış Sözleşmesi',
    summary: '6502 sayılı Tüketicinin Korunması Kanunu gereği mesafeli satış sözleşmesi',
    content: `<h2>MESAFELİ SATIŞ SÖZLEŞMESİ</h2>
    
    <h3>MADDE 1 - TARAFLAR</h3>
    <p><strong>SATICI:</strong> [ŞİRKET ADI]</p>
    <p><strong>ALICI:</strong> [MÜŞTERİ BİLGİLERİ]</p>
    
    <h3>MADDE 2 - CAYMA HAKKI</h3>
    <p>ALICI, teslimattan itibaren 14 gün içinde cayma hakkını kullanabilir.</p>`,
    isPublished: false,
    order: 3,
  },
  {
    slug: 'iade-degisim',
    title: 'İade ve Değişim Politikası',
    summary: 'Ürün iade ve değişim koşulları',
    content: `<h2>İADE VE DEĞİŞİM POLİTİKASI</h2>
    
    <h3>1. CAYMA HAKKI</h3>
    <p>14 gün içinde koşulsuz iade hakkı.</p>
    
    <h3>2. İLETİŞİM</h3>
    <p>E-posta: iade@atushome.com</p>`,
    isPublished: false,
    order: 4,
  },
  {
    slug: 'kargo-teslimat',
    title: 'Kargo ve Teslimat',
    summary: 'Kargo süreçleri ve teslimat bilgileri',
    content: `<h2>KARGO VE TESLİMAT</h2>
    
    <h3>1. TESLİMAT SÜRELERİ</h3>
    <p>İstanbul: 1-2 iş günü<br>
    Diğer iller: 2-5 iş günü</p>
    
    <h3>2. ÜCRETSİZ KARGO</h3>
    <p>500 TL üzeri siparişlerde kargo bedava!</p>`,
    isPublished: false,
    order: 5,
  },
  {
    slug: 'kullanim-kosullari',
    title: 'Kullanım Koşulları',
    summary: 'Web sitesi kullanım şartları',
    content: `<h2>KULLANIM KOŞULLARI</h2>
    
    <h3>1. KOŞULLARIN KABULÜ</h3>
    <p>Bu siteyi kullanarak koşulları kabul etmiş sayılırsınız.</p>
    
    <h3>2. İLETİŞİM</h3>
    <p>E-posta: info@atushome.com</p>`,
    isPublished: false,
    order: 6,
  },
  {
    slug: 'cerez-politikasi',
    title: 'Çerez Politikası',
    summary: 'Çerez kullanımı ve yönetimi',
    content: `<h2>ÇEREZ POLİTİKASI</h2>
    
    <h3>1. ÇEREZ NEDİR?</h3>
    <p>Çerezler, web sitemizi ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır.</p>
    
    <h3>2. KULLANDIĞIMIZ ÇEREZLER</h3>
    <ul>
      <li>Zorunlu çerezler</li>
      <li>Analitik çerezler</li>
      <li>Pazarlama çerezleri</li>
    </ul>`,
    isPublished: false,
    order: 7,
  },
  {
    slug: 'banka-hesaplari',
    title: 'Banka Hesaplarımız',
    summary: 'Havale/EFT için banka hesap bilgileri',
    content: `<h2>BANKA HESAPLARIMIZ</h2>
    
    <h3>Havale/EFT Bilgileri</h3>
    <p><strong>Banka:</strong> [BANKA ADI]</p>
    <p><strong>IBAN:</strong> TR00 0000 0000 0000 0000 0000 00</p>
    <p><strong>Hesap Adı:</strong> [ŞİRKET ADI]</p>
    
    <p><em>Sipariş numaranızı açıklama kısmına yazmayı unutmayın!</em></p>`,
    isPublished: false,
    order: 8,
  },
];

// Tüm listeleme (admin)
export const listPages = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.send(new ScanCommand({ TableName: TABLE_NAME }));
    const pages = (result.Items || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(pages),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Sayfalar yüklenemedi' }),
    };
  }
};

// Public listeleme (sadece yayınlananlar)
export const listPublicPages = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'isPublished = :published',
      ExpressionAttributeValues: { ':published': true },
    }));

    const pages = (result.Items || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(p => ({ id: p.id, slug: p.slug, title: p.title, summary: p.summary }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(pages),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Sayfalar yüklenemedi' }),
    };
  }
};

// Tek sayfa getir (slug ile)
export const getPageBySlug = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const slug = event.pathParameters?.slug;
    if (!slug) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Slug gerekli' }) };

    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: { ':slug': slug },
    }));

    const page = result.Items?.[0];
    if (!page || (!page.isPublished && !event.headers.Authorization)) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sayfa bulunamadı' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(page) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Hata oluştu' }) };
  }
};

// Admin - ID ile getir
export const getPageById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID gerekli' }) };

    const result = await dynamodb.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
    if (!result.Item) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sayfa bulunamadı' }) };

    return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Hata oluştu' }) };
  }
};

// Yeni sayfa oluştur
export const createPage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Veri gerekli' }) };

    const data = JSON.parse(event.body);
    const now = new Date().toISOString();

    const page: LegalPage = {
      id: `legal-${Date.now()}`,
      slug: data.slug,
      title: data.title,
      content: data.content,
      summary: data.summary,
      isPublished: data.isPublished || false,
      createdAt: now,
      lastUpdated: now,
      updatedBy: 'admin',
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      order: data.order || 0,
    };

    await dynamodb.send(new PutCommand({ TableName: TABLE_NAME, Item: page }));
    return { statusCode: 201, headers, body: JSON.stringify(page) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Oluşturulamadı' }) };
  }
};

// Sayfa güncelle
export const updatePage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id || !event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID ve veri gerekli' }) };

    const data = JSON.parse(event.body);
    const existing = await dynamodb.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
    if (!existing.Item) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sayfa bulunamadı' }) };

    const updated: LegalPage = {
      ...existing.Item as LegalPage,
      ...data,
      id,
      lastUpdated: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({ TableName: TABLE_NAME, Item: updated }));
    return { statusCode: 200, headers, body: JSON.stringify(updated) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Güncellenemedi' }) };
  }
};

// Sayfa sil
export const deletePage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID gerekli' }) };

    await dynamodb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Silindi' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Silinemedi' }) };
  }
};

// Varsayılan sayfaları oluştur
export const seedPages = async (): Promise<APIGatewayProxyResult> => {
  try {
    const now = new Date().toISOString();

    for (const defaultPage of DEFAULT_PAGES) {
      const existing = await dynamodb.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'SlugIndex',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': defaultPage.slug },
      }));

      if (existing.Items?.length) continue;

      await dynamodb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...defaultPage, id: `legal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, createdAt: now, lastUpdated: now },
      }));
    }

    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Varsayılan sayfalar oluşturuldu' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Oluşturulamadı' }) };
  }
};
