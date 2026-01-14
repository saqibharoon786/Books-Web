// components/book/BookReviewsTab.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface BookReviewsTabProps {
  averageRating: number;
  reviewCount: number;
  onShowRatingModal: () => void;
}

const BookReviewsTab = ({ 
  averageRating, 
  reviewCount, 
  onShowRatingModal 
}: BookReviewsTabProps) => {
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
              <span className="text-3xl font-bold">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-center mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.floor(averageRating || 0)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <h3 className="text-xl font-semibold mb-2">Customer Reviews</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              This book has an average rating of {averageRating.toFixed(1)} 
              from {reviewCount} reviews.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={onShowRatingModal}>
                <Star className="w-4 h-4 mr-2" />
                Add Your Review
              </Button>
              <Button variant="outline">
                Read All Reviews
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookReviewsTab;