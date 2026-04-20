import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { isGoogleAuthConfigured, getGoogleClientId, isGoogleAuthMockMode } from '@/services/googleAuth';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';

// UTF-8 string'i base64'e çevir (btoa Latin1 sınırlı)
function utf8ToBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// TypeScript declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function GoogleLoginButton({ onSuccess, className = '' }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { googleSignIn, isLoading } = useAuthStore();

  useEffect(() => {
    // Check if Google Auth is configured
    if (!isGoogleAuthConfigured()) {
      console.warn('Google Auth not configured');
      return;
    }

    // Initialize Google Identity Services
    const initializeGoogle = () => {
      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: getGoogleClientId(),
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: '100%',
        });
      }
    };

    // Load Google script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      toast.error('Google girişi başarısız');
      return;
    }

    try {
      const success = await googleSignIn(response.credential);
      
      if (success) {
        toast.success('Google ile giriş başarılı!');
        onSuccess?.();
        navigate('/');
      } else {
        toast.error('Google girişi başarısız');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Google girişi sırasında bir hata oluştu');
    }
  };

  // Fallback button when Google Auth is not configured
  if (!isGoogleAuthConfigured()) {
    // Mock mode'da demo kullanıcı ile giriş simülasyonu
    if (isGoogleAuthMockMode()) {
      return (
        <Button
          variant="outline"
          className={`w-full ${className}`}
          onClick={async () => {
            try {
              // Demo Google kullanıcısı için mock JWT credential oluştur
              // JWT format: header.payload.signature
              const header = utf8ToBase64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
              const payload = utf8ToBase64(JSON.stringify({
                email: 'demo.google@example.com',
                name: 'Demo Google Kullanici', // Türkçe karakter olmadan
                picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
                sub: 'google-demo-' + Date.now(),
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600
              }));
              const signature = btoa('mock-signature');
              const mockCredential = `${header}.${payload}.${signature}`;
              
              const success = await googleSignIn(mockCredential);
              if (success) {
                toast.success('Google ile giriş başarılı! (Demo)');
                onSuccess?.();
                navigate('/');
              } else {
                toast.error('Google girişi başarısız');
              }
            } catch (error) {
              console.error('Google demo login error:', error);
              toast.error('Google girişi sırasında hata oluştu');
            }
          }}
          disabled={isLoading}
        >
          <Chrome className="h-5 w-5 mr-2 text-blue-500" />
          Google ile Devam Et (Demo)
        </Button>
      );
    }
    
    return (
      <Button
        variant="outline"
        className={`w-full ${className}`}
        disabled={true}
        title="Google Auth not configured"
      >
        <Chrome className="h-5 w-5 mr-2 text-red-500" />
        Google (Yapılandırılmamış)
      </Button>
    );
  }

  return (
    <div 
      ref={buttonRef} 
      className={`w-full ${className}`}
      style={{ minHeight: '40px' }}
    >
      {isLoading && (
        <Button variant="outline" className="w-full" disabled>
          <Chrome className="h-5 w-5 mr-2 text-red-500" />
          Yükleniyor...
        </Button>
      )}
    </div>
  );
}

// One-tap Google Sign In prompt (can be used anywhere)
export function GoogleOneTapPrompt() {
  const navigate = useNavigate();
  const { googleSignIn } = useAuthStore();

  useEffect(() => {
    if (!isGoogleAuthConfigured()) return;

    const initializeOneTap = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: getGoogleClientId(),
          callback: async (response: any) => {
            if (response.credential) {
              try {
                const success = await googleSignIn(response.credential);
                if (success) {
                  toast.success('Google ile giriş başarılı!');
                  navigate('/');
                }
              } catch (error) {
                console.error('One-tap sign in error:', error);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Show the one-tap prompt
        window.google.accounts.id.prompt();
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeOneTap;
      document.head.appendChild(script);
    } else {
      initializeOneTap();
    }
  }, [navigate]);

  return null; // This component doesn't render anything
}
