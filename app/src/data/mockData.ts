import type { CategoryInfo, Product, User, Order, Category } from '@/types';

export const categories: CategoryInfo[] = [
  {
    id: 'elektronik',
    name: 'Elektronik',
    icon: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?w=800',
    productCount: 1250
  },
  {
    id: 'moda',
    name: 'Moda',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
    productCount: 3400
  },
  {
    id: 'ev-yasam',
    name: 'Ev & Yaşam',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800',
    productCount: 2100
  },
  {
    id: 'kozmetik',
    name: 'Kozmetik',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    productCount: 890
  },
  {
    id: 'spor',
    name: 'Spor',
    icon: 'Dumbbell',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    productCount: 760
  },
  {
    id: 'kitap',
    name: 'Kitap',
    icon: 'BookOpen',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
    productCount: 5200
  },
  {
    id: 'oyuncak',
    name: 'Oyuncak',
    icon: 'Gamepad2',
    image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800',
    productCount: 430
  },
  {
    id: 'supermarket',
    name: 'Süpermarket',
    icon: 'ShoppingBasket',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    productCount: 1800
  }
];

export const subcategories: Record<Category, string[]> = {
  'elektronik': ['Telefon', 'Laptop', 'Tablet', 'Kulaklık', 'Kamera', 'Aksesuar'],
  'moda': ['Kadın', 'Erkek', 'Çocuk', 'Ayakkabı', 'Çanta', 'Aksesuar'],
  'ev-yasam': ['Mobilya', 'Dekorasyon', 'Mutfak', 'Banyo', 'Aydınlatma', 'Tekstil'],
  'kozmetik': ['Makyaj', 'Cilt Bakımı', 'Parfüm', 'Saç Bakımı', 'Erkek Bakım'],
  'spor': ['Fitness', 'Koşu', 'Outdoor', 'Top Sporları', 'Spor Giyim'],
  'kitap': ['Roman', 'Bilim', 'Tarih', 'Çocuk', 'Eğitim', 'Dergi'],
  'oyuncak': ['Eğitici', 'Figür', 'Puzzle', 'Oyun', 'Bebek', 'Araç'],
  'supermarket': ['Gıda', 'İçecek', 'Temizlik', 'Kağıt', 'Bebek', 'Ev Bakım']
};

export const brands = [
  'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Zara', 'H&M', 'IKEA',
  'Philips', 'Bosch', 'Lego', 'Hasbro', 'L\'Oreal', 'Nivea', 'Penguin', 'Can Yayınları'
];

export const products: Product[] = [
  // ELEKTRONIK
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    description: 'Apple iPhone 15 Pro Max 256GB Natural Titanium. A17 Pro çip, 48MP kamera sistemi, USB-C bağlantı noktası ve daha fazlası.',
    price: 74999,
    originalPrice: 79999,
    discount: 6,
    images: [
      'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800',
      'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=800'
    ],
    category: 'elektronik',
    subcategory: 'Telefon',
    brand: 'Apple',
    sku: 'IPH15PM-256-NT',
    stock: 45,
    rating: 4.9,
    reviewCount: 128,
    reviews: [
      {
        id: 'r1',
        userId: 'u1',
        userName: 'Ahmet Yılmaz',
        rating: 5,
        comment: 'Harika bir telefon, kamerası mükemmel!',
        createdAt: '2024-01-15',
        verified: true
      }
    ],
    features: {
      'Ekran': '6.7" Super Retina XDR',
      'İşlemci': 'A17 Pro',
      'Depolama': '256GB',
      'Kamera': '48MP Ana + 12MP Ultra Geniş + 12MP Telefoto',
      'Batarya': '4422 mAh'
    },
    tags: ['telefon', 'apple', 'ios', 'premium'],
    isNew: true,
    isBestseller: true,
    isFeatured: true,
    salesCount: 234,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray. AI özellikleri, S Pen, 200MP kamera ve daha fazlası.',
    price: 69999,
    originalPrice: 74999,
    discount: 7,
    images: [
      'https://images.unsplash.com/photo-1610945265078-3858a0828671?w=800',
      'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=800'
    ],
    category: 'elektronik',
    subcategory: 'Telefon',
    brand: 'Samsung',
    sku: 'SGS24U-512-TG',
    stock: 32,
    rating: 4.8,
    reviewCount: 96,
    features: {
      'Ekran': '6.8" Dynamic AMOLED 2X',
      'İşlemci': 'Snapdragon 8 Gen 3',
      'Depolama': '512GB',
      'Kamera': '200MP Ana + 50MP Telefoto',
      'Batarya': '5000 mAh'
    },
    tags: ['telefon', 'samsung', 'android', 'premium'],
    isNew: true,
    isBestseller: false,
    isFeatured: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'MacBook Pro 14" M3',
    description: 'Apple MacBook Pro 14 inç M3 çip 8GB RAM 512GB SSD. Profesyonel performans, inanılmaz pil ömrü.',
    price: 64999,
    originalPrice: 69999,
    discount: 7,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'
    ],
    category: 'elektronik',
    subcategory: 'Laptop',
    brand: 'Apple',
    sku: 'MBP14-M3-512',
    stock: 18,
    rating: 4.9,
    reviewCount: 84,
    features: {
      'Ekran': '14.2" Liquid Retina XDR',
      'İşlemci': 'Apple M3',
      'RAM': '8GB',
      'Depolama': '512GB SSD',
      'Batarya': '22 saat'
    },
    tags: ['laptop', 'apple', 'macos', 'profesyonel'],
    isNew: true,
    isBestseller: true,
    isFeatured: true,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05'
  },
  {
    id: '4',
    name: 'Sony WH-1000XM5',
    description: 'Sony WH-1000XM5 Kablosuz Gürültü Engelleme Kulaklık. Endüstri lideri gürültü engelleme, 30 saat pil ömrü.',
    price: 8999,
    originalPrice: 11999,
    discount: 25,
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'
    ],
    category: 'elektronik',
    subcategory: 'Kulaklık',
    brand: 'Sony',
    sku: 'SONY-XM5-BLK',
    stock: 67,
    rating: 4.7,
    reviewCount: 215,
    features: {
      'Tip': 'Over-ear',
      'Gürültü Engelleme': 'Aktif',
      'Pil Ömrü': '30 saat',
      'Bağlantı': 'Bluetooth 5.2',
      'Ağırlık': '250g'
    },
    tags: ['kulaklık', 'sony', 'bluetooth', 'noise-cancelling'],
    isNew: false,
    isBestseller: true,
    isFeatured: true,
    createdAt: '2023-06-01',
    updatedAt: '2024-01-15'
  },
  {
    id: '5',
    name: 'iPad Pro 12.9" M2',
    description: 'Apple iPad Pro 12.9 inç M2 çip 256GB Wi-Fi. Liquid Retina XDR ekran, profesyonel performans.',
    price: 42999,
    originalPrice: 45999,
    discount: 7,
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
      'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800'
    ],
    category: 'elektronik',
    subcategory: 'Tablet',
    brand: 'Apple',
    sku: 'IPADPRO-129-256',
    stock: 23,
    rating: 4.8,
    reviewCount: 156,
    features: {
      'Ekran': '12.9" Liquid Retina XDR',
      'İşlemci': 'Apple M2',
      'Depolama': '256GB',
      'Kamera': '12MP Ultra Geniş',
      'Bağlantı': 'Wi-Fi 6E'
    },
    tags: ['tablet', 'apple', 'ipad', 'profesyonel'],
    isNew: false,
    isBestseller: false,
    isFeatured: true,
    createdAt: '2023-10-01',
    updatedAt: '2024-01-10'
  },
  // MODA
  {
    id: '6',
    name: 'Nike Air Max 90',
    description: 'Nike Air Max 90 Erkek Spor Ayakkabı. Klasik tasarım, üstün konfor ve dayanıklılık.',
    price: 3499,
    originalPrice: 4299,
    discount: 19,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800'
    ],
    category: 'moda',
    subcategory: 'Ayakkabı',
    brand: 'Nike',
    sku: 'NIKE-AM90-001',
    stock: 89,
    rating: 4.6,
    reviewCount: 342,
    features: {
      'Materyal': 'Deri/Sentetik',
      'Taban': 'Kauçuk',
      'Ağırlık': '320g',
      'Su Geçirmez': 'Hayır',
      'Ortopedik': 'Evet'
    },
    tags: ['ayakkabı', 'nike', 'spor', 'günlük'],
    isNew: false,
    isBestseller: true,
    isFeatured: true,
    createdAt: '2023-08-01',
    updatedAt: '2024-01-20'
  },
  {
    id: '7',
    name: 'Zara Kadın Trençkot',
    description: 'Zara Kadın Klasik Trençkot. Zamansız tasarım, su itici kumaş, mükemmel kalıp.',
    price: 2499,
    originalPrice: 3499,
    discount: 29,
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800'
    ],
    category: 'moda',
    subcategory: 'Kadın',
    brand: 'Zara',
    sku: 'ZARA-TRENCH-001',
    stock: 45,
    rating: 4.5,
    reviewCount: 128,
    features: {
      'Materyal': '%65 Pamuk %35 Polyester',
      'Astar': 'Var',
      'Kapüşon': 'Çıkarılabilir',
      'Cep': '4 adet',
      'Bakım': 'Kuru temizleme'
    },
    tags: ['mont', 'kadın', 'kış', 'klasik'],
    isNew: true,
    isBestseller: false,
    isFeatured: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: '8',
    name: 'Adidas Originals Sweatshirt',
    description: 'Adidas Originals Trefoil Erkek Sweatshirt. Klasik tasarım, yumuşak iç yüzey, rahat kalıp.',
    price: 1299,
    originalPrice: 1799,
    discount: 28,
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800'
    ],
    category: 'moda',
    subcategory: 'Erkek',
    brand: 'Adidas',
    sku: 'ADS-SWT-001',
    stock: 120,
    rating: 4.4,
    reviewCount: 89,
    features: {
      'Materyal': '%80 Pamuk %20 Polyester',
      'Kalıp': 'Regular Fit',
      'Yaka': 'Bisiklet Yaka',
      'Baskı': 'Göğüs baskısı',
      'Bakım': 'Makinede yıkanabilir'
    },
    tags: ['sweatshirt', 'erkek', 'günlük', 'spor'],
    isNew: false,
    isBestseller: true,
    isFeatured: false,
    createdAt: '2023-09-01',
    updatedAt: '2024-01-10'
  },
  // EV & YASAM
  {
    id: '9',
    name: 'IKEA POÄNG Koltuk',
    description: 'IKEA POÄNG Dinlenme Koltuğu. Konforlu tasarım, dayanıklı malzeme, modern görünüm.',
    price: 2499,
    originalPrice: 2999,
    discount: 17,
    images: [
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
    ],
    category: 'ev-yasam',
    subcategory: 'Mobilya',
    brand: 'IKEA',
    sku: 'IKEA-POANG-001',
    stock: 34,
    rating: 4.7,
    reviewCount: 567,
    features: {
      'Malzeme': 'Huş kaplama/Doğal deri',
      'Yükseklik': '100 cm',
      'Genişlik': '68 cm',
      'Derinlik': '82 cm',
      'Taşıma Kapasitesi': '110 kg'
    },
    tags: ['mobilya', 'koltuk', 'salon', 'dinlenme'],
    isNew: false,
    isBestseller: true,
    isFeatured: true,
    createdAt: '2023-05-01',
    updatedAt: '2024-01-05'
  },
  {
    id: '10',
    name: 'Philips Hue Akıllı Ampul',
    description: 'Philips Hue White and Color Ambiance Akıllı LED Ampul. 16 milyon renk, ses kontrolü, programlama.',
    price: 449,
    originalPrice: 599,
    discount: 25,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800'
    ],
    category: 'ev-yasam',
    subcategory: 'Aydınlatma',
    brand: 'Philips',
    sku: 'PHI-HUE-001',
    stock: 200,
    rating: 4.6,
    reviewCount: 423,
    features: {
      'Güç': '9.5W',
      'Işık Akısı': '806 lümen',
      'Renk Sıcaklığı': '2000-6500K',
      'Ömür': '25.000 saat',
      'Bağlantı': 'Zigbee/Bluetooth'
    },
    tags: ['ampul', 'akıllı ev', 'led', 'renkli'],
    isNew: false,
    isBestseller: true,
    isFeatured: false,
    createdAt: '2023-07-01',
    updatedAt: '2024-01-15'
  },
  // KOZMETIK
  {
    id: '11',
    name: 'L\'Oreal Paris Mascara',
    description: 'L\'Oreal Paris Lash Paradise Maskara. Hacim veren formül, yoğun siyah pigment.',
    price: 189,
    originalPrice: 249,
    discount: 24,
    images: [
      'https://images.unsplash.com/photo-1631730486784-5456119f69ae?w=800',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800'
    ],
    category: 'kozmetik',
    subcategory: 'Makyaj',
    brand: 'L\'Oreal',
    sku: 'LOR-MASC-001',
    stock: 350,
    rating: 4.5,
    reviewCount: 892,
    features: {
      'Hacim': 'Yüksek',
      'Uzunluk': 'Orta',
      'Su Geçirmez': 'Evet',
      'Hassas Gözler': 'Uygun',
      'İçerik': 'Kolajen'
    },
    tags: ['makyaj', 'maskara', 'kirpik', 'göz'],
    isNew: false,
    isBestseller: true,
    isFeatured: false,
    createdAt: '2023-04-01',
    updatedAt: '2024-01-10'
  },
  {
    id: '12',
    name: 'Nivea Creme 400ml',
    description: 'Nivea Klasik Nemlendirici Krem 400ml. Yoğun nemlendirme, tüm cilt tipleri için.',
    price: 129,
    originalPrice: 179,
    discount: 28,
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800'
    ],
    category: 'kozmetik',
    subcategory: 'Cilt Bakımı',
    brand: 'Nivea',
    sku: 'NIV-CREME-400',
    stock: 500,
    rating: 4.8,
    reviewCount: 1234,
    features: {
      'Hacim': '400ml',
      'Cilt Tipi': 'Tüm cilt tipleri',
      'Kullanım': 'Yüz ve vücut',
      'İçerik': 'E vitamini',
      'Paraben': 'İçermez'
    },
    tags: ['krem', 'nemlendirici', 'cilt bakımı', 'vücut'],
    isNew: false,
    isBestseller: true,
    isFeatured: true,
    createdAt: '2023-01-01',
    updatedAt: '2024-01-20'
  },
  // SPOR
  {
    id: '13',
    name: 'Nike Yoga Matı',
    description: 'Nike Premium Yoga Matı 6mm. Kaymaz yüzey, ekstra yastıklama, taşıma askısı.',
    price: 599,
    originalPrice: 799,
    discount: 25,
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
      'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800'
    ],
    category: 'spor',
    subcategory: 'Fitness',
    brand: 'Nike',
    sku: 'NIKE-YOGA-001',
    stock: 78,
    rating: 4.6,
    reviewCount: 234,
    features: {
      'Kalınlık': '6mm',
      'Malzeme': 'TPE',
      'Boyut': '183cm x 61cm',
      'Ağırlık': '1.2kg',
      'Taşıma Askısı': 'Var'
    },
    tags: ['yoga', 'fitness', 'mat', 'spor'],
    isNew: false,
    isBestseller: true,
    isFeatured: false,
    createdAt: '2023-06-01',
    updatedAt: '2024-01-15'
  },
  {
    id: '14',
    name: 'Adidas Dambıl Seti',
    description: 'Adidas Ayarlanabilir Dambıl Seti 2.5-25kg. Hızlı ağırlık ayarı, ergonomik tutuş.',
    price: 2499,
    originalPrice: 3299,
    discount: 24,
    images: [
      'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800'
    ],
    category: 'spor',
    subcategory: 'Fitness',
    brand: 'Adidas',
    sku: 'ADS-DUMB-SET',
    stock: 23,
    rating: 4.7,
    reviewCount: 156,
    features: {
      'Ağırlık Aralığı': '2.5-25kg',
      'Ağırlık Artışı': '2.5kg',
      'Malzeme': 'Dökme demir',
      'Kaplama': 'Krom',
      'Garanti': '2 yıl'
    },
    tags: ['dambıl', 'fitness', 'ağırlık', 'spor'],
    isNew: true,
    isBestseller: false,
    isFeatured: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10'
  },
  // KITAP
  {
    id: '15',
    name: 'Atomic Habits - James Clear',
    description: 'James Clear\'ın çok satan kitabı Atomic Habits. Küçük değişikliklerle büyük sonuçlar elde edin.',
    price: 189,
    originalPrice: 249,
    discount: 24,
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800'
    ],
    category: 'kitap',
    subcategory: 'Kişisel Gelişim',
    brand: 'Penguin',
    sku: 'BK-ATOMIC-001',
    stock: 150,
    rating: 4.9,
    reviewCount: 2341,
    features: {
      'Sayfa': '320',
      'Dil': 'İngilizce',
      'Cilt': 'Karton kapak',
      'Yayınevi': 'Penguin',
      'ISBN': '978-0735211292'
    },
    tags: ['kitap', 'kişisel gelişim', 'alışkanlık', 'başarı'],
    isNew: false,
    isBestseller: true,
    isFeatured: true,
    createdAt: '2023-01-01',
    updatedAt: '2024-01-20'
  },
  {
    id: '16',
    name: '1984 - George Orwell',
    description: 'George Orwell\'ın klasik distopyası 1984. Totaliter rejim eleştirisi, zamansız bir başyapıt.',
    price: 89,
    originalPrice: 129,
    discount: 31,
    images: [
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800',
      'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800'
    ],
    category: 'kitap',
    subcategory: 'Roman',
    brand: 'Can Yayınları',
    sku: 'BK-1984-001',
    stock: 300,
    rating: 4.8,
    reviewCount: 3456,
    features: {
      'Sayfa': '352',
      'Dil': 'Türkçe',
      'Cilt': 'Karton kapak',
      'Yayınevi': 'Can Yayınları',
      'ISBN': '978-975-510-102-6'
    },
    tags: ['kitap', 'roman', 'klasik', 'distopya'],
    isNew: false,
    isBestseller: true,
    isFeatured: true,
    createdAt: '2023-01-01',
    updatedAt: '2024-01-15'
  },
  // OYUNCAK
  {
    id: '17',
    name: 'Lego Star Wars X-Wing',
    description: 'Lego Star Wars X-Wing Starfighter 75301. 474 parça, 4+ yaş, Luke Skywalker minifigür.',
    price: 899,
    originalPrice: 1199,
    discount: 25,
    images: [
      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800',
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800'
    ],
    category: 'oyuncak',
    subcategory: 'Lego',
    brand: 'Lego',
    sku: 'LEGO-XWING-001',
    stock: 45,
    rating: 4.9,
    reviewCount: 567,
    features: {
      'Parça Sayısı': '474',
      'Yaş Aralığı': '9+',
      'Figür': 'Luke Skywalker',
      'Boyut': '31cm x 27cm',
      'Seri': 'Star Wars'
    },
    tags: ['lego', 'oyuncak', 'star wars', 'yapı'],
    isNew: false,
    isBestseller: true,
    isFeatured: true,
    createdAt: '2023-05-01',
    updatedAt: '2024-01-10'
  },
  {
    id: '18',
    name: 'Hasbro Monopoly Klasik',
    description: 'Hasbro Monopoly Klasik Türkçe versiyon. Aile oyunu, 2-8 oyuncu, 8+ yaş.',
    price: 449,
    originalPrice: 599,
    discount: 25,
    images: [
      'https://images.unsplash.com/photo-1610890716171-6b1c9f2bd40c?w=800',
      'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800'
    ],
    category: 'oyuncak',
    subcategory: 'Oyun',
    brand: 'Hasbro',
    sku: 'HAS-MONO-001',
    stock: 89,
    rating: 4.7,
    reviewCount: 1234,
    features: {
      'Oyuncu Sayısı': '2-8',
      'Yaş Aralığı': '8+',
      'Oyun Süresi': '60-180 dk',
      'Dil': 'Türkçe',
      'İçerik': 'Tahta, pul, kart, ev/hotel'
    },
    tags: ['oyun', 'monopoly', 'aile', 'strateji'],
    isNew: false,
    isBestseller: true,
    isFeatured: false,
    createdAt: '2023-01-01',
    updatedAt: '2024-01-20'
  },
  // SUPERMARKET
  {
    id: '19',
    name: 'Nescafe Gold 200gr',
    description: 'Nescafe Gold Eko Paket 200gr. Premium çözünebilir kahve, zengin aroma.',
    price: 189,
    originalPrice: 249,
    discount: 24,
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800'
    ],
    category: 'supermarket',
    subcategory: 'İçecek',
    brand: 'Nescafe',
    sku: 'NES-GOLD-200',
    stock: 500,
    rating: 4.6,
    reviewCount: 892,
    features: {
      'Ağırlık': '200gr',
      'Tip': 'Çözünebilir',
      'Kafein': 'Yüksek',
      'Ambalaj': 'Kavanoz',
      'Raf Ömrü': '24 ay'
    },
    tags: ['kahve', 'içecek', 'nescafe', 'kahvaltı'],
    isNew: false,
    isBestseller: true,
    isFeatured: false,
    createdAt: '2023-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: '20',
    name: 'Persil Matik 6kg',
    description: 'Persil Matik Toz Deterjan 6kg. Derinlemesine temizlik, parlaklık koruma.',
    price: 349,
    originalPrice: 449,
    discount: 22,
    images: [
      'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800'
    ],
    category: 'supermarket',
    subcategory: 'Temizlik',
    brand: 'Persil',
    sku: 'PER-MATIK-6KG',
    stock: 200,
    rating: 4.5,
    reviewCount: 567,
    features: {
      'Ağırlık': '6kg',
      'Tip': 'Toz deterjan',
      'Kullanım': 'Beyaz ve renkli',
      'Parfüm': 'Taze çiçek',
      'Yıkama': '90 yıkama'
    },
    tags: ['deterjan', 'temizlik', 'çamaşır', 'ev'],
    isNew: false,
    isBestseller: true,
    isFeatured: false,
    createdAt: '2023-01-01',
    updatedAt: '2024-01-20'
  }
];

export const mockUser: User = {
  id: 'u1',
  email: 'test@example.com',
  name: 'Test Kullanıcı',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  phone: '+90 555 123 4567',
  address: [
    {
      id: 'a1',
      title: 'Ev',
      fullName: 'Ahmet Yılmaz',
      phone: '+90 555 123 4567',
      city: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Moda',
      addressLine: 'Moda Caddesi No:123 D:5',
      zipCode: '34710',
      isDefault: true
    }
  ],
  createdAt: '2024-01-01',
  role: 'user'
};

export const mockAdminUser: User = {
  id: 'admin1',
  email: 'admin@shoporange.com',
  name: 'Admin Kullanıcı',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  phone: '+90 555 999 8888',
  createdAt: '2024-01-01',
  role: 'admin'
};

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    userId: 'u1',
    items: [
      {
        productId: '1',
        productName: 'iPhone 15 Pro Max',
        productImage: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=200',
        quantity: 1,
        unitPrice: 74999,
        totalPrice: 74999
      }
    ],
    totalAmount: 74999,
    shippingCost: 0,
    discountAmount: 0,
    finalAmount: 74999,
    status: 'delivered',
    paymentStatus: 'completed',
    paymentMethod: 'Kredi Kartı',
    shippingAddress: {
      id: 'a1',
      title: 'Ev',
      fullName: 'Ahmet Yılmaz',
      phone: '+90 555 123 4567',
      city: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Moda',
      addressLine: 'Moda Caddesi No:123 D:5',
      zipCode: '34710',
      isDefault: true
    },
    createdAt: '2024-01-15',
    updatedAt: '2024-01-18',
    trackingNumber: 'TRK123456789'
  }
];

export const shippingOptions = [
  {
    id: 'standard',
    name: 'Standart Kargo',
    description: '3-5 iş günü içinde teslimat',
    price: 49,
    estimatedDays: '3-5 gün'
  },
  {
    id: 'express',
    name: 'Express Kargo',
    description: '1-2 iş günü içinde teslimat',
    price: 99,
    estimatedDays: '1-2 gün'
  },
  {
    id: 'free',
    name: 'Ücretsiz Kargo',
    description: '500₺ üzeri siparişlerde geçerli',
    price: 0,
    estimatedDays: '5-7 gün'
  }
];

export const getProductsByCategory = (category: Category) => {
  return products.filter(p => p.category === category);
};

export const getFeaturedProducts = () => {
  return products.filter(p => p.isFeatured);
};

export const getNewProducts = () => {
  return products.filter(p => p.isNew);
};

export const getBestsellerProducts = () => {
  return products.filter(p => p.isBestseller);
};

export const getDiscountedProducts = () => {
  return products.filter(p => p.discount && p.discount > 0);
};

export const getProductById = (id: string) => {
  return products.find(p => p.id === id);
};

// Simple mock orders for admin panel (with customer field)
export const adminMockOrders = [
  {
    id: 'ORD-2024-001',
    customer: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    total: 74999,
    status: 'completed',
    date: '2024-03-15',
    items: [{ productId: '1', name: 'iPhone 15 Pro Max', quantity: 1, price: 74999 }],
    shippingAddress: { city: 'İstanbul', district: 'Kadıköy' }
  },
  {
    id: 'ORD-2024-002',
    customer: 'Ayşe Demir',
    email: 'ayse@example.com',
    total: 12999,
    status: 'processing',
    date: '2024-03-15',
    items: [{ productId: '4', name: 'Sony WH-1000XM5', quantity: 1, price: 12999 }],
    shippingAddress: { city: 'Ankara', district: 'Çankaya' }
  },
  {
    id: 'ORD-2024-003',
    customer: 'Mehmet Kaya',
    email: 'mehmet@example.com',
    total: 3499,
    status: 'pending',
    date: '2024-03-14',
    items: [{ productId: '5', name: 'Nike Air Max 90', quantity: 1, price: 3499 }],
    shippingAddress: { city: 'İzmir', district: 'Konak' }
  },
  {
    id: 'ORD-2024-004',
    customer: 'Zeynep Şahin',
    email: 'zeynep@example.com',
    total: 89999,
    status: 'shipped',
    date: '2024-03-14',
    items: [{ productId: '3', name: 'MacBook Pro 14" M3', quantity: 1, price: 89999 }],
    shippingAddress: { city: 'İstanbul', district: 'Beşiktaş' }
  },
  {
    id: 'ORD-2024-005',
    customer: 'Can Özdemir',
    email: 'can@example.com',
    total: 59999,
    status: 'completed',
    date: '2024-03-13',
    items: [{ productId: '2', name: 'Samsung Galaxy S24 Ultra', quantity: 1, price: 59999 }],
    shippingAddress: { city: 'Bursa', district: 'Nilüfer' }
  },
  {
    id: 'ORD-2024-006',
    customer: 'Elif Yıldız',
    email: 'elif@example.com',
    total: 2499,
    status: 'cancelled',
    date: '2024-03-13',
    items: [{ productId: '6', name: 'Zara Kadın Trençkot', quantity: 1, price: 2499 }],
    shippingAddress: { city: 'Antalya', district: 'Muratpaşa' }
  },
  {
    id: 'ORD-2024-007',
    customer: 'Burak Aydın',
    email: 'burak@example.com',
    total: 12999,
    status: 'pending',
    date: '2024-03-12',
    items: [{ productId: '7', name: 'IKEA KIVIK Kanepe', quantity: 1, price: 12999 }],
    shippingAddress: { city: 'Adana', district: 'Seyhan' }
  }
];

// Mock Users for Admin Panel
export const mockUsers = [
  {
    id: 'u1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '0532 123 4567',
    role: 'user',
    createdAt: '2024-01-15',
    orders: 5
  },
  {
    id: 'u2',
    name: 'Ayşe Demir',
    email: 'ayse@example.com',
    phone: '0533 234 5678',
    role: 'user',
    createdAt: '2024-02-01',
    orders: 3
  },
  {
    id: 'u3',
    name: 'Mehmet Kaya',
    email: 'mehmet@example.com',
    phone: '0534 345 6789',
    role: 'user',
    createdAt: '2024-02-10',
    orders: 8
  },
  {
    id: 'u4',
    name: 'Zeynep Şahin',
    email: 'zeynep@example.com',
    phone: '0535 456 7890',
    role: 'user',
    createdAt: '2024-02-20',
    orders: 2
  },
  {
    id: 'u5',
    name: 'Can Özdemir',
    email: 'can@example.com',
    phone: '0536 567 8901',
    role: 'user',
    createdAt: '2024-03-01',
    orders: 1
  },
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@shoporange.com',
    phone: '0850 123 4567',
    role: 'admin',
    createdAt: '2023-12-01',
    orders: 0
  }
];
