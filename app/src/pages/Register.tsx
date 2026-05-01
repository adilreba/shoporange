import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Facebook, User, Phone, Check } from 'lucide-react';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function Register() {
  const navigate = useNavigate();
  const { register, socialLogin, isLoading, error, clearError, needsVerification } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Form validasyonu
    if (!formData.name.trim()) {
      toast.error('Ad soyad girin');
      return;
    }
    if (formData.name.trim().length < 3) {
      toast.error('Ad soyad en az 3 karakter olmalı');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('E-posta adresi girin');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Telefon numarası girin');
      return;
    }
    const cleanedPhone = formData.phone.replace(/\s+/g, '').replace(/[()-]/g, '');
    const e164Phone = cleanedPhone.startsWith('+')
      ? cleanedPhone
      : cleanedPhone.startsWith('0')
      ? `+9${cleanedPhone}`
      : `+90${cleanedPhone}`;
    if (!e164Phone.startsWith('+90')) {
      toast.error('Sadece Türkiye cep telefon numaraları kabul edilmektedir.');
      return;
    }
    const national = e164Phone.replace('+90', '');
    if (!/^5[0-9]{9}$/.test(national)) {
      toast.error('Geçerli bir Türkiye cep telefon numarası giriniz. Örn: 05XX XXX XX XX');
      return;
    }
    
    if (!formData.password.trim()) {
      toast.error('Şifre girin');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }
    
    if (formData.password !== formData.passwordConfirm) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    
    if (!agreeTerms) {
      toast.error('Kullanım koşullarını kabul etmelisiniz');
      return;
    }
    
    const success = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      marketingConsent
    });
    
    if (success) {
      if (needsVerification) {
        toast.success('Kayıt başarılı! Lütfen e-postanıza gönderilen doğrulama kodunu girin.');
        navigate('/verify-email', { state: { email: formData.email } });
      } else {
        toast.success('Kayıt başarılı! Hoş geldiniz.');
        navigate('/');
      }
    } else {
      toast.error(error || 'Kayıt başarısız. Lütfen tekrar deneyin.');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    const success = await socialLogin(provider);
    if (success) {
      toast.success(`${provider === 'google' ? 'Google' : 'Facebook'} ile kayıt başarılı!`);
      navigate('/');
    } else {
      toast.error('Sosyal medya kaydı başarısız');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <SEO 
        title="Kayıt Ol - AtusHome"
        description="AtusHome'a üye olun. Hızlı teslimat, güvenli ödeme ve özel kampanyalardan yararlanın."
        noindex
      />
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-custom py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl shadow-soft p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-gradient">Atus</span>
                <span className="text-orange-600">Home</span>
              </h1>
              <p className="text-muted-foreground">Yeni hesap oluşturun</p>
            </div>

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <GoogleLoginButton />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
              >
                <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                Facebook
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">veya e-posta ile kaydol</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error.includes('zaten kayıtlı') ? (
                  <div className="space-y-1">
                    <p>Bu e-posta adresi zaten kayıtlı.</p>
                    <div className="flex gap-3 text-xs">
                      <Link to="/login" className="underline hover:text-red-900 font-medium">Giriş yap</Link>
                      <Link to="/forgot-password" className="underline hover:text-red-900 font-medium">Şifremi unuttum</Link>
                    </div>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Ad Soyad *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-posta *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefon *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Şifre *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">En az 6 karakter</p>
              </div>

              <div>
                <Label htmlFor="passwordConfirm">Şifre Tekrar *</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="••••••••"
                  value={formData.passwordConfirm}
                  onChange={(e) => updateField('passwordConfirm', e.target.value)}
                  required
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox 
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                  className="mt-1"
                />
                <span className="text-sm text-muted-foreground">
                  <Link 
                    to="/pre-information" 
                    className="text-orange-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >Ön Bilgilendirme Formu</Link>,{' '}
                  <Link 
                    to="/distance-sales-contract" 
                    className="text-orange-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >Mesafeli Satış Sözleşmesi</Link>'ni ve{' '}
                  <Link 
                    to="/privacy" 
                    className="text-orange-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >Gizlilik Politikası</Link>'nı okudum ve kabul ediyorum.
                  <span className="text-xs text-gray-400 block mt-1">(Yeni sekmede açılır)</span>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox 
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                  className="mt-1"
                />
                <span className="text-sm text-muted-foreground">
                  Kampanya, indirim ve yeni ürünlerden haberdar olmak için elektronik iletişim izni veriyorum.
                  <span className="text-xs text-gray-400 block mt-1">(İsteğe bağlı)</span>
                </span>
              </label>

              <p className="text-xs text-muted-foreground">
                Doğrulama kodu telefon numaranıza SMS olarak gönderilecektir.
              </p>

              <Button 
                type="submit" 
                className="w-full gradient-orange h-11"
                disabled={isLoading}
              >
                {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
              </Button>
            </form>

            {/* Benefits */}
            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">Üye Olmanın Avantajları:</p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Hızlı ve kolay ödeme
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Sipariş takibi
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Özel indirimler ve kampanyalar
                </li>
              </ul>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="text-orange-600 font-medium hover:underline">
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
}
