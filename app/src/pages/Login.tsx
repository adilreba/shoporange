import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { useAuthStore } from '@/stores/authStore';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const { login, socialLogin, isLoading, error, clearError, needsVerification } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (needsVerification) {
      navigate('/verify-email');
    }
  }, [needsVerification, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Form validasyonu
    if (!email.trim()) {
      toast.error('E-posta adresi girin');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    if (!password.trim()) {
      toast.error('Şifre girin');
      return;
    }
    if (password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }
    
    const success = await login({ email, password });
    if (success) {
      toast.success('Giriş başarılı!');
      navigate('/');
    } else {
      toast.error(error || 'Giriş başarısız. Bilgilerinizi kontrol edin.');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    const success = await socialLogin(provider);
    if (success) {
      toast.success(`${provider === 'google' ? 'Google' : 'Facebook'} ile giriş başarılı!`);
      navigate('/');
    } else {
      toast.error('Sosyal medya girişi başarısız');
    }
  };

  return (
    <>
      <SEO 
        title="Giriş Yap - AtusHome"
        description="AtusHome hesabınıza giriş yapın. Güvenli alışverişin keyfini çıkarın."
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
              <p className="text-muted-foreground">Hesabınıza giriş yapın</p>
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
                <span className="bg-card px-2 text-muted-foreground">veya e-posta ile</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <span className="text-sm text-muted-foreground">Beni hatırla</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-orange-600 hover:underline">
                  Şifremi unuttum
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-orange h-11"
                disabled={isLoading}
              >
                {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">Demo Giriş Bilgileri:</p>
              <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <p><strong>Super Admin:</strong> superadmin@atushome.com / AtusHome2024!</p>
                <p><strong>Admin:</strong> admin@atushome.com / Admin1234</p>
                <p><strong>Kullanıcı:</strong> test@example.com / User1234</p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="text-orange-600 font-medium hover:underline">
                Kayıt olun
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
