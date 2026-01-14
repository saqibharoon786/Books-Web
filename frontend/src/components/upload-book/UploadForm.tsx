// components/upload-book/UploadForm.tsx
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  CheckCircle, 
  Trash2, 
  BookOpen, 
  DollarSign, 
  User, 
  Building, 
  Calendar, 
  Hash, 
  Globe, 
  Eye, 
  Download,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo
} from "lucide-react";

interface UploadFormProps {
  isOpen: boolean;
  isLoading: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  userRole?: string;
}

const LANGUAGES = ["English", "Urdu", "Arabic"];
const CURRENCIES = ["PKR", "USD"];
const TEXT_FORMATS = ["plain", "html", "markdown"];

interface CoverImage {
  file: File;
  previewUrl: string;
  id: string;
}

const UploadForm = ({ isOpen, isLoading, onSubmit, onCancel, userRole }: UploadFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    price: "",
    category: "",
    subcategory: "",
    description: "",
    publisher: "",
    publicationYear: new Date().getFullYear().toString(),
    totalPages: "",
    language: "English",
    edition: "First Edition",
    isbn: "",
    authorBio: "",
    discountPercentage: "0",
    currency: "PKR",
    tags: "",
    metaDescription: "",
    textContent: "",
    textFormat: "html" as "plain" | "html" | "markdown",
    textLanguage: "English"
  });

  const [coverImages, setCoverImages] = useState<CoverImage[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    type: 'pdf' | 'image';
    url: string;
    name: string;
  }>({ open: false, type: 'image', url: '', name: '' });

  const coverImageRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const textEditorRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverImagesChange = (files: FileList | null) => {
    if (!files) return;

    const newImages: CoverImage[] = [];
    
    for (let i = 0; i < Math.min(files.length, 5 - coverImages.length); i++) {
      const file = files[i];
      if (file && file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        newImages.push({
          file,
          previewUrl,
          id: Math.random().toString(36).substr(2, 9)
        });
      }
    }

    setCoverImages(prev => [...prev, ...newImages]);
  };

  const removeCoverImage = (id: string) => {
    setCoverImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handlePdfFileChange = (file: File | null) => {
    setPdfFile(file);
  };

  // Rich Text Editor Functions
  const executeCommand = useCallback((command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (textEditorRef.current) {
      const content = textEditorRef.current.innerHTML;
      setFormData(prev => ({ ...prev, textContent: content }));
    }
  }, []);

  const handleEditorChange = useCallback(() => {
    if (textEditorRef.current) {
      const content = textEditorRef.current.innerHTML;
      setFormData(prev => ({ ...prev, textContent: content }));
    }
  }, []);

  const clearFormatting = useCallback(() => {
    executeCommand('removeFormat');
    executeCommand('unlink');
  }, [executeCommand]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const submitData = new FormData();

  Object.entries(formData).forEach(([key, value]) => {
    if (value) submitData.append(key, value);
  });

  coverImages.forEach((image) => {
    submitData.append('coverImages', image.file);
  });

  if (pdfFile) submitData.append('pdfFile', pdfFile);

  try {
    await onSubmit(submitData);

    // 👇 Check role and navigate accordingly
    if (userRole === "admin") {
      navigate("/admin/shop");
    } else {
      navigate("/superadmin/shop");
    }
  } catch (error) {
    console.error("Upload failed:", error);
  }
};


  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      price: "",
      category: "",
      subcategory: "",
      description: "",
      publisher: "",
      publicationYear: new Date().getFullYear().toString(),
      totalPages: "",
      language: "English",
      edition: "First Edition",
      isbn: "",
      authorBio: "",
      discountPercentage: "0",
      currency: "PKR",
      tags: "",
      metaDescription: "",
      textContent: "",
      textFormat: "plain",
      textLanguage: "English"
    });
    
    // Clear cover images
    coverImages.forEach(image => {
      URL.revokeObjectURL(image.previewUrl);
    });
    setCoverImages([]);
    
    // Clear files
    setPdfFile(null);
    
    // Reset file inputs
    if (coverImageRef.current) coverImageRef.current.value = "";
    if (pdfFileRef.current) pdfFileRef.current.value = "";
    
    // Clear editor
    if (textEditorRef.current) {
      textEditorRef.current.innerHTML = "";
    }
    
    onCancel();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="transition-all duration-500 opacity-100 scale-100 h-full animate-slide-down w-full">
      <Card className="h-full border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-white/90 to-blue-50/50 dark:from-gray-900/90 dark:to-blue-950/20 backdrop-blur-sm relative overflow-hidden w-full">
        
        <CardHeader className="relative z-10 bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/20">
          <CardTitle className="text-2xl lg:text-3xl font-bold flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl text-white shadow-lg">
              <Upload className="h-6 w-6 lg:h-7 lg:w-7" />
            </div>
            <div>
              Upload New Book
              <CardDescription className="text-base lg:text-lg mt-2">
                {userRole === "superadmin" 
                  ? "📚 Books will be automatically approved and published" 
                  : "⏳ Books will be sent for super admin approval before publishing"}
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 h-[calc(100%-120px)] overflow-y-auto py-6">
          <form onSubmit={handleSubmit} className="space-y-8 w-full">
            
            {/* Section 1: Basic Book Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <BookOpen className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Basic Book Information</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      Book Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="Enter book title"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="author" className="text-base font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Author *
                    </Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      required
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="Enter author name"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      Category *
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      required
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="e.g., Fiction, Science, Law, etc."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      required
                      className="resize-none border-2 focus:border-primary/50 transition-all duration-300 text-lg rounded-xl"
                      placeholder="Provide a detailed description of the book..."
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="subcategory" className="text-base font-semibold">
                      Subcategory
                    </Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="Enter subcategory"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Publishing Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <Building className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Publishing Details</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="publisher" className="text-base font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      Publisher *
                    </Label>
                    <Input
                      id="publisher"
                      value={formData.publisher}
                      onChange={(e) => handleInputChange('publisher', e.target.value)}
                      required
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="Publisher name"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="publicationYear" className="text-base font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Publication Year *
                    </Label>
                    <Input
                      id="publicationYear"
                      type="number"
                      value={formData.publicationYear}
                      onChange={(e) => handleInputChange('publicationYear', e.target.value)}
                      required
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="2024"
                      min="1000"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="totalPages" className="text-base font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      Total Pages *
                    </Label>
                    <Input
                      id="totalPages"
                      type="number"
                      value={formData.totalPages}
                      onChange={(e) => handleInputChange('totalPages', e.target.value)}
                      required
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="Number of pages"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="edition" className="text-base font-semibold">
                        Edition
                      </Label>
                      <Input
                        id="edition"
                        value={formData.edition}
                        onChange={(e) => handleInputChange('edition', e.target.value)}
                        className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                        placeholder="First Edition"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="language" className="text-base font-semibold flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        Language *
                      </Label>
                      <Select value={formData.language} onValueChange={(v) => handleInputChange('language', v)}>
                        <SelectTrigger className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang} value={lang} className="text-lg py-3">
                              {lang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="isbn" className="text-base font-semibold">
                      ISBN
                    </Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => handleInputChange('isbn', e.target.value)}
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="ISBN number"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="tags" className="text-base font-semibold flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                      placeholder="Comma separated tags (fiction, science, etc.)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Pricing Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <DollarSign className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Pricing Information</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="price" className="text-base font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    Price *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    required
                    className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="currency" className="text-base font-semibold">
                    Currency
                  </Label>
                  <Select value={formData.currency} onValueChange={(v) => handleInputChange('currency', v)}>
                    <SelectTrigger className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency} className="text-lg py-3">
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="discountPercentage" className="text-base font-semibold">
                    Discount %
                  </Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                    className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-300 rounded-xl"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Media & Files */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <Image className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Media & Files</h3>
              </div>

              {/* Cover Images Upload */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  Book Cover Images *
                  <span className="text-sm font-normal text-muted-foreground">
                    (Up to 5 images)
                  </span>
                </Label>
                
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Cover Image Upload Box */}
                  {coverImages.length < 5 && (
                    <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 hover:border-primary/50 transition-all duration-300 bg-background/50 cursor-pointer group">
                      <Input 
                        ref={coverImageRef}
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleCoverImagesChange(e.target.files)}
                        className="hidden"
                        id="cover-images"
                        multiple
                      />
                      <label htmlFor="cover-images" className="cursor-pointer block h-full">
                        <div className="flex flex-col items-center justify-center h-32 text-center space-y-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Add Cover</p>
                            <p className="text-xs text-muted-foreground">
                              {coverImages.length}/5
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Cover Image Previews */}
                  {coverImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-green-500/30 bg-green-50/50 cursor-pointer"
                           onClick={() => setPreviewDialog({ open: true, type: 'image', url: image.previewUrl, name: image.file.name })}>
                        <img 
                          src={image.previewUrl} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCoverImage(image.id)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book Content Editor */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    Book Text Content *
                  </Label>

                  <Select value={formData.textFormat} onValueChange={(v: "plain" | "html" | "markdown") => handleInputChange('textFormat', v)}>
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEXT_FORMATS.map(format => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-2 border-border rounded-xl bg-card shadow-professional-sm overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-3 border-b bg-muted/50 backdrop-blur-sm">
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('undo')} className="h-8 w-8 p-0">
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('redo')} className="h-8 w-8 p-0">
                      <Redo className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-border mx-1"></div>
                    
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('bold')} className="h-8 w-8 p-0">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('italic')} className="h-8 w-8 p-0">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('underline')} className="h-8 w-8 p-0">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('strikethrough')} className="h-8 w-8 p-0">
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-border mx-1"></div>
                    
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('justifyLeft')} className="h-8 w-8 p-0">
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('justifyCenter')} className="h-8 w-8 p-0">
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('justifyRight')} className="h-8 w-8 p-0">
                      <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('justifyFull')} className="h-8 w-8 p-0">
                      <AlignJustify className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-border mx-1"></div>
                    
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('insertUnorderedList')} className="h-8 w-8 p-0">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => executeCommand('insertOrderedList')} className="h-8 w-8 p-0">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-border mx-1"></div>
                    
                    <Select onValueChange={(value) => executeCommand('formatBlock', value)}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue placeholder="Paragraph" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p">Paragraph</SelectItem>
                        <SelectItem value="h1">Heading 1</SelectItem>
                        <SelectItem value="h2">Heading 2</SelectItem>
                        <SelectItem value="h3">Heading 3</SelectItem>
                        <SelectItem value="h4">Heading 4</SelectItem>
                        <SelectItem value="h5">Heading 5</SelectItem>
                        <SelectItem value="h6">Heading 6</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button type="button" variant="ghost" size="sm" onClick={clearFormatting} className="text-sm h-8 px-3">
                      Clear Format
                    </Button>
                  </div>

                  <div
                    ref={textEditorRef}
                    contentEditable
                    onInput={handleEditorChange}
                    className="h-[400px] w-full overflow-auto p-6 prose prose-sm max-w-none focus:outline-none bg-background"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '15px',
                      lineHeight: '1.6'
                    }}
                  />
                </div>
              </div>

              {/* PDF File Upload */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  PDF File *
                  <span className="text-sm font-normal text-muted-foreground">
                    (PDF file up to 50MB)
                  </span>
                </Label>
                
                {!pdfFile ? (
                  <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 bg-background/50 cursor-pointer">
                    <Input 
                      ref={pdfFileRef}
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => handlePdfFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      id="pdf-file"
                    />
                    <label htmlFor="pdf-file" className="cursor-pointer block">
                      <div className="text-center space-y-3">
                        <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 mx-auto flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Upload PDF File</p>
                          <p className="text-muted-foreground mt-1 text-sm">
                            Click to upload PDF version of the book
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="border-2 border-green-500/30 rounded-xl p-4 bg-green-50/50 dark:bg-green-950/20 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <p className="font-semibold text-foreground truncate">
                              {pdfFile.name}
                            </p>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {formatFileSize(pdfFile.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = URL.createObjectURL(pdfFile);
                            setPreviewDialog({ open: true, type: 'pdf', url, name: pdfFile.name });
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePdfFileChange(null)}
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Additional Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <User className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Additional Information</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="authorBio" className="text-base font-semibold">
                    Author Biography
                  </Label>
                  <Textarea
                    id="authorBio"
                    value={formData.authorBio}
                    onChange={(e) => handleInputChange('authorBio', e.target.value)}
                    rows={4}
                    className="resize-none border-2 focus:border-primary/50 transition-all duration-300 text-lg rounded-xl"
                    placeholder="Tell readers about the author's background, achievements, and other published works..."
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="metaDescription" className="text-base font-semibold">
                    Meta Description
                  </Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    rows={2}
                    className="resize-none border-2 focus:border-primary/50 transition-all duration-300 text-lg rounded-xl"
                    placeholder="Brief description for SEO (max 160 characters)"
                    maxLength={160}
                  />
                  <div className="text-sm text-muted-foreground text-right">
                    {formData.metaDescription.length}/160
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={isLoading || coverImages.length === 0 || !pdfFile || !formData.textContent}
                className="flex-1 h-14 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-0 relative overflow-hidden group"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Uploading Book...
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mr-3 transition-transform group-hover:scale-110" />
                    Publish Book
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="h-14 text-lg font-semibold border-2 hover:border-destructive/50 hover:bg-destructive/10 transition-all duration-300 rounded-xl min-w-[140px]"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* File Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {previewDialog.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewDialog.type === 'image' && (
              <img src={previewDialog.url} alt="Preview" className="w-full h-auto rounded-lg" />
            )}
            {previewDialog.type === 'pdf' && (
              <div className="w-full h-[60vh]">
                <iframe 
                  src={previewDialog.url} 
                  className="w-full h-full rounded-lg border"
                  title="PDF Preview"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => window.open(previewDialog.url, '_blank')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Open in New Tab
            </Button>
            <Button onClick={() => setPreviewDialog(prev => ({ ...prev, open: false }))}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadForm;