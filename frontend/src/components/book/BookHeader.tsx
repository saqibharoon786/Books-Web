// components/book/BookHeader.tsx
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Star, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookHeaderProps {
  title: string;
  author: string;
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  authorBio?: string;
  showRatingModal: boolean;
  hoverRating: number;
  onShowRatingModal: () => void;
  onHoverRating: (rating: number) => void;
}

const BookHeader = ({
  title,
  author,
  viewCount,
  averageRating,
  reviewCount,
  authorBio,
  showRatingModal,
  hoverRating,
  onShowRatingModal,
  onHoverRating
}: BookHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)} 
        className="gap-2 self-start hover:bg-primary/10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Browse
      </Button>
      
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
          <Eye className="w-4 h-4" />
          <span>{viewCount.toLocaleString()} views</span>
        </div>
        <div className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 fill-current" />
          <span>
            {averageRating.toFixed(1)} 
            <span className="text-muted-foreground ml-1">
              ({reviewCount} reviews)
            </span>
          </span>
        </div>
      </div>

      {/* Title and Author - For Main Card */}
      <div className="space-y-4 w-full">
        <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </CardTitle>
        <CardDescription className="text-xl flex items-center gap-3">
          <div className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5" />
            <span className="font-semibold">by {author}</span>
          </div>
          {authorBio && (
            <span className="text-sm text-muted-foreground italic">
              · Author Biography Available
            </span>
          )}
        </CardDescription>
        
        {/* Rating with Stars */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={onShowRatingModal}
                  onMouseEnter={() => onHoverRating(star)}
                  onMouseLeave={() => onHoverRating(0)}
                  className="focus:outline-none transform hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || Math.floor(averageRating || 0))
                        ? "text-yellow-400 fill-current drop-shadow-lg"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({reviewCount} reviews)
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShowRatingModal}
            className="gap-1"
          >
            <Star className="w-3 h-3" />
            Add Rating
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookHeader;