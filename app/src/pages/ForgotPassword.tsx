import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    const success = await forgotPassword(email.trim());
    if (success) {
      setSent(true);
      toast.success('Şifre sıfırlama kodu e-postanıza gönderildi.');
    } else {
      toast.error('İşlem başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-custom py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl shadow-soft p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-gradient">Atus</span>
                <span className="text-orange-600">Home</span>
              </h1>
              <p className="text-muted-foreground">Şifremi Unuttum</p>
            </div>

            {!sent ? (
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
                  <p className="text-xs text-muted-foreground mt-2">
                    E-posta adresinize bir doğrulama kodu göndereceğiz.
                  </p>
                </div>

                <Button type="submit" className="w-full gradient-orange h-11" disabled={isLoading}>
                  {isLoading ? 'Gönderiliyor...' : 'Kod Gönder'}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{email}</span> adresine şifre sıfırlama kodu gönderildi.
                </p>
                <Button
                  onClick={() => navigate('/reset-password', { state: { email } })}
                  className="w-full gradient-orange h-11"
                >
                  Devam Et
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Giriş sayfasına dön
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
