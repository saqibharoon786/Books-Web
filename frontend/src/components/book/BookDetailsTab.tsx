// components/book/BookDetailsTab.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, FileText, Globe, BookOpen } from "lucide-react";

interface BookDetailsTabProps {
  book: {
    publisher?: string;
    publicationYear?: number;
    totalPages?: number;
    language?: string;
    category?: string;
    subcategory?: string;
    isbn?: string;
    tags?: string[];
  };
}

const BookDetailsTab = ({ book }: BookDetailsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Publisher</p>
                    <p className="text-muted-foreground">
                      {book.publisher || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Publication Year</p>
                    <p className="text-muted-foreground">
                      {book.publicationYear || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Pages</p>
                    <p className="text-muted-foreground">{book.totalPages || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Language</p>
                    <p className="text-muted-foreground capitalize">
                      {book.language || 'English'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Category</p>
                    <div className="flex gap-2 flex-wrap mt-1">
                      <Badge 
                        variant="secondary" 
                        className="capitalize bg-primary/10 text-primary border-primary/20"
                      >
                        {book.category || 'General'}
                      </Badge>
                      {book.subcategory && (
                        <Badge 
                          variant="outline" 
                          className="capitalize border-primary/30"
                        >
                          {book.subcategory}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {book.isbn && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">ISBN</p>
                      <p className="text-muted-foreground font-mono text-sm">
                        {book.isbn}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tags */}
      {book.tags && book.tags.length > 0 && (
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="font-semibold mb-3">Tags</p>
            <div className="flex flex-wrap gap-2">
              {book.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="px-3 py-1 rounded-full bg-secondary/50 hover:bg-secondary transition-colors cursor-default"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookDetailsTab;