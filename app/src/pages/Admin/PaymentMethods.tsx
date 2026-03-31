import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Truck, 
  Building, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit2,
  Loader2,
  ShieldCheck,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { paymentMethodsAdminApi, type PaymentMethod, type TestConnectionResult } from '@/services/paymentMethodsApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'truck': return Truck;
    case 'building-bank': return Building;
    case 'credit-card': return CreditCard;
    default: return CreditCard;
  }
};

export function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await paymentMethodsAdminApi.getAll();
      setMethods(data);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Ödeme yöntemleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      console.log('Seeding payment methods...');
      await paymentMethodsAdminApi.seed();
      toast.success('Varsayılan ödeme yöntemleri oluşturuldu');
      await loadMethods();
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Oluşturulamadı');
    } finally {
      setSeeding(false);
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      if (!method.isActive && !method.apiKeyConfigured && method.code !== 'cash_on_delivery' && method.code !== 'bank_transfer') {
        toast.error('API anahtarı yapılandırılmamış!');
        return;
      }

      await paymentMethodsAdminApi.update(method.id, { 
        isActive: !method.isActive 
      });
      
      toast.success(method.isActive ? 'Pasif yapıldı' : 'Aktif yapıldı');
      await loadMethods();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleToggleTestMode = async (method: PaymentMethod) => {
    try {
      await paymentMethodsAdminApi.update(method.id, { 
        isTestMode: !method.isTestMode 
      });
      
      toast.success(method.isTestMode ? 'Canlı moda geçildi' : 'Test moduna geçildi');
      await loadMethods();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleTestConnection = async (method: PaymentMethod) => {
    try {
      setTestingId(method.id);
      const result = await paymentMethodsAdminApi.testConnection(method.id);
      setTestResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Bağlantı testi yapılamadı');
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMethod) return;

    try {
      await paymentMethodsAdminApi.update(editingMethod.id, {
        displayName: editingMethod.displayName,
        description: editingMethod.description,
        sortOrder: editingMethod.sortOrder,
        minAmount: editingMethod.minAmount,
        maxAmount: editingMethod.maxAmount,
        maxInstallment: editingMethod.maxInstallment,
        config: editingMethod.config,
      });
      
      toast.success('Güncellendi');
      setEditingMethod(null);
      await loadMethods();
    } catch (error) {
      toast.error('Güncellenemedi');
    }
  };

  const activeCount = methods.filter(m => m.isActive).length;
  const configuredCount = methods.filter(m => m.apiKeyConfigured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ödeme Yöntemleri</h1>
          <p className="text-muted-foreground">
            Ödeme altyapısını yapılandırın ve yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Varsayılanları Yükle
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktif Yöntem</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Yapılandırılmış</p>
              <p className="text-2xl font-bold">{configuredCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Test Modunda</p>
              <p className="text-2xl font-bold">{methods.filter(m => m.isTestMode && m.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Güvenlik Uyarısı */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800">Güvenlik Bilgisi</h3>
          <p className="text-sm text-blue-700">
            API anahtarları AWS Secrets Manager'da güvenle saklanır. Admin panelinde görünmezler.
          </p>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Yöntem</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Mod</th>
                <th className="px-4 py-3 text-left text-sm font-medium">API Key</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Limitler</th>
                <th className="px-4 py-3 text-right text-sm font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : methods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Henüz ödeme yöntemi yok. "Varsayılanları Yükle" butonuna tıklayın.
                  </td>
                </tr>
              ) : (
                methods.map((method) => {
                  const Icon = getIcon(method.icon);
                  return (
                    <tr key={method.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-xs text-muted-foreground">{method.displayName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={method.isActive}
                            onChange={() => handleToggleActive(method)}
                            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <Badge className={method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {method.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {method.code !== 'cash_on_delivery' && method.code !== 'bank_transfer' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={method.isTestMode}
                              onChange={() => handleToggleTestMode(method)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              {method.isTestMode ? 'Test' : 'Canlı'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {method.code === 'cash_on_delivery' || method.code === 'bank_transfer' ? (
                          <span className="text-sm text-muted-foreground">-</span>
                        ) : method.apiKeyConfigured ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Yapılandırılmış</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Eksik</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {method.minAmount || 0} - {method.maxAmount || '∞'} {method.supportedCurrencies?.[0]}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {method.code !== 'cash_on_delivery' && method.code !== 'bank_transfer' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestConnection(method)}
                              disabled={testingId === method.id}
                            >
                              {testingId === method.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              Test
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMethod(method)}
                          >
                            <Edit2 className="h-4 w-4" />
                            Düzenle
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Düzenleme Modal */}
      <Dialog open={!!editingMethod} onOpenChange={() => setEditingMethod(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ödeme Yöntemi Düzenle</DialogTitle>
            <DialogDescription>
              {editingMethod?.name} ayarlarını güncelleyin
            </DialogDescription>
          </DialogHeader>
          
          {editingMethod && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Görünen Ad</Label>
                <Input
                  value={editingMethod.displayName}
                  onChange={(e) => setEditingMethod({ ...editingMethod, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <textarea
                  value={editingMethod.description}
                  onChange={(e) => setEditingMethod({ ...editingMethod, description: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min. Tutar</Label>
                  <Input
                    type="number"
                    value={editingMethod.minAmount || 0}
                    onChange={(e) => setEditingMethod({ ...editingMethod, minAmount: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max. Tutar</Label>
                  <Input
                    type="number"
                    value={editingMethod.maxAmount || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, maxAmount: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMethod(null)}>
              İptal
            </Button>
            <Button onClick={handleSaveEdit}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Sonucu Modal */}
      <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={testResult?.success ? 'text-green-600' : 'text-red-600'}>
              {testResult?.success ? 'Bağlantı Başarılı' : 'Bağlantı Başarısız'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">{testResult?.message}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setTestResult(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
