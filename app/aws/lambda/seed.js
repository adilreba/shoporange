const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PRODUCTS_TABLE = process.env.TABLE_NAME || 'AtusHome-Products';
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || 'AtusHome-Categories';
const USERS_TABLE = process.env.USERS_TABLE || 'AtusHome-Users';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// Sample categories data
const categoriesData = [
  {
    id: 'cat_electronics',
    name: 'Elektronik',
    slug: 'elektronik',
    description: 'En son teknoloji ürünleri, akıllı telefonlar, laptoplar ve daha fazlası',
    image: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?w=800',
    icon: 'Smartphone',
    productCount: 0,
    subcategories: [
      { id: 'sub_phone', name: 'Akıllı Telefonlar', slug: 'akilli-telefonlar', productCount: 0 },
      { id: 'sub_laptop', name: 'Laptoplar', slug: 'laptoplar', productCount: 0 },
      { id: 'sub_tablet', name: 'Tabletler', slug: 'tabletler', productCount: 0 },
      { id: 'sub_accessories', name: 'Aksesuarlar', slug: 'aksesuarlar', productCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat_fashion',
    name: 'Moda',
    slug: 'moda',
    description: 'Trend giyim, ayakkabı ve aksesuarlar',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
    icon: 'Shirt',
    productCount: 0,
    subcategories: [
      { id: 'sub_women', name: 'Kadın Giyim', slug: 'kadin-giyim', productCount: 0 },
      { id: 'sub_men', name: 'Erkek Giyim', slug: 'erkek-giyim', productCount: 0 },
      { id: 'sub_shoes', name: 'Ayakkabı', slug: 'ayakkabi', productCount: 0 },
      { id: 'sub_bags', name: 'Çantalar', slug: 'cantalar', productCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat_home',
    name: 'Ev & Yaşam',
    slug: 'ev-yasam',
    description: 'Ev dekorasyonu, mobilya ve yaşam ürünleri',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
    icon: 'Home',
    productCount: 0,
    subcategories: [
      { id: 'sub_furniture', name: 'Mobilya', slug: 'mobilya', productCount: 0 },
      { id: 'sub_decor', name: 'Dekorasyon', slug: 'dekorasyon', productCount: 0 },
      { id: 'sub_kitchen', name: 'Mutfak', slug: 'mutfak', productCount: 0 },
      { id: 'sub_bedding', name: 'Ev Tekstili', slug: 'ev-tekstili', productCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat_sports',
    name: 'Spor & Outdoor',
    slug: 'spor-outdoor',
    description: 'Spor ekipmanları, outdoor gear ve fitness ürünleri',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    icon: 'Dumbbell',
    productCount: 0,
    subcategories: [
      { id: 'sub_fitness', name: 'Fitness', slug: 'fitness', productCount: 0 },
      { id: 'sub_outdoor', name: 'Outdoor', slug: 'outdoor', productCount: 0 },
      { id: 'sub_sportswear', name: 'Spor Giyim', slug: 'spor-giyim', productCount: 0 },
      { id: 'sub_camping', name: 'Kamp', slug: 'kamp', productCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat_cosmetics',
    name: 'Kozmetik',
    slug: 'kozmetik',
    description: 'Makyaj, cilt bakımı ve kişisel bakım ürünleri',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    icon: 'Sparkles',
    productCount: 0,
    subcategories: [
      { id: 'sub_makeup', name: 'Makyaj', slug: 'makyaj', productCount: 0 },
      { id: 'sub_skincare', name: 'Cilt Bakımı', slug: 'cilt-bakimi', productCount: 0 },
      { id: 'sub_perfume', name: 'Parfüm', slug: 'parfum', productCount: 0 },
      { id: 'sub_hair', name: 'Saç Bakımı', slug: 'sac-bakimi', productCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat_toys',
    name: 'Oyuncak & Hobi',
    slug: 'oyuncak-hobi',
    description: 'Oyuncaklar, hobi malzemeleri ve oyunlar',
    image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800',
    icon: 'Gamepad2',
    productCount: 0,
    subcategories: [
      { id: 'sub_toys', name: 'Oyuncaklar', slug: 'oyuncaklar', productCount: 0 },
      { id: 'sub_games', name: 'Oyunlar', slug: 'oyunlar', productCount: 0 },
      { id: 'sub_hobby', name: 'Hobi', slug: 'hobi', productCount: 0 },
      { id: 'sub_puzzles', name: 'Yapbozlar', slug: 'yapbozlar', productCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat_books',
    name: 'Kitap & Kırtasiye',
    slug: 'kitap-kirtasiye',
    description: 'Kitaplar, kırtasiye malzemeleri ve ofis ürünleri',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
    icon: 'BookOpen',
    productCount: 0,
    subcategories: [
      { id: 'sub_books', name: 'Kitaplar', slug: 'kitaplar', productCount: 0 },
      { id: 'sub_stationery', name: 'Kırtasiye', slug: 'kirtasiye', productCount: 0 },
      { id: 'sub_office', name: 'Ofis Malzemeleri', slug: 'ofis-malzemeleri', productCount: 0 },
      { id: 'sub_art', name: 'Sanat Malzemeleri', slug: 'sanat-malzemeleri', productCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cat_food',
    name: 'Gıda & İçecek',
    slug: 'gida-icecek',
    description: 'Organik gıda, içecekler ve atıştırmalıklar',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    icon: 'Coffee',
    productCount: 0,
    subcategories: [
      { id: 'sub_organic', name: 'Organik Ürünler', slug: 'organik-urunler', productCount: 0 },
      { id: 'sub_beverages', name: 'İçecekler', slug: 'icecekler', productCount: 0 },
      { id: 'sub_snacks', name: 'Atıştırmalıklar', slug: 'atistirmaliklar', productCount: 0 },
      { id: 'sub_coffee', name: 'Kahve & Çay', slug: 'kahve-cay', productCount: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample products data
const productsData = [
  // Electronics
  {
    id: 'prod_1',
    name: 'iPhone 15 Pro Max',
    description: 'Apple iPhone 15 Pro Max 256GB Natural Titanium. En son teknoloji ile donatılmış, profesyonel kamera sistemi ve A17 Pro çip.',
    price: 74999,
    originalPrice: 79999,
    stock: 25,
    category: 'elektronik',
    subcategory: 'akilli-telefonlar',
    images: [
      'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800',
      'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=800'
    ],
    rating: 4.8,
    reviewCount: 128,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
    features: ['6.7" Super Retina XDR', 'A17 Pro çip', '48MP Ana kamera', '256GB Depolama']
  },
  {
    id: 'prod_2',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray. Yapay zeka destekli kamera ve S Pen ile profesyonel deneyim.',
    price: 59999,
    originalPrice: 64999,
    stock: 18,
    category: 'elektronik',
    subcategory: 'akilli-telefonlar',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'
    ],
    rating: 4.7,
    reviewCount: 96,
    isNew: true,
    isFeatured: true,
    features: ['6.8" Dynamic AMOLED', '200MP Kamera', 'S Pen', '512GB Depolama']
  },
  {
    id: 'prod_3',
    name: 'MacBook Pro 14" M3',
    description: 'Apple MacBook Pro 14 inç M3 çip 18GB RAM 512GB SSD. Profesyoneller için tasarlanmış güçlü laptop.',
    price: 89999,
    stock: 12,
    category: 'elektronik',
    subcategory: 'laptoplar',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'
    ],
    rating: 4.9,
    reviewCount: 84,
    isNew: true,
    isFeatured: true,
    features: ['M3 çip', '18GB RAM', '512GB SSD', '14.2" Liquid Retina XDR']
  },
  {
    id: 'prod_4',
    name: 'Sony WH-1000XM5',
    description: 'Sony WH-1000XM5 Kablosuz Gürültü Engelleme Kulaklık. Endüstri lideri gürültü engelleme teknolojisi.',
    price: 12999,
    originalPrice: 14999,
    stock: 45,
    category: 'elektronik',
    subcategory: 'aksesuarlar',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800'
    ],
    rating: 4.6,
    reviewCount: 215,
    isFeatured: true,
    isBestseller: true,
    features: ['Aktif gürültü engelleme', '30 saat pil ömrü', 'Çok noktalı bağlantı', 'Dokunmatik kontroller']
  },
  // Fashion
  {
    id: 'prod_5',
    name: 'Nike Air Max 90',
    description: 'Nike Air Max 90 Erkek Spor Ayakkabı. Klasik tasarım ve üstün konfor.',
    price: 3499,
    originalPrice: 4299,
    stock: 32,
    category: 'moda',
    subcategory: 'ayakkabi',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'
    ],
    rating: 4.5,
    reviewCount: 178,
    isFeatured: true,
    features: ['Nike Air teknolojisi', 'Deri ve tekstil üst', 'Kauçuk dış taban']
  },
  {
    id: 'prod_6',
    name: 'Zara Kadın Trençkot',
    description: 'Zara Kadın Klasik Bej Trençkot. Zamansız şıklık ve kalite.',
    price: 2499,
    stock: 28,
    category: 'moda',
    subcategory: 'kadin-giyim',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'
    ],
    rating: 4.4,
    reviewCount: 67,
    isNew: true,
    features: ['Su itici kumaş', 'Kemer dahil', 'Cepli tasarım']
  },
  // Home
  {
    id: 'prod_7',
    name: 'IKEA KIVIK Kanepe',
    description: 'IKEA KIVIK 3 Kişilik Kanepe. Rahat ve konforlu oturum alanı.',
    price: 12999,
    originalPrice: 14999,
    stock: 8,
    category: 'ev-yasam',
    subcategory: 'mobilya',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'
    ],
    rating: 4.3,
    reviewCount: 45,
    isFeatured: true,
    features: ['Yıkanabilir kılıf', '10 yıl garanti', 'Geniş oturum alanı']
  },
  {
    id: 'prod_8',
    name: 'Philips Hue Akıllı Ampul Seti',
    description: 'Philips Hue White and Color Ambiance Başlangıç Seti. Akıllı ev aydınlatması.',
    price: 2499,
    stock: 56,
    category: 'ev-yasam',
    subcategory: 'dekorasyon',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
    ],
    rating: 4.7,
    reviewCount: 134,
    isNew: true,
    features: ['16 milyon renk', 'Ses kontrolü', 'Zamanlama özelliği']
  },
  // Sports
  {
    id: 'prod_9',
    name: 'Under Armour Spor Çantası',
    description: 'Under Armour Undeniable Duffle 4.0 Spor Çantası. Dayanıklı ve fonksiyonel tasarım.',
    price: 899,
    originalPrice: 1199,
    stock: 42,
    category: 'spor-outdoor',
    subcategory: 'spor-giyim',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'
    ],
    rating: 4.5,
    reviewCount: 89,
    features: ['Su itici malzeme', 'Ayakkabı bölmesi', 'Ayakta durabilen taban']
  },
  {
    id: 'prod_10',
    name: 'Decathlon Quechua Çadır',
    description: 'Decathlon Quechua 2 Seconds Easy 3 Kişilik Çadır. 2 saniyede kurulum.',
    price: 3499,
    stock: 15,
    category: 'spor-outdoor',
    subcategory: 'kamp',
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'
    ],
    rating: 4.6,
    reviewCount: 203,
    isFeatured: true,
    features: ['2 saniyede kurulum', 'Fresh & Black teknolojisi', 'Su geçirmez']
  },
  // Cosmetics
  {
    id: 'prod_11',
    name: 'La Roche-Posay Cilt Bakım Seti',
    description: 'La Roche-Posay Effaclar Cilt Bakım Seti. Yağlı ve akneye eğilimli ciltler için.',
    price: 1299,
    originalPrice: 1599,
    stock: 78,
    category: 'kozmetik',
    subcategory: 'cilt-bakimi',
    images: [
      'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=800'
    ],
    rating: 4.8,
    reviewCount: 312,
    isBestseller: true,
    features: ['Temizleyici jel', 'Tonik', 'Nemlendirici', 'Yağsız formül']
  },
  {
    id: 'prod_12',
    name: 'Chanel Coco Mademoiselle',
    description: 'Chanel Coco Mademoiselle Eau de Parfum 50ml. Zamansız ve çekici koku.',
    price: 5499,
    stock: 22,
    category: 'kozmetik',
    subcategory: 'parfum',
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'
    ],
    rating: 4.9,
    reviewCount: 156,
    isFeatured: true,
    features: ['50ml EDP', 'Oryantal notalar', 'Uzun süre kalıcı']
  }
];

// Admin user
const adminUser = {
  id: 'user_admin',
  email: 'admin@atushome.com',
  password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password' hashed
  name: 'Admin User',
  phone: '+90 555 123 4567',
  avatar: '',
  role: 'admin',
  addresses: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Seed function
exports.seedData = async (event) => {
  try {
    console.log('Starting data seeding...');
    
    // Seed categories
    console.log('Seeding categories...');
    for (const category of categoriesData) {
      await dynamodb.put({
        TableName: CATEGORIES_TABLE,
        Item: category
      }).promise();
    }
    console.log(`Seeded ${categoriesData.length} categories`);
    
    // Seed products
    console.log('Seeding products...');
    for (const product of productsData) {
      const productWithTimestamps = {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await dynamodb.put({
        TableName: PRODUCTS_TABLE,
        Item: productWithTimestamps
      }).promise();
    }
    console.log(`Seeded ${productsData.length} products`);
    
    // Seed admin user
    console.log('Seeding admin user...');
    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: adminUser
    }).promise();
    console.log('Seeded admin user');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Data seeded successfully',
        categories: categoriesData.length,
        products: productsData.length,
        users: 1
      })
    };
  } catch (error) {
    console.error('Error seeding data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
