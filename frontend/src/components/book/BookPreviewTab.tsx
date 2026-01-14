// components/book/BookPreviewTab.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Clock, Eye, Download, Loader2 } from "lucide-react";

interface BookPreviewTabProps {
  book: {
    _id: string;
    title: string;
    description?: string;
    textFormat?: string;
    textLanguage?: string;
  };
  bookPreview?: {
    previewContent?: string;
    wordCount?: number;
    estimatedReadingTime?: number;
  };
  isAuthenticated: boolean;
  purchasing: boolean;
  hasPurchased: boolean;
  onPurchase: () => void;
  onReadTextBook: () => void;
}

const BookPreviewTab = ({
  book,
  bookPreview,
  isAuthenticated,
  purchasing,
  hasPurchased,
  onPurchase,
  onReadTextBook
}: BookPreviewTabProps) => {
  const renderTextContent = () => {
    if (!book) {
      return <p className="text-muted-foreground">Book content not available</p>;
    }

    if (bookPreview?.previewContent) {
      return (
        <div className="whitespace-pre-line leading-relaxed">
          {bookPreview.previewContent}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Preview content is not available. Showing book description instead:
        </p>
        <div className="whitespace-pre-line leading-relaxed">
          {book.description || 'No content available for this book.'}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Book Preview</h3>
              <p className="text-sm text-muted-foreground">
                Read the full text content uploaded by the publisher
              </p>
            </div>
            {bookPreview && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-full">
                  <FileText className="w-4 h-4" />
                  <span>{bookPreview.wordCount?.toLocaleString() || 0} words</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>{bookPreview.estimatedReadingTime || 0} min read</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Text Content Display */}
          <div className="bg-gradient-to-br from-card to-secondary/10 border-2 rounded-xl overflow-hidden">
            <div className="border-b p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <BookOpen className="w-3 h-3" />
                    Full Text
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {book.textFormat || 'plain'} format
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {book.textLanguage || 'English'}
                  </Badge>
                </div>
                <Button 
                  variant="default"
                  size="sm" 
                  onClick={onReadTextBook}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Read Full Screen
                </Button>
              </div>
            </div>
            
            {/* Actual Text Content */}
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {renderTextContent()}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Want to read offline?</p>
                    <p className="text-sm text-muted-foreground">
                      Purchase the PDF version
                    </p>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={onPurchase}
                    disabled={purchasing}
                    className="gap-2"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Buy PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Better reading experience</p>
                    <p className="text-sm text-muted-foreground">
                      Use the reader view for comfort
                    </p>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      if (isAuthenticated) {
                        onReadTextBook();
                      }
                    }}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Reader View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookPreviewTab;