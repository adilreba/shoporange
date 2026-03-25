import { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  Package,
  Settings,
  CreditCard,
  TestTube,
  Building2,
  MapPin,
  Copy,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  useShippingStore,
  shippingCompanyInfo,
  createShippingCompany,
  turkishCities,
  type ShippingCompanyType,
  type ShippingCompany,
} from '@/stores/shippingStore';

const shippingTypes: { value: ShippingCompanyType; label: string; icon: string }[] = [
  { value: 'yurtici', label: 'Yurtiçi Kargo', icon: '🚚' },
  { value: 'aras', label: 'Aras Kargo', icon: '📦' },
  { value: 'mng', label: 'MNG Kargo', icon: '🚛' },
  { value: 'ptt', label: 'PTT Kargo', icon: '🏤' },
  { value: 'surat', label: 'Sürat Kargo', icon: '⚡' },
  { value: 'trendyol', label: 'Trendyol Express', icon: '🛍️' },
  { value: 'hepsijet', label: 'HepsiJet', icon: '🚀' },
];

export default function ShippingSettings() {
  const { 
    companies, 
    addCompany, 
    updateCompany, 
    deleteCompany, 
    setDefaultCompany, 
    toggleActive,
    testConnection,
    duplicateCompany,
  } = useShippingStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ShippingCompany | null>(null);
  const [selectedType, setSelectedType] = useState<ShippingCompanyType>('yurtici');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ShippingCompany>>(
    createShippingCompany('yurtici')
  );

  // Şube bilgilerini grupla (aynı tip şubeleri bir arada göster)
  const groupedCompanies = companies.reduce((acc, company) => {
    if (!acc[company.type]) {
      acc[company.type] = [];
    }
    acc[company.type].push(company);
    return acc;
  }, {} as Record<ShippingCompanyType, ShippingCompany[]>);

  const handleAddNew = () => {
    setEditingCompany(null);
    setSelectedType('yurtici');
    setFormData(createShippingCompany('yurtici'));
    setIsAddModalOpen(true);
  };

  const handleEdit = (company: ShippingCompany) => {
    setEditingCompany(company);
    setSelectedType(company.type);
    setFormData({ ...company });
    setIsAddModalOpen(true);
  };

  const handleDuplicate = (company: ShippingCompany) => {
    // Şube bilgilerini boşaltarak kopyala
    duplicateCompany(company.id, {
      branchName: '',
      branchCity: '',
      branchDistrict: '',
      branchCode: '',
      branchPhone: '',
      branchAddress: '',
    });
    toast.success(`${company.name} şubesi kopyalandı. Yeni şube bilgilerini düzenleyin.`);
  };

  const handleDelete = (id: string, name: string, branchName: string) => {
    const displayName = branchName ? `${name} - ${branchName}` : name;
    if (window.confirm(`"${displayName}" şubesini silmek istediğinize emin misiniz?`)) {
      deleteCompany(id);
      toast.success('Kargo şubesi silindi');
    }
  };

  const handleTypeChange = (type: ShippingCompanyType) => {
    setSelectedType(type);
    setFormData(createShippingCompany(type));
  };

  const handleSave = () => {
    const info = shippingCompanyInfo[selectedType];
    
    // Validasyon
    const requiredFields = info.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => {
      const value = formData.credentials?.[f.key as keyof typeof formData.credentials];
      return !value || value === '';
    });

    if (missingFields.length > 0) {
      toast.error(`Lütfen zorunlu alanları doldurun: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    // Şube bilgileri validasyonu
    if (!formData.branchInfo?.branchName?.trim()) {
      toast.error('Şube adı zorunludur');
      return;
    }
    if (!formData.branchInfo?.branchCity?.trim()) {
      toast.error('Şehir bilgisi zorunludur');
      return;
    }
    if (!formData.branchInfo?.branchCode?.trim()) {
      toast.error('Şube kodu zorunludur');
      return;
    }

    if (editingCompany) {
      updateCompany(editingCompany.id, formData);
      toast.success('Kargo şubesi güncellendi');
    } else {
      addCompany(formData as Omit<ShippingCompany, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success('Yeni kargo şubesi eklendi');
    }

    setIsAddModalOpen(false);
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    const result = await testConnection(id);
    setTestingId(null);
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleSetDefault = (id: string, branchName: string) => {
    setDefaultCompany(id);
    toast.success(`"${branchName}" varsayılan şube olarak ayarlandı`);
  };

  const handleToggleActive = (id: string, isActive: boolean, branchName: string) => {
    toggleActive(id);
    toast.success(`"${branchName}" ${isActive ? 'devre dışı bırakıldı' : 'aktif edildi'}`);
  };

  const updateCredential = (key: string, value: string | boolean) => {
    setFormData((prev: Partial<ShippingCompany>) => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value,
      } as ShippingCompany['credentials'],
    }));
  };

  const updateBranchInfo = (key: string, value: string) => {
    setFormData((prev: Partial<ShippingCompany>) => ({
      ...prev,
      branchInfo: {
        ...prev.branchInfo,
        [key]: value,
      } as ShippingCompany['branchInfo'],
    }));
  };

  const updateSetting = (key: string, value: string | boolean | string[]) => {
    setFormData((prev: Partial<ShippingCompany>) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      } as ShippingCompany['settings'],
    }));
  };

  const toggleServiceCity = (city: string) => {
    const currentCities = formData.settings?.serviceCities || [];
    const newCities = currentCities.includes(city)
      ? currentCities.filter(c => c !== city)
      : [...currentCities, city];
    
    updateSetting('serviceCities', newCities);
  };

  const defaultCompany = companies.find(c => c.isDefault && c.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kargo Entegrasyonu</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Çok şubeli kargo yönetimi - Her depo için ayrı şube tanımlayın
          </p>
        </div>
        <Button onClick={handleAddNew} className="gradient-orange">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Şube Ekle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Şube</p>
                <p className="text-2xl font-bold mt-1">{companies.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Kargo Firması</p>
                <p className="text-2xl font-bold mt-1">{Object.keys(groupedCompanies).length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aktif Şube</p>
                <p className="text-2xl font-bold mt-1">
                  {companies.filter(c => c.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Varsayılan Şube</p>
                <p className="text-lg font-bold mt-1 truncate max-w-[150px]">
                  {defaultCompany?.branchInfo?.branchName || 'Ayarı Yok'}
                </p>
                {defaultCompany && (
                  <p className="text-xs text-gray-400">{defaultCompany.branchInfo.branchCity}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List - Grouped by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Kargo Şubeleri</CardTitle>
          <CardDescription>
            Her kargo firması için birden fazla şube ekleyebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Henüz kargo şubesi eklenmemiş
              </h3>
              <p className="text-gray-500 mb-4">
                Her depo için ayrı şube tanımlayarak yönetimi kolaylaştırın.
              </p>
              <Button onClick={handleAddNew} className="gradient-orange">
                <Plus className="w-4 h-4 mr-2" />
                İlk Şubeyi Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedCompanies).map(([type, typeCompanies]) => {
                const typeInfo = shippingCompanyInfo[type as ShippingCompanyType];
                const shippingType = shippingTypes.find(t => t.value === type);
                const isExpanded = expandedGroup === type;
                
                return (
                  <Collapsible 
                    key={type} 
                    open={isExpanded}
                    onOpenChange={() => setExpandedGroup(isExpanded ? null : type)}
                    className="border rounded-lg overflow-hidden"
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{shippingType?.icon}</span>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {typeInfo.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {typeCompanies.length} şube • {' '}
                              {typeCompanies.filter(c => c.isActive).length} aktif
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {typeCompanies.filter(c => c.isDefault).length > 0 ? 'Varsayılan Var' : 'Varsayılan Yok'}
                          </Badge>
                          {isExpanded ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="divide-y">
                        {typeCompanies.map((company) => {
                          const isTesting = testingId === company.id;
                          
                          return (
                            <div
                              key={company.id}
                              className={`p-4 transition-all ${
                                company.isDefault 
                                  ? 'bg-orange-50/30 dark:bg-orange-900/5' 
                                  : ''
                              } ${!company.isActive ? 'opacity-60' : ''}`}
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Branch Info */}
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg border flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-5 h-5 text-gray-400" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {company.branchInfo.branchName}
                                      </h4>
                                      {company.isDefault && (
                                        <Badge className="bg-orange-500">Varsayılan</Badge>
                                      )}
                                      {company.credentials.testMode && (
                                        <Badge variant="secondary">Test</Badge>
                                      )}
                                      {company.settings.isRegionalHub && (
                                        <Badge variant="outline" className="text-blue-600">Bölge Merkezi</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {company.branchInfo.branchCity}
                                        {company.branchInfo.branchDistrict && `, ${company.branchInfo.branchDistrict}`}
                                      </span>
                                      <span>•</span>
                                      <span className="font-mono">{company.branchInfo.branchCode}</span>
                                      {company.branchInfo.branchPhone && (
                                        <>
                                          <span>•</span>
                                          <span>{company.branchInfo.branchPhone}</span>
                                        </>
                                      )}
                                    </div>
                                    {company.settings.serviceCities.length > 0 && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        <Globe className="w-3 h-3 inline mr-1" />
                                        Hizmet: {company.settings.serviceCities.slice(0, 5).join(', ')}
                                        {company.settings.serviceCities.length > 5 && ` +${company.settings.serviceCities.length - 5} daha`}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {!company.isDefault && company.isActive && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSetDefault(company.id, company.branchInfo.branchName)}
                                    >
                                      Varsayılan Yap
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTestConnection(company.id)}
                                    disabled={isTesting}
                                  >
                                    {isTesting ? (
                                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                      <TestTube className="w-4 h-4 mr-1" />
                                    )}
                                    Test Et
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDuplicate(company)}
                                    title="Bu şubeyi kopyala"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleEdit(company)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    variant={company.isActive ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleToggleActive(company.id, company.isActive, company.branchInfo.branchName)}
                                  >
                                    {company.isActive ? (
                                      <><X className="w-4 h-4 mr-1" /> Pasif</>
                                    ) : (
                                      <><Check className="w-4 h-4 mr-1" /> Aktif</>
                                    )}
                                  </Button>

                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDelete(company.id, company.name, company.branchInfo.branchName)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Çok Şubeli Yapı</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Aynı kargo firması için farklı şehirlerdeki depolarınızı ayrı şubeler olarak tanımlayabilirsiniz. 
                  Örneğin: Yurtiçi Kargo - İstanbul Merkez, Yurtiçi Kargo - Ankara Şubesi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">Otomatik Atama</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  &quot;Hizmet Verilen Şehirler&quot; ayarını yaparak, siparişlerin otomatik olarak 
                  en yakın şubeden gönderilmesini sağlayabilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
            </DialogTitle>
            <DialogDescription>
              {editingCompany 
                ? 'Şube bilgilerini güncelleyin' 
                : 'Yeni bir kargo şubesi tanımlayın'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="branch" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="branch">
                <Building2 className="w-4 h-4 mr-2" />
                Şube Bilgileri
              </TabsTrigger>
              <TabsTrigger value="credentials">
                <CreditCard className="w-4 h-4 mr-2" />
                API Bilgileri
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Ayarlar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="branch" className="space-y-4 mt-4">
              {/* Company Type Selection */}
              {!editingCompany && (
                <div className="space-y-2">
                  <Label>Kargo Firması</Label>
                  <Select value={selectedType} onValueChange={(v) => handleTypeChange(v as ShippingCompanyType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Branch Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branchName">
                    Şube Adı <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="branchName"
                    value={formData.branchInfo?.branchName || ''}
                    onChange={(e) => updateBranchInfo('branchName', e.target.value)}
                    placeholder="Örn: Kadıköy Şubesi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchCode">
                    Şube Kodu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="branchCode"
                    value={formData.branchInfo?.branchCode || ''}
                    onChange={(e) => updateBranchInfo('branchCode', e.target.value)}
                    placeholder="Örn: 12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchCity">
                    Şehir <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.branchInfo?.branchCity || ''} 
                    onValueChange={(v) => updateBranchInfo('branchCity', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {turkishCities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchDistrict">İlçe</Label>
                  <Input
                    id="branchDistrict"
                    value={formData.branchInfo?.branchDistrict || ''}
                    onChange={(e) => updateBranchInfo('branchDistrict', e.target.value)}
                    placeholder="Örn: Kadıköy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchPhone">Şube Telefonu</Label>
                  <Input
                    id="branchPhone"
                    value={formData.branchInfo?.branchPhone || ''}
                    onChange={(e) => updateBranchInfo('branchPhone', e.target.value)}
                    placeholder="0216 123 45 67"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="branchAddress">Şube Adresi</Label>
                  <Input
                    id="branchAddress"
                    value={formData.branchInfo?.branchAddress || ''}
                    onChange={(e) => updateBranchInfo('branchAddress', e.target.value)}
                    placeholder="Tam adres..."
                  />
                </div>
              </div>

              <Separator />

              {/* Service Cities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Hizmet Verilen Şehirler</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateSetting('serviceCities', [...turkishCities])}
                      type="button"
                    >
                      Tümünü Seç
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateSetting('serviceCities', [])}
                      type="button"
                    >
                      Temizle
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Bu şubenin kargo gönderebileceği şehirleri seçin (boş bırakırsanız tüm Türkiye)
                </p>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {turkishCities.map((city) => (
                    <label key={city} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <Checkbox
                        checked={formData.settings?.serviceCities?.includes(city) || false}
                        onCheckedChange={() => toggleServiceCity(city)}
                      />
                      <span className="text-sm">{city}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                {shippingCompanyInfo[selectedType].description}
              </div>

              {/* API Fields */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">API Bilgileri</h4>
                
                {shippingCompanyInfo[selectedType].fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      value={(formData.credentials?.[field.key as keyof typeof formData.credentials] as string) || ''}
                      onChange={(e) => updateCredential(field.key, e.target.value)}
                      placeholder={`${field.label} girin`}
                    />
                    {field.hint && (
                      <p className="text-xs text-gray-500">{field.hint}</p>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="testMode" className="cursor-pointer">Test Modu</Label>
                  <p className="text-sm text-gray-500">
                    Test modunda gerçek kargo gönderimi yapılmaz
                  </p>
                </div>
                <Switch
                  id="testMode"
                  checked={formData.credentials?.testMode ?? true}
                  onCheckedChange={(checked) => updateCredential('testMode', checked)}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              {/* Print Format */}
              <div className="space-y-2">
                <Label>Barkod Yazdırma Formatı</Label>
                <Select 
                  value={formData.settings?.printFormat || 'a4'} 
                  onValueChange={(v) => updateSetting('printFormat', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4 Kağıt</SelectItem>
                    <SelectItem value="a5">A5 Kağıt</SelectItem>
                    <SelectItem value="thermal">Termal Yazıcı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tracking URL */}
              <div className="space-y-2">
                <Label>Kargo Takip URL</Label>
                <Input
                  value={formData.settings?.trackingUrl || ''}
                  onChange={(e) => updateSetting('trackingUrl', e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500">
                  {'{trackingNumber}'} değişkeni otomatik doldurulur
                </p>
              </div>

              <Separator />

              {/* Regional Hub Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isRegionalHub" className="cursor-pointer">Bölge Dağıtım Merkezi</Label>
                  <p className="text-sm text-gray-500">
                    Bu şube bir bölge merkeziyse işaretleyin (örn: İstanbul Avrupa Yakası Merkez)
                  </p>
                </div>
                <Switch
                  id="isRegionalHub"
                  checked={formData.settings?.isRegionalHub ?? false}
                  onCheckedChange={(checked) => updateSetting('isRegionalHub', checked)}
                />
              </div>

              <Separator />

              {/* Auto Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">Otomatik İşlemler</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoCreate" className="cursor-pointer">
                      Otomatik Kargo Oluştur
                    </Label>
                    <p className="text-sm text-gray-500">
                      Sipariş onaylandığında otomatik kargo gönderisi oluştur
                    </p>
                  </div>
                  <Switch
                    id="autoCreate"
                    checked={formData.settings?.autoCreateShipment ?? false}
                    onCheckedChange={(checked) => updateSetting('autoCreateShipment', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoSMS" className="cursor-pointer">
                      Otomatik SMS Gönder
                    </Label>
                    <p className="text-sm text-gray-500">
                      Kargo oluşturulduğunda müşteriye SMS gönder
                    </p>
                  </div>
                  <Switch
                    id="autoSMS"
                    checked={formData.settings?.autoSendSMS ?? false}
                    onCheckedChange={(checked) => updateSetting('autoSendSMS', checked)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} className="gradient-orange">
              {editingCompany ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
