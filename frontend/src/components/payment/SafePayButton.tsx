// components/payment/SafePayButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, ExternalLink } from "lucide-react";

interface SafePayButtonProps {
  bookId: string;
  amount: number;
  currency: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SafePayButton = ({ bookId, amount, currency, onSuccess, onError }: SafePayButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleSafePayPurchase = async () => {
    try {
      setLoading(true);
      
      // Call your purchase endpoint with SafePay
      const response = await fetch(`${import.meta.env.VITE_API_URL}/book/${bookId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          format: 'pdf',
          paymentMethod: 'safepay'
        })
      });

      const data = await response.json();

      if (data.success && data.data?.paymentUrl) {
        // Redirect to SafePay
        window.location.href = data.data.paymentUrl;
      } else {
        onError?.(data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('SafePay error:', error);
      onError?.('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSafePayPurchase}
      disabled={loading}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-12 gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Lock className="w-4 h-4" />
      )}
      <span>Pay with SafePay</span>
      <ExternalLink className="w-4 h-4 ml-auto" />
    </Button>
  );
};

export default SafePayButton;