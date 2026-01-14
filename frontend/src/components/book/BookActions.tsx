// components/book/BookActions.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Heart, 
  Download, 
  BookOpen,
  FileText,
  Loader2,
  Star
} from "lucide-react";
import { toast } from "sonner";

interface BookActionsProps {
  book: {
    _id: string;
    title: string;
    price: number;
    currency: string;
    discountPercentage?: number;
  };
  hasPurchased: boolean;
  purchasing: boolean;
  purchaseCheckLoading: boolean;
  reading: boolean;
  onPurchase: (paymentMethod: 'safepay' | 'bank' | 'jazzcash' | 'easypaisa') => Promise<void>;
  onReadTextBook: () => void;
  onDownloadPDF: () => void;
  onRateBook: () => void;
  isAuthenticated: boolean;
}

const BookActions = ({
  book,
  hasPurchased,
  purchasing,
  purchaseCheckLoading,
  reading,
  onPurchase,
  onReadTextBook,
  onDownloadPDF,
  onRateBook,
  isAuthenticated
}: BookActionsProps) => {
  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const calculateDiscountedPrice = () => {
    if (book.discountPercentage && book.discountPercentage > 0) {
      return book.price * (1 - book.discountPercentage / 100);
    }
    return book.price;
  };

  const discountedPrice = calculateDiscountedPrice();

  // Direct purchase handler - goes straight to SafePay
  const handleDirectPurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase');
      return;
    }
    
    // Call onPurchase with 'safepay' to go directly to payment
    await onPurchase('safepay');
  };

  return (
    <>
      {/* Price Section */}
      <div className="text-center mb-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {formatCurrency(discountedPrice, book.currency || 'PKR')}
          </span>
          {book.discountPercentage && book.discountPercentage > 0 && (
            <span className="text-xl text-muted-foreground line-through">
              {formatCurrency(book.price, book.currency || 'PKR')}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {book.discountPercentage && book.discountPercentage > 0 
            ? 'Limited time discount!' 
            : 'Regular price'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        {/* Free Text Reading */}
        <Button 
          className="w-full gap-2 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all hover:shadow-lg" 
          size="lg"
          onClick={onReadTextBook}
          disabled={reading}
        >
          {reading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BookOpen className="w-4 h-4" />
          )}
          {reading ? 'Opening...' : 'Read Free Text'}
        </Button>

        {/* Direct Purchase Button */}
        {!hasPurchased && (
          <Button 
            variant="outline" 
            className="w-full gap-2 h-12 border-primary/30 hover:border-primary hover:bg-primary/5"
            onClick={handleDirectPurchase}
            disabled={purchasing || purchaseCheckLoading}
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {purchasing ? 'Processing...' : `Buy PDF - ${formatCurrency(discountedPrice, book.currency || 'PKR')}`}
          </Button>
        )}

        {/* Download PDF Button (if already purchased) */}
        {hasPurchased && (
          <Button 
            variant="outline" 
            className="w-full gap-2 h-12 border-primary/30 hover:border-primary hover:bg-primary/5"
            onClick={onDownloadPDF}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        )}

        {/* Rating Button */}
        <Button 
          variant="ghost" 
          className="w-full gap-2 h-12 text-primary hover:text-primary/80 hover:bg-primary/5"
          onClick={onRateBook}
        >
          <Star className="w-4 h-4" />
          Rate this Book
        </Button>

        {/* Wishlist Button */}
        <Button variant="ghost" className="w-full gap-2 h-12">
          <Heart className="w-4 h-4" />
          Add to Wishlist
        </Button>
      </div>

      {/* Purchase Status */}
      {isAuthenticated && (
        <div className="mt-4 p-4 bg-gradient-to-r from-secondary/20 to-background rounded-xl border">
          <p className="text-sm font-medium mb-2">Your Access:</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span className="text-sm">Text Version</span>
              </div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                Free Access
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm">PDF Version</span>
              </div>
              {hasPurchased ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  Purchased
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                  Purchase Required
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookActions;