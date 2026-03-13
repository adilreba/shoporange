import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CreditCard, Lock } from 'lucide-react';

// Stripe public key - test mode
const stripePromise = loadStripe('pk_test_51YourStripeKeyHere');

interface StripePaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function PaymentForm({ amount, onSuccess, onCancel }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Ödeme sistemi yükleniyor, lütfen bekleyin...');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setCardError(null);

    try {
      // Demo mode - simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, you would:
      // 1. Create payment intent on your backend
      // 2. Confirm card payment with stripe.confirmCardPayment()
      
      const mockPaymentIntentId = 'pi_' + Date.now();
      toast.success('Ödeme başarılı!');
      onSuccess(mockPaymentIntentId);
    } catch (error: any) {
      setCardError(error.message || 'Ödeme işlemi başarısız oldu');
      toast.error('Ödeme başarısız: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="bg-orange-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-600 mb-1">Ödenecek Tutar</p>
        <p className="text-3xl font-bold text-orange-600">{formatPrice(amount)}</p>
      </div>

      {/* Card Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Kart Bilgileri
        </label>
        <div className="border rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
          <CardElement options={cardElementOptions} />
        </div>
        {cardError && (
          <p className="text-sm text-red-500">{cardError}</p>
        )}
      </div>

      {/* Test Cards Info */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-gray-700 mb-2">Test Kartları:</p>
        <div className="space-y-1 text-gray-600">
          <p>✅ Başarılı: 4242 4242 4242 4242</p>
          <p>❌ Reddedilen: 4000 0000 0000 0002</p>
          <p>📅 Herhangi bir gelecek tarih (MM/YY)</p>
          <p>🔒 Herhangi 3 haneli CVC</p>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Lock className="h-4 w-4" />
        <span>256-bit SSL ile güvenli ödeme</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12"
          onClick={onCancel}
          disabled={isProcessing}
        >
          İptal
        </Button>
        <Button
          type="submit"
          className="flex-1 gradient-orange h-12"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              İşleniyor...
            </>
          ) : (
            `Öde ${formatPrice(amount)}`
          )}
        </Button>
      </div>
    </form>
  );
}

interface StripePaymentProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export function StripePayment({ amount, onSuccess, onCancel }: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
