/**
 * Admin — A/B Test Yönetimi
 * ==========================
 * Aktif GrowthBook testlerini görüntüle, varyasyonları izle,
 * test tanımlamalarını yönet.
 * 
 * NOT: Test sonuçlarını (conversion rate, AOV vb.) görmek için
 * GrowthBook Dashboard'u kullanın: https://app.growthbook.io
 */

import { useState } from 'react';
import { 
  FlaskConical, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer,
  ShoppingCart,
  ArrowRight,
  BarChart3,
  Target,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ACTIVE_TESTS, getTestResults, type TestDefinition } from '@/lib/growthbook';

// =============================================================================
// METRIC BADGE
// =============================================================================

function MetricBadge({ metric }: { metric: string }) {
  const icons: Record<string, React.ReactNode> = {
    clickthrough_rate: <Eye className="h-3 w-3" />,
    conversion_rate: <ShoppingCart className="h-3 w-3" />,
    add_to_cart_rate: <MousePointer className="h-3 w-3" />,
    checkout_completion_rate: <CheckCircle2 className="h-3 w-3" />,
    cart_abandonment_rate: <AlertCircle className="h-3 w-3" />,
    average_order_value: <TrendingUp className="h-3 w-3" />,
    time_on_page: <Eye className="h-3 w-3" />,
    cart_recovery_rate: <ShoppingCart className="h-3 w-3" />,
  };

  const labels: Record<string, string> = {
    clickthrough_rate: 'Tıklama Oranı',
    conversion_rate: 'Dönüşüm Oranı',
    add_to_cart_rate: 'Sepete Ekleme Oranı',
    checkout_completion_rate: 'Ödeme Tamamlama',
    cart_abandonment_rate: 'Sepet Terk Oranı',
    average_order_value: 'Ort. Sipariş Değeri',
    time_on_page: 'Sayfada Kalma Süresi',
    cart_recovery_rate: 'Sepet Kurtarma',
  };

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
      {icons[metric] || <BarChart3 className="h-3 w-3" />}
      <span>{labels[metric] || metric}</span>
    </div>
  );
}

// =============================================================================
// VARIANT CARD
// =============================================================================

function VariantCard({ 
  variant, 
  isActive,
  index 
}: { 
  variant: string; 
  isActive: boolean;
  index: number;
}) {
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-amber-500',
    'bg-pink-500',
  ];
  const bgColor = colors[index % colors.length];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      isActive 
        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
    }`}>
      <div className={`w-3 h-3 rounded-full ${isActive ? bgColor : 'bg-gray-300'}`} />
      <span className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
        {variant}
      </span>
      {isActive && (
        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 ml-auto">
          Aktif
        </Badge>
      )}
    </div>
  );
}

// =============================================================================
// TEST CARD
// =============================================================================

function TestCard({ test, currentValue }: { test: TestDefinition; currentValue: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-base">{test.name}</CardTitle>
            </div>
            <CardDescription className="text-sm">
              {test.description}
            </CardDescription>
          </div>
          <Badge className="bg-green-500 text-white">Aktif</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Test ID */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <code className="bg-muted px-2 py-1 rounded font-mono">{test.id}</code>
        </div>

        {/* Variants */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Varyasyonlar
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {test.variants.map((variant, index) => (
              <VariantCard 
                key={variant} 
                variant={variant} 
                isActive={variant === currentValue}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Metrics */}
        {test.metrics && test.metrics.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ölçülen Metrikler
            </p>
            <div className="flex flex-wrap gap-2">
              {test.metrics.map((metric) => (
                <MetricBadge key={metric} metric={metric} />
              ))}
            </div>
          </div>
        )}

        {/* Target Pages */}
        {test.targetPages && test.targetPages.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Hedef Sayfalar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {test.targetPages.map((page) => (
                <Badge key={page} variant="secondary" className="text-xs">
                  {page}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Current Value Highlight */}
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Şu an bu cihazda görünen varyasyon:
            </span>
          </div>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
            {currentValue}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function ABTestsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const testResults = getTestResults();

  const stats = {
    total: ACTIVE_TESTS.length,
    active: ACTIVE_TESTS.length,
    completed: 0,
    totalVariants: ACTIVE_TESTS.reduce((sum, t) => sum + t.variants.length, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-orange-500" />
            A/B Test Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            GrowthBook üzerinden tanımlanan aktif testleri görüntüleyin ve yönetin.
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" asChild>
          <a 
            href="https://app.growthbook.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            GrowthBook Dashboard
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FlaskConical className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Toplam Test</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Aktif Test</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVariants}</p>
                <p className="text-xs text-muted-foreground">Toplam Varyasyon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Tamamlanan Test</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Aktif Testler ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Tamamlanan ({stats.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="grid gap-4">
            {testResults.map((test) => (
              <TestCard 
                key={test.id} 
                test={test} 
                currentValue={test.currentValue as string}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Henüz tamamlanan test yok
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Testler GrowthBook Dashboard'dan tamamlandı olarak işaretlendikçe burada görünecek.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Guide */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Hızlı Başlangıç Rehberi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded mt-0.5">1</span>
            <p>
              <strong>Yeni test oluşturun:</strong> GrowthBook Dashboard'a gidin, "Features" bölümünden "Add Feature" ile yeni bir test tanımlayın.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded mt-0.5">2</span>
            <p>
              <strong>Test kodunu ekleyin:</strong> <code>src/lib/growthbook.ts</code> dosyasındaki <code>ACTIVE_TESTS</code> dizisine test tanımını ekleyin.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded mt-0.5">3</span>
            <p>
              <strong>Bileşende kullanın:</strong> <code>useFeature('test_id')</code> hook'u ile test değerini okuyun ve render'ı buna göre değiştirin.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded mt-0.5">4</span>
            <p>
              <strong>Sonuçları izleyin:</strong> GrowthBook Dashboard'dan conversion rate, AOV ve diğer metrikleri gerçek zamanlı izleyin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
