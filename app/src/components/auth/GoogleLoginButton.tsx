import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { isGoogleAuthConfigured, getGoogleClientId } from '@/services/googleAuth';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';

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
