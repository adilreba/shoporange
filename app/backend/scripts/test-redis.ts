import {
  cacheSet,
  cacheGet,
  cacheDel,
  checkRateLimit,
  saveSession,
  getSession,
  deleteSession,
  closeRedis,
} from '../src/utils/redis';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== Redis Testleri Başlıyor ===\n');

  // 1. Bağlantı Testi
  console.log('1. Bağlantı testi...');
  if (!process.env.REDIS_URL) {
    console.log('   ⚠️  REDIS_URL tanımlı değil. Test atlanıyor.');
    console.log('   💡 Docker başlat: docker run -d --name atus-redis -p 6379:6379 redis:7-alpine');
    console.log('   💡 .env ekle: REDIS_URL=redis://localhost:6379\n');
    return;
  }
  console.log('   ✅ REDIS_URL tanımlı:', process.env.REDIS_URL);

  // 2. Cache Set/Get Testi
  console.log('\n2. Cache Set/Get testi...');
  await cacheSet('test:key', { foo: 'bar', num: 42 }, 60);
  const cached = await cacheGet<{ foo: string; num: number }>('test:key');
  if (cached?.foo === 'bar' && cached?.num === 42) {
    console.log('   ✅ Cache set/get çalışıyor');
  } else {
    console.log('   ❌ Cache set/get BAŞARISIZ', cached);
  }

  // 3. Cache Del Testi
  console.log('\n3. Cache Del testi...');
  await cacheDel('test:key');
  const deleted = await cacheGet('test:key');
  if (deleted === null) {
    console.log('   ✅ Cache del çalışıyor');
  } else {
    console.log('   ❌ Cache del BAŞARISIZ', deleted);
  }

  // 4. Rate Limit Testi
  console.log('\n4. Rate Limit testi...');
  const key = 'test:ratelimit:ip1';
  let passed = 0;
  for (let i = 0; i < 12; i++) {
    const result = await checkRateLimit(key, 10, 60);
    if (result.allowed) passed++;
  }
  console.log(`   ${passed <= 10 ? '✅' : '❌'} Rate limit: ${passed}/12 istek izin verildi (limit: 10)`);

  // 5. Session Testi
  console.log('\n5. Session testi...');
  await saveSession('test:session:abc', { userId: '123', email: 'test@example.com' }, 60);
  const session = await getSession('test:session:abc');
  if (session?.userId === '123') {
    console.log('   ✅ Session save/get çalışıyor');
  } else {
    console.log('   ❌ Session save/get BAŞARISIZ', session);
  }

  await deleteSession('test:session:abc');
  const deletedSession = await getSession('test:session:abc');
  if (deletedSession === null) {
    console.log('   ✅ Session delete çalışıyor');
  } else {
    console.log('   ❌ Session delete BAŞARISIZ', deletedSession);
  }

  await closeRedis();
  console.log('\n=== Redis Testleri Tamamlandı ===');
}

runTests().catch(console.error);
