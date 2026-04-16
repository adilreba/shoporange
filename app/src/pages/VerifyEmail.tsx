import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerificationCode, pendingVerificationEmail, isLoading } = useAuthStore();
  
  const [code, setCode] = useState('');
  
  // Eğer state üzerinden email gelmediyse, authStore'daki pending email'i kullan
  const email = (location.state as any)?.email || pendingVerificationEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error('Lütfen doğrulama kodunu girin');
      return;
    }
    
    if (code.trim().length !== 6) {
      toast.error('Doğrulama kodu 6 haneli olmalıdır');
      return;
    }
    
    const success = await verifyEmail(code.trim());
    
    if (success) {
      toast.success('E-posta adresiniz doğrulandı! Giriş yapabilirsiniz.');
      navigate('/login');
    } else {
      toast.error('Doğrulama kodu hatalı veya süresi dolmuş. Lütfen tekrar deneyin.');
    }
  };

  const handleResend = async () => {
    const success = await resendVerificationCode();
    if (success) {
      toast.success('Yeni doğrulama kodu e-posta adresinize gönderildi.');
    } else {
      toast.error('Kod gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    }
  };

  return (
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
              <p className="text-muted-foreground">E-posta Doğrulama</p>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Doğrulama Kodu</h2>
              <p className="text-muted-foreground text-sm">
                {email ? (
                  <>
                    <span className="font-medium text-foreground">{email}</span> adresine gönderilen 6 haneli kodu girin.
                  </>
                ) : (
                  'E-posta adresinize gönderilen 6 haneli kodu girin.'
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code">Doğrulama Kodu</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-lg tracking-[0.5em]"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-orange"
                disabled={isLoading}
              >
                {isLoading ? 'Doğrulanıyor...' : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Doğrula
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Kodu almadınız mı?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-orange-600 hover:underline font-medium disabled:opacity-50"
                >
                  Tekrar Gönder
                </button>
              </p>
              
              <Link
                to="/register"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kayıt sayfasına dön
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
