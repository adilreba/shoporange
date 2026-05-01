/**
 * AtusHome HTML Email Template System
 * ====================================
 * Responsive, dark-mode uyumlu, marka kimliğine uygun HTML email şablonları.
 * 
 * Kullanım:
 *   import { renderEmailTemplate } from './emailTemplates';
 *   const html = renderEmailTemplate('welcome', { name: 'Ali', email: 'ali@example.com' });
 * 
 * Yeni şablon ekleme:
 *   1. TemplateDefinition interface'ine ekle
 *   2. TEMPLATES objesine tanımla
 *   3. renderEmailTemplate fonksiyonuna case ekle
 */

// =============================================================================
// TYPES
// =============================================================================

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  subject: string;
  category: 'transactional' | 'marketing' | 'automation';
  variables: string[];
}

export interface EmailTemplateData {
  [key: string]: any;
}

// =============================================================================
// BRAND CONFIG
// =============================================================================

const BRAND = {
  name: process.env.APP_NAME || 'AtusHome',
  url: process.env.FRONTEND_URL || 'https://atushome.com',
  logo: process.env.LOGO_URL || 'https://atushome.com/logo.png',
  primaryColor: '#f97316', // orange-500
  primaryColorDark: '#ea580c', // orange-600
  secondaryColor: '#1e293b', // slate-800
  textColor: '#334155', // slate-700
  lightBg: '#f8fafc', // slate-50
  white: '#ffffff',
  borderColor: '#e2e8f0', // slate-200
  footerBg: '#f1f5f9', // slate-100
};

// =============================================================================
// EMAIL WRAPPER (Tüm şablonların ortak yapısı)
// =============================================================================

function emailWrapper(content: string, options: {
  previewText?: string;
  unsubscribeUrl?: string;
} = {}): string {
  const { previewText = '', unsubscribeUrl } = options;

  return `<!DOCTYPE html>
<html lang="tr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${BRAND.name}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .mobile-full { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-hide { display: none !important; }
      .mobile-center { text-align: center !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
    
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .dark-bg { background-color: #1e293b !important; }
      .dark-text { color: #e2e8f0 !important; }
      .dark-border { border-color: #334155 !important; }
      .dark-footer { background-color: #0f172a !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.lightBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preview Text -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${previewText}</div>
  
  <!-- Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${BRAND.lightBg};">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="mobile-full" style="max-width: 600px; width: 100%; background-color: ${BRAND.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND.white}; padding: 30px 40px; border-bottom: 3px solid ${BRAND.primaryColor};" class="mobile-padding">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <a href="${BRAND.url}" style="text-decoration: none;">
                      <span style="font-size: 24px; font-weight: 800; color: ${BRAND.primaryColor}; letter-spacing: -0.5px;">${BRAND.name}</span>
                    </a>
                  </td>
                  <td align="right" class="mobile-hide">
                    <a href="${BRAND.url}/products" style="color: ${BRAND.textColor}; text-decoration: none; font-size: 13px; margin-left: 20px;">Ürünler</a>
                    <a href="${BRAND.url}/campaigns" style="color: ${BRAND.textColor}; text-decoration: none; font-size: 13px; margin-left: 20px;">Kampanyalar</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;" class="mobile-padding">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND.footerBg}; padding: 30px 40px; border-top: 1px solid ${BRAND.borderColor};" class="mobile-padding dark-footer">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 15px; font-size: 14px; color: #64748b;">
                      <strong style="color: ${BRAND.secondaryColor};">${BRAND.name}</strong> — Güvenli Alışverişin Adresi
                    </p>
                    <p style="margin: 0 0 15px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                      Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.<br>
                      Sorularınız için <a href="${BRAND.url}/contact" style="color: ${BRAND.primaryColor}; text-decoration: none;">iletişim sayfamızı</a> kullanabilirsiniz.
                    </p>
                    ${unsubscribeUrl ? `
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">E-bülten aboneliğinden çık</a>
                    </p>
                    ` : ''}
                    <p style="margin: 15px 0 0; font-size: 11px; color: #cbd5e1;">
                      © ${new Date().getFullYear()} ${BRAND.name}. Tüm hakları saklıdır.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

function button(label: string, url: string, style: 'primary' | 'secondary' = 'primary'): string {
  const isPrimary = style === 'primary';
  const bgColor = isPrimary ? BRAND.primaryColor : BRAND.white;
  const textColor = isPrimary ? BRAND.white : BRAND.primaryColor;
  const border = isPrimary ? 'none' : `2px solid ${BRAND.primaryColor}`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
      <tr>
        <td style="border-radius: 8px; background-color: ${bgColor}; border: ${border};" align="center">
          <a href="${url}" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: ${textColor}; text-decoration: none; border-radius: 8px;">${label}</a>
        </td>
      </tr>
    </table>
  `;
}

// =============================================================================
// PRODUCT CARD COMPONENT
// =============================================================================

function productCard(product: { name: string; price: number; image: string; url: string }): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 10px 0; border: 1px solid ${BRAND.borderColor}; border-radius: 8px; overflow: hidden;">
      <tr>
        <td width="80" style="padding: 12px;">
          <img src="${product.image}" alt="${product.name}" width="80" height="80" style="border-radius: 6px; object-fit: cover; display: block;">
        </td>
        <td style="padding: 12px 12px 12px 0; vertical-align: middle;">
          <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: ${BRAND.secondaryColor};">${product.name}</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${BRAND.primaryColor};">${product.price.toFixed(2)} TL</p>
        </td>
        <td width="100" style="padding: 12px; vertical-align: middle;" align="right">
          <a href="${product.url}" style="display: inline-block; padding: 8px 16px; background-color: ${BRAND.primaryColor}; color: ${BRAND.white}; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">İncele</a>
        </td>
      </tr>
    </table>
  `;
}

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

export const EMAIL_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'welcome',
    name: 'Hoş Geldin',
    description: 'Yeni kayıt olan kullanıcıya gönderilen karşılama emaili',
    subject: '{{name}}, AtusHome\'a Hoş Geldiniz! 🎉',
    category: 'automation',
    variables: ['name', 'email', 'loginUrl'],
  },
  {
    id: 'welcome_series_2',
    name: 'Hoş Geldin Serisi #2',
    description: 'Kayıttan 1 gün sonra gönderilen ürün keşfi emaili',
    subject: '{{name}}, Sizin İçin Seçtiklerimiz',
    category: 'automation',
    variables: ['name', 'products'],
  },
  {
    id: 'welcome_series_3',
    name: 'Hoş Geldin Serisi #3',
    description: 'Kayıttan 3 gün sonra gönderilen indirim emaili',
    subject: 'Size Özel İlk Alışveriş İndirimi! 🎁',
    category: 'automation',
    variables: ['name', 'couponCode', 'discountPercent'],
  },
  {
    id: 'cart_abandonment_1',
    name: 'Sepet Terk #1',
    description: 'Sepete ekleme sonrası 1 saatte gönderilen hatırlatma',
    subject: '{{name}}, Sepetiniz Sizi Bekliyor 🛒',
    category: 'automation',
    variables: ['name', 'items', 'cartUrl', 'cartTotal'],
  },
  {
    id: 'cart_abandonment_2',
    name: 'Sepet Terk #2',
    description: 'Sepet terk sonrası 24 saatte gönderilen indirimli hatırlatma',
    subject: 'Sepetinize %5 İndirim Kodu Hediye! 💰',
    category: 'automation',
    variables: ['name', 'items', 'cartUrl', 'couponCode'],
  },
  {
    id: 'cart_abandonment_3',
    name: 'Sepet Terk #3',
    description: 'Sepet terk sonrası 72 saatte gönderilen son hatırlatma',
    subject: 'Son Şans: Sepetinizdeki Ürünler Tükeniyor! ⏰',
    category: 'automation',
    variables: ['name', 'items', 'cartUrl', 'couponCode'],
  },
  {
    id: 'order_confirmation',
    name: 'Sipariş Onayı',
    description: 'Sipariş alındığında gönderilen onay emaili',
    subject: 'Siparişiniz Alındı #{{orderNumber}} ✅',
    category: 'transactional',
    variables: ['name', 'orderNumber', 'orderId', 'items', 'total', 'shippingAddress', 'orderUrl'],
  },
  {
    id: 'order_shipped',
    name: 'Sipariş Kargoya Verildi',
    description: 'Sipariş kargoya verildiğinde gönderilen email',
    subject: 'Siparişiniz Yolda! 🚚 #{{orderNumber}}',
    category: 'transactional',
    variables: ['name', 'orderNumber', 'trackingNumber', 'trackingUrl', 'carrier'],
  },
  {
    id: 'order_delivered',
    name: 'Sipariş Teslim Edildi',
    description: 'Sipariş teslim edildiğinde gönderilen email',
    subject: 'Siparişiniz Teslim Edildi 📦 #{{orderNumber}}',
    category: 'transactional',
    variables: ['name', 'orderNumber', 'reviewUrl'],
  },
  {
    id: 'review_request',
    name: 'Yorum İsteği',
    description: 'Teslimattan 7 gün sonra gönderilen yorum isteği',
    subject: 'Siparişiniz Nasıldı? Yorumunuzu Bekliyoruz ⭐',
    category: 'automation',
    variables: ['name', 'orderNumber', 'products', 'reviewUrl'],
  },
  {
    id: 'birthday',
    name: 'Doğum Günü Kutlaması',
    description: 'Kullanıcı doğum gününde gönderilen indirim emaili',
    subject: '🎂 İyi Ki Doğdunuz {{name}}! Size Özel %20 İndirim',
    category: 'automation',
    variables: ['name', 'couponCode', 'expiryDate'],
  },
  {
    id: 'win_back',
    name: 'Uzun Süre Görülmedi',
    description: '60 gün aktif olmayan kullanıcıya gönderilen email',
    subject: '{{name}}, Sizi Özledik! %15 İndirimle Geri Dönün 💙',
    category: 'automation',
    variables: ['name', 'couponCode', 'featuredProducts'],
  },
  {
    id: 'stock_alert',
    name: 'Stok Alarmı',
    description: 'Bekleme listesindeki ürün stoka girdiğinde gönderilen email',
    subject: 'İstediğiniz Ürün Stokta! 🚨 {{productName}}',
    category: 'automation',
    variables: ['name', 'productName', 'productImage', 'productUrl', 'price'],
  },
  {
    id: 'price_drop',
    name: 'Fiyat Düşüşü',
    description: 'Favori ürün fiyatı düştüğünde gönderilen email',
    subject: '💥 {{productName}} Fiyatı Düştü!',
    category: 'automation',
    variables: ['name', 'productName', 'productImage', 'oldPrice', 'newPrice', 'productUrl'],
  },
  {
    id: 'vip_special',
    name: 'VIP Müşteri Özel',
    description: '5000+ TL harcayan müşteriye özel email',
    subject: '{{name}}, VIP Ayrıcalıklarınız Sizi Bekliyor 👑',
    category: 'marketing',
    variables: ['name', 'couponCode', 'exclusiveProducts'],
  },
  {
    id: 'first_purchase_thank_you',
    name: 'İlk Sipariş Teşekkür',
    description: 'İlk sipariş sonrası gönderilen teşekkür emaili',
    subject: 'İlk Alışverişiniz İçin Teşekkürler! 🙏',
    category: 'automation',
    variables: ['name', 'orderNumber', 'nextOrderCoupon'],
  },
  {
    id: 'password_reset',
    name: 'Şifre Sıfırlama',
    description: 'Şifre sıfırlama isteği sonrası gönderilen email',
    subject: 'Şifre Sıfırlama İsteği 🔐',
    category: 'transactional',
    variables: ['name', 'resetUrl', 'expiryTime'],
  },
  {
    id: 'email_verification',
    name: 'Email Doğrulama',
    description: 'Kayıt sonrası email doğrulama kodu',
    subject: 'Email Adresinizi Doğrulayın 📧',
    category: 'transactional',
    variables: ['name', 'verificationCode'],
  },
];

// =============================================================================
// TEMPLATE RENDERERS
// =============================================================================

const templateRenderers: Record<string, (data: EmailTemplateData) => { subject: string; html: string; text: string }> = {
  welcome: (data) => {
    const subject = `${data.name || 'Değerli Müşterimiz'}, AtusHome'a Hoş Geldiniz! 🎉`;
    const html = emailWrapper(`
      <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 700; color: ${BRAND.secondaryColor}; line-height: 1.3;">
        Hoş Geldiniz! 🎉
      </h1>
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        Merhaba <strong>${data.name || ''}</strong>,
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        AtusHome ailesine katıldığınız için teşekkür ederiz! Artık binlerce ürün arasından dilediğinizi güvenle sipariş verebilirsiniz.
      </p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0; background-color: ${BRAND.lightBg}; border-radius: 8px; padding: 20px;">
        <tr>
          <td>
            <p style="margin: 0 0 15px; font-size: 14px; font-weight: 600; color: ${BRAND.secondaryColor};">Neler yapabilirsiniz?</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: ${BRAND.textColor}; line-height: 2;">
              <li>✅ Hızlı ve güvenli alışveriş</li>
              <li>✅ 500₺ üzeri ücretsiz kargo</li>
              <li>✅ 14 gün içinde kolay iade</li>
              <li>✅ 7/24 müşteri desteği</li>
            </ul>
          </td>
        </tr>
      </table>
      
      ${button('Alışverişe Başla', `${BRAND.url}/products`)}
      ${button('Hesabımı Görüntüle', `${BRAND.url}/profile`, 'secondary')}
      
      <p style="margin: 20px 0 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.
      </p>
    `, { previewText: 'AtusHome ailesine hoş geldiniz! Hemen alışverişe başlayın.' });

    const text = `Merhaba ${data.name || ''},\n\nAtusHome'a hoş geldiniz! Artık binlerce ürün arasından dilediğinizi güvenle sipariş verebilirsiniz.\n\nAlışverişe başlamak için: ${BRAND.url}/products\n\nİyi alışverişler,\n${BRAND.name} Ekibi`;

    return { subject, html, text };
  },

  cart_abandonment_1: (data) => {
    const items = data.items || [];
    const itemsHtml = items.map((item: any) => productCard({
      name: item.name,
      price: item.price,
      image: item.image || 'https://via.placeholder.com/80',
      url: `${BRAND.url}/product/${item.productId}`,
    })).join('');

    const subject = `${data.name || ''}, Sepetiniz Sizi Bekliyor 🛒`;
    const html = emailWrapper(`
      <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: ${BRAND.secondaryColor}; line-height: 1.3;">
        Sepetiniz Sizi Bekliyor 🛒
      </h1>
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        Merhaba <strong>${data.name || ''}</strong>,
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        Sepetinize eklediğiniz ürünleri unuttunuz mu? Stoklar hızla tükeniyor, acele edin!
      </p>
      
      ${itemsHtml}
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; padding: 15px; background-color: ${BRAND.lightBg}; border-radius: 8px;">
        <tr>
          <td style="font-size: 16px; font-weight: 600; color: ${BRAND.secondaryColor};">
            Sepet Toplamı: <span style="color: ${BRAND.primaryColor};">${(data.cartTotal || 0).toFixed(2)} TL</span>
          </td>
        </tr>
      </table>
      
      ${button('Sepetimi Tamamla', data.cartUrl || `${BRAND.url}/cart`)}
      
      <p style="margin: 15px 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
        Ürünler 30 dakika stokta rezerve edilir.
      </p>
    `, { previewText: 'Sepetinizdeki ürünler sizi bekliyor. Hemen tamamlayın!' });

    const text = `Merhaba ${data.name || ''},\n\nSepetinizdeki ürünleri unuttunuz mu?\n\nSepet Toplamı: ${(data.cartTotal || 0).toFixed(2)} TL\n\nSepetinizi tamamlamak için: ${data.cartUrl || BRAND.url + '/cart'}\n\n${BRAND.name}`;

    return { subject, html, text };
  },

  cart_abandonment_2: (data) => {
    const items = data.items || [];
    const itemsHtml = items.slice(0, 3).map((item: any) => productCard({
      name: item.name,
      price: item.price,
      image: item.image || 'https://via.placeholder.com/80',
      url: `${BRAND.url}/product/${item.productId}`,
    })).join('');

    const subject = 'Sepetinize %5 İndirim Kodu Hediye! 💰';
    const html = emailWrapper(`
      <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: ${BRAND.secondaryColor}; line-height: 1.3;">
        Size Özel Bir Sürprizimiz Var! 🎁
      </h1>
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        Merhaba <strong>${data.name || ''}</strong>,
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        Sepetinizi tamamlamanız için size özel bir indirim kodu hazırladık.
      </p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.primaryColorDark}); border-radius: 12px; padding: 25px;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255,255,255,0.9);">İNDİRİM KODUNUZ</p>
            <p style="margin: 0 0 15px; font-size: 32px; font-weight: 800; color: white; letter-spacing: 4px; font-family: monospace;">${data.couponCode || 'SEPET5'}</p>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">Sepetinize %5 indirim uygular</p>
          </td>
        </tr>
      </table>
      
      ${itemsHtml}
      
      ${button('İndirimi Kullan', data.cartUrl || `${BRAND.url}/cart`)}
      
      <p style="margin: 15px 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
        Bu kod 24 saat geçerlidir ve tek seferlik kullanıma sahiptir.
      </p>
    `, { previewText: 'Sepetinize %5 indirim kodu hediye! 24 saat geçerli.' });

    const text = `Merhaba ${data.name || ''},\n\nSepetinizi tamamlamanız için size özel bir indirim kodu:\n\nKOD: ${data.couponCode || 'SEPET5'}\n%5 İndirim\n\n${data.cartUrl || BRAND.url + '/cart'}\n\nBu kod 24 saat geçerlidir.`;

    return { subject, html, text };
  },

  order_confirmation: (data) => {
    const items = data.items || [];
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid ${BRAND.borderColor};">
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: ${BRAND.secondaryColor};">${item.name}</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">${item.quantity} adet x ${item.price.toFixed(2)} TL</p>
        </td>
        <td align="right" style="padding: 10px 0; border-bottom: 1px solid ${BRAND.borderColor}; font-size: 14px; font-weight: 600; color: ${BRAND.secondaryColor};">
          ${(item.quantity * item.price).toFixed(2)} TL
        </td>
      </tr>
    `).join('');

    const subject = `Siparişiniz Alındı #${data.orderNumber || data.orderId} ✅`;
    const html = emailWrapper(`
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="width: 60px; height: 60px; background-color: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
          <span style="font-size: 28px;">✅</span>
        </div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${BRAND.secondaryColor};">
          Siparişiniz Alındı!
        </h1>
        <p style="margin: 8px 0 0; font-size: 14px; color: #94a3b8;">
          Sipariş No: <strong>${data.orderNumber || data.orderId}</strong>
        </p>
      </div>
      
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        Merhaba <strong>${data.name || ''}</strong>, siparişiniz başarıyla alındı. En kısa sürede hazırlayıp kargoya vereceğiz.
      </p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
        ${itemsHtml}
        <tr>
          <td style="padding: 15px 0; font-size: 16px; font-weight: 700; color: ${BRAND.secondaryColor};">Toplam</td>
          <td align="right" style="padding: 15px 0; font-size: 18px; font-weight: 800; color: ${BRAND.primaryColor};">${(data.total || 0).toFixed(2)} TL</td>
        </tr>
      </table>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; background-color: ${BRAND.lightBg}; border-radius: 8px; padding: 15px;">
        <tr>
          <td>
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: ${BRAND.secondaryColor};">📍 Teslimat Adresi</p>
            <p style="margin: 0; font-size: 13px; color: ${BRAND.textColor}; line-height: 1.6;">${data.shippingAddress || ''}</p>
          </td>
        </tr>
      </table>
      
      ${button('Siparişimi Takip Et', data.orderUrl || `${BRAND.url}/orders`)}
      
      <p style="margin: 20px 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
        Sipariş durumu değiştiğinde size email ve SMS ile bilgi vereceğiz.
      </p>
    `, { previewText: `Siparişiniz #${data.orderNumber || data.orderId} başarıyla alındı.` });

    const text = `Siparişiniz Alındı!\n\nSipariş No: ${data.orderNumber || data.orderId}\nToplam: ${(data.total || 0).toFixed(2)} TL\n\nSiparişinizi takip etmek için: ${data.orderUrl || BRAND.url + '/orders'}\n\n${BRAND.name}`;

    return { subject, html, text };
  },

  birthday: (data) => {
    const subject = `🎂 İyi Ki Doğdunuz ${data.name || ''}! Size Özel %20 İndirim`;
    const html = emailWrapper(`
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 64px; margin-bottom: 10px;">🎂</div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${BRAND.secondaryColor};">
          İyi Ki Doğdunuz!
        </h1>
        <p style="margin: 10px 0 0; font-size: 16px; color: ${BRAND.textColor};">
          Mutlu yıllar <strong>${data.name || ''}</strong>! Size özel bir sürprizimiz var.
        </p>
      </div>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0; background: linear-gradient(135deg, #f97316, #ec4899); border-radius: 16px; padding: 30px;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 10px; font-size: 16px; color: rgba(255,255,255,0.95);">DOĞUM GÜNÜ HEDİYENİZ</p>
            <p style="margin: 0 0 15px; font-size: 48px; font-weight: 800; color: white;">%20</p>
            <p style="margin: 0 0 20px; font-size: 16px; color: rgba(255,255,255,0.95);">Tüm ürünlerde geçerli</p>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); background: rgba(0,0,0,0.15); padding: 10px 20px; border-radius: 8px; display: inline-block; font-family: monospace; letter-spacing: 2px;">
              ${data.couponCode || 'DOGUMGUNU20'}
            </p>
          </td>
        </tr>
      </table>
      
      ${button('İndirimi Kullan', `${BRAND.url}/products`)}
      
      <p style="margin: 15px 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
        Bu kod ${data.expiryDate || 'bu ay sonuna kadar'} geçerlidir.
      </p>
    `, { previewText: 'Doğum gününüz kutlu olsun! Size özel %20 indirim kodu hediye.' });

    const text = `İyi Ki Doğdunuz ${data.name || ''}!\n\nSize özel doğum günü hediyeniz:\n%20 İndirim Kodu: ${data.couponCode || 'DOGUMGUNU20'}\n\nİndirimi kullan: ${BRAND.url}/products`;

    return { subject, html, text };
  },

  stock_alert: (data) => {
    const subject = `İstediğiniz Ürün Stokta! 🚨 ${data.productName || ''}`;
    const html = emailWrapper(`
      <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: ${BRAND.secondaryColor}; line-height: 1.3;">
        İstediğiniz Ürün Stokta! 🚨
      </h1>
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        Merhaba <strong>${data.name || ''}</strong>,
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
        Bekleme listesindeki ürün stoklara girdi. Hemen sipariş verin, stoklar hızla tükeniyor!
      </p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; border: 2px solid ${BRAND.primaryColor}; border-radius: 12px; overflow: hidden;">
        <tr>
          <td width="120" style="padding: 20px;">
            <img src="${data.productImage || 'https://via.placeholder.com/120'}" alt="${data.productName || ''}" width="100" height="100" style="border-radius: 8px; object-fit: cover; display: block;">
          </td>
          <td style="padding: 20px 20px 20px 0; vertical-align: middle;">
            <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: ${BRAND.secondaryColor};">${data.productName || ''}</p>
            <p style="margin: 0 0 15px; font-size: 24px; font-weight: 800; color: ${BRAND.primaryColor};">${(data.price || 0).toFixed(2)} TL</p>
            ${button('Hemen Satın Al', data.productUrl || BRAND.url, 'primary')}
          </td>
        </tr>
      </table>
      
      <p style="margin: 15px 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
        Bu bildirim sadece size özeldir. Ürün stokta kalmayabilir.
      </p>
    `, { previewText: `İstediğiniz ${data.productName || 'ürün'} stoklara girdi! Hemen sipariş verin.` });

    const text = `Merhaba ${data.name || ''},\n\n"${data.productName || ''}" ürünü stoklara girdi!\n\nFiyat: ${(data.price || 0).toFixed(2)} TL\n\nSatin al: ${data.productUrl || BRAND.url}\n\n${BRAND.name}`;

    return { subject, html, text };
  },
};

// =============================================================================
// MAIN RENDER FUNCTION
// =============================================================================

export function renderEmailTemplate(
  templateId: string,
  data: EmailTemplateData
): { subject: string; html: string; text: string } {
  const renderer = templateRenderers[templateId];

  if (!renderer) {
    // Fallback: simple plain text template
    const subject = data.subject || `${BRAND.name} Bildirimi`;
    const text = data.body || JSON.stringify(data, null, 2);
    const html = emailWrapper(`
      <pre style="font-family: inherit; white-space: pre-wrap; font-size: 14px; color: ${BRAND.textColor}; line-height: 1.6;">${text}</pre>
    `);
    return { subject, html, text };
  }

  return renderer(data);
}

// =============================================================================
// SUBJECT RENDERER (Handlebars-style simple substitution)
// =============================================================================

export function renderSubject(template: string, data: EmailTemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

// =============================================================================
// GET AVAILABLE TEMPLATES
// =============================================================================

export function getEmailTemplates(): TemplateDefinition[] {
  return EMAIL_TEMPLATES;
}

export function getEmailTemplateById(id: string): TemplateDefinition | undefined {
  return EMAIL_TEMPLATES.find(t => t.id === id);
}

export default renderEmailTemplate;
