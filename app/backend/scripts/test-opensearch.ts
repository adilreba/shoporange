import {
  initProductIndex,
  indexProduct,
  bulkIndexProducts,
  searchProducts,
  suggestProducts,
  deleteProductIndex,
} from '../src/utils/search';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== OpenSearch Testleri Başlıyor ===\n');

  // 1. Bağlantı Testi
  console.log('1. Bağlantı testi...');
  if (!process.env.OPENSEARCH_URL) {
    console.log('   ⚠️  OPENSEARCH_URL tanımlı değil. Test atlanıyor.');
    console.log('   💡 Docker başlat:');
    console.log('      docker run -d --name atus-opensearch -p 9200:9200 \\\n        -e "discovery.type=single-node" \\\n        -e "DISABLE_SECURITY_PLUGIN=true" \\\n        opensearchproject/opensearch:2\n');
    console.log('   💡 .env ekle: OPENSEARCH_URL=http://localhost:9200\n');
    return;
  }
  console.log('   ✅ OPENSEARCH_URL tanımlı:', process.env.OPENSEARCH_URL);

  // 2. Index Init Testi
  console.log('\n2. Index init testi...');
  await initProductIndex();
  console.log('   ✅ Index init çağrıldı');

  await sleep(1000);

  // 3. Index Product Testi
  console.log('\n3. Tekil ürün index testi...');
  await indexProduct({
    id: 'test-prod-1',
    name: 'Test Ürünü',
    description: 'Bu bir test ürünüdür',
    brand: 'TestBrand',
    category: 'Elektronik',
    price: 199.99,
    status: 'active',
  });
  console.log('   ✅ Tekil ürün indexlendi');

  await sleep(1000);

  // 4. Bulk Index Testi
  console.log('\n4. Toplu ürün index testi...');
  await bulkIndexProducts([
    { id: 'test-prod-2', name: 'Akıllı Telefon', description: '5G destekli', brand: 'Samsung', category: 'Elektronik', price: 12999, status: 'active' },
    { id: 'test-prod-3', name: 'Laptop Bilgisayar', description: 'İşlemci: i7', brand: 'Lenovo', category: 'Elektronik', price: 24999, status: 'active' },
    { id: 'test-prod-4', name: 'Kablosuz Kulaklık', description: 'Aktif gürültü engelleme', brand: 'Sony', category: 'Elektronik', price: 4999, status: 'active' },
  ]);
  console.log('   ✅ Toplu ürün indexlendi');

  await sleep(2000);

  // 5. Search Testi
  console.log('\n5. Arama testi...');
  const searchResult = await searchProducts({ query: 'telefon', size: 10 });
  console.log(`   ✅ Arama sonucu: ${searchResult.total} ürün bulundu (${searchResult.took}ms)`);
  searchResult.products.forEach((p) => {
    console.log(`      - ${p.name} (${p.brand}) - ${p.price}₺`);
  });

  // 6. Category Filter Testi
  console.log('\n6. Kategori filtresi testi...');
  const catResult = await searchProducts({ query: 'bilgisayar', category: 'Elektronik', size: 10 });
  console.log(`   ✅ Filtreli arama: ${catResult.total} ürün bulundu`);

  // 7. Price Filter Testi
  console.log('\n7. Fiyat filtresi testi...');
  const priceResult = await searchProducts({ query: 'elektronik', minPrice: 1000, maxPrice: 15000, size: 10 });
  console.log(`   ✅ Fiyat filtresi: ${priceResult.total} ürün bulundu`);

  // 8. Suggest Testi
  console.log('\n8. Autocomplete testi...');
  const suggestions = await suggestProducts('Akl', 5);
  console.log(`   ✅ Öneriler: ${suggestions.join(', ')}`);

  // 9. Delete Test
  console.log('\n9. Index silme testi...');
  await deleteProductIndex('test-prod-1');
  console.log('   ✅ test-prod-1 indexten silindi');

  console.log('\n=== OpenSearch Testleri Tamamlandı ===');
}

runTests().catch(console.error);
