import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Facebook, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const navigate = useNavigate();
  const { login, register, socialLogin, isLoading } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({ email: loginEmail, password: loginPassword });
    if (success) {
      toast.success('Giriş başarılı!');
      onOpenChange(false);
      navigate('/');
    } else {
      toast.error('Giriş başarısız. Bilgilerinizi kontrol edin.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerPasswordConfirm) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    
    if (!agreeTerms) {
      toast.error('Kullanım koşullarını kabul etmelisiniz');
      return;
    }
    
    const success = await register({
      name: registerName,
      email: registerEmail,
      phone: registerPhone,
      password: registerPassword
    });
    
    if (success) {
      toast.success('Kayıt başarılı! Hoş geldiniz.');
      onOpenChange(false);
      navigate('/');
    } else {
      toast.error('Kayıt başarısız. Lütfen tekrar deneyin.');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    const success = await socialLogin(provider);
    if (success) {
      toast.success(`${provider === 'google' ? 'Google' : 'Facebook'} ile giriş başarılı!`);
      onOpenChange(false);
      navigate('/');
    } else {
      toast.error('Sosyal medya girişi başarısız');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            <span className="text-gradient">Shop</span>
            <span className="text-orange-600">Orange</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-muted-foreground">Beni hatırla</span>
                </label>
                <button type="button" className="text-orange-600 hover:underline">
                  Şifremi unuttum
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-orange h-11"
                disabled={isLoading}
              >
                {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">veya şununla devam et</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <Chrome className="h-5 w-5 mr-2 text-red-500" />
                Google
              </Button>
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

            <p className="text-center text-sm text-muted-foreground">
              Hesabınız yok mu?{' '}
              <button 
                onClick={() => setActiveTab('register')}
                className="text-orange-600 font-medium hover:underline"
              >
                Kayıt olun
              </button>
            </p>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Ad Soyad</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-phone">Telefon (İsteğe bağlı)</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password-confirm">Şifre Tekrar</Label>
                <Input
                  id="register-password-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  required
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 mt-1"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className="text-sm text-muted-foreground">
                  <button type="button" className="text-orange-600 hover:underline">Kullanım Koşulları</button>'nı ve{' '}
                  <button type="button" className="text-orange-600 hover:underline">Gizlilik Politikası</button>'nı okudum ve kabul ediyorum.
                </span>
              </label>

              <Button 
                type="submit" 
                className="w-full gradient-orange h-11"
                disabled={isLoading}
              >
                {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">veya şununla kaydol</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <Chrome className="h-5 w-5 mr-2 text-red-500" />
                Google
              </Button>
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

            <p className="text-center text-sm text-muted-foreground">
              Zaten hesabınız var mı?{' '}
              <button 
                onClick={() => setActiveTab('login')}
                className="text-orange-600 font-medium hover:underline"
              >
                Giriş yapın
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
