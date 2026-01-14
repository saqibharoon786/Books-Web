// components/book/BookStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Download, ShoppingCart, Calendar, FileText, BookOpen } from "lucide-react";

interface BookStatsProps {
  viewCount: number;
  downloadCount: number;
  purchaseCount: number;
  createdAt?: string;
  discountedPrice: number;
  currency: string;
  hasPurchased: boolean;
}

const BookStats = ({
  viewCount,
  downloadCount,
  purchaseCount,
  createdAt,
  discountedPrice,
  currency,
  hasPurchased
}: BookStatsProps) => {
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

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {/* Reading Formats */}
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            Available Formats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border-2 rounded-xl hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Text Version</p>
                  <p className="text-sm text-muted-foreground">Read online for free</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-full text-sm font-medium">
                  FREE
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 border-2 rounded-xl hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">PDF Version</p>
                  <p className="text-sm text-muted-foreground">Download and keep</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(discountedPrice, currency || 'PKR')}
                </p>
                {hasPurchased && (
                  <div className="bg-green-100 text-green-800 text-xs mt-1 px-2 py-1 rounded-full">
                    PURCHASED
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Book Stats */}
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Book Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 hover:bg-secondary/20 rounded-lg transition-colors">
              <span className="text-muted-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Views
              </span>
              <span className="font-medium">{viewCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-secondary/20 rounded-lg transition-colors">
              <span className="text-muted-foreground flex items-center gap-2">
                <Download className="w-4 h-4" />
                Downloads
              </span>
              <span className="font-medium">{downloadCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-secondary/20 rounded-lg transition-colors">
              <span className="text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Purchases
              </span>
              <span className="font-medium">{purchaseCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-secondary/20 rounded-lg transition-colors">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upload Date
              </span>
              <span className="font-medium">
                {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookStats;