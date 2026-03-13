import { useState } from 'react';
import { Mail, Send, Gift, Bell, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function NewsletterSection() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success('Bültenimize başarıyla abone oldunuz!', {
        description: 'İndirim kodunuz e-posta adresinize gönderildi.'
      });
      setEmail('');
    }
  };

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8 md:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-6">
                <Bell className="h-4 w-4" />
                İlk Sen Haberdar Ol
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Bültenimize Abone Olun
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Yeni ürünler, özel indirimler ve kampanyalardan ilk siz haberdar olun. 
                Abone olanlara özel %10 indirim kodu hediye!
              </p>

              {/* Benefits */}
              <div className="space-y-4">
                {[
                  { icon: Gift, text: 'Abone olana %10 indirim kodu' },
                  { icon: Tag, text: 'Özel kampanya ve fırsatlar' },
                  { icon: Bell, text: 'Yeni ürün duyuruları' }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-4 w-4 text-orange-400" />
                    </div>
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Form */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="E-posta adresinizi girin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 rounded-xl border-0 text-base"
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full gradient-orange h-14 text-base font-semibold rounded-xl"
                >
                  Abone Ol
                  <Send className="h-5 w-5 ml-2" />
                </Button>
              </form>

              <p className="text-gray-500 text-sm text-center mt-4">
                Abone olarak{' '}
                <a href="#" className="text-orange-400 hover:underline">gizlilik politikamızı</a>
                {' '}kabul etmiş olursunuz.
              </p>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50K+</div>
                  <div className="text-xs text-gray-500">Abone</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">%10</div>
                  <div className="text-xs text-gray-500">İndirim</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-xs text-gray-500">Spam</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
