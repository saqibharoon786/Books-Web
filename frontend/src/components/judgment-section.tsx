import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Document, Page, pdfjs } from "react-pdf";
import axios from "axios";
import {
  Loader2, Scale, Calendar, User, BookOpen, FileText, X,
  ChevronLeft, ChevronRight, Download, Bookmark,
  ZoomIn, ZoomOut, Eye, Clock, FileCheck, Shield, Award,
  Star, Layers, FileSearch, ChevronUp, MoreVertical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JudgmentService, type Judgment, type JudgmentFilters } from "@/services/JudgmentService";
// Set up react-pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// Professional Library Color Scheme
const COLOR_SCHEME = {
  backgrounds: {
    primary: "#F8F6F2",
    secondary: "#FFFEFC",
    tertiary: "#F5F2EB",
    accent: "#E8E2D6",
    dark: "#2C3E50",
  },
  accents: {
    primary: "#8B4513",
    secondary: "#A0522D",
    gold: "#D4AF37",
    bronze: "#CD7F32",
    navy: "#1A365D",
    burgundy: "#800020",
    forest: "#2E8B57",
  },
  text: {
    primary: "#2C1810",
    secondary: "#4A3520",
    muted: "#7A6956",
    light: "#D4B79E",
  },
  gradients: {
    primary: "linear-gradient(135deg, #F8F6F2 0%, #F5F2EB 100%)",
    accent: "linear-gradient(135deg, #8B4513 0%, #D4AF37 100%)",
    card: "linear-gradient(135deg, #FFFEFC 0%, #F8F6F2 100%)",
    gold: "linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)",
    leather: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
  }
};

// Professional PDF Viewer Component - NO CHANGES
const PDFViewer = ({ fileUrl }: { fileUrl: string }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError("Failed to load PDF document");
    setLoading(false);
  }, []);

  const nextPage = useCallback(() => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  }, [pageNumber, numPages]);

  const prevPage = useCallback(() => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  }, [pageNumber]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8">
        <FileText className="h-16 w-16 text-red-400 mb-4" />
        <p className="text-red-600 text-lg font-medium mb-2">Failed to load PDF</p>
        <Button
          onClick={() => window.open(fileUrl, "_blank")}
          className="mt-4 bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#A0522D] hover:to-[#8B4513] text-white font-medium px-5 py-2.5 rounded-lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: COLOR_SCHEME.backgrounds.primary }}>
      {numPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <Button
            variant="outline"
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">
              Page {pageNumber} of {numPages}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#8B4513] rounded-full animate-spin"></div>
              <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#8B4513]" />
            </div>
            <p className="mt-4 font-medium text-[#8B4513]">
              Loading PDF Document...
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mx-auto">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div>Loading PDF...</div>}
            >
              <Page
                pageNumber={pageNumber}
                width={Math.min(800, window.innerWidth - 80)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
};

// Professional Book-like Text Viewer - NO CHANGES
const BookTextViewer = ({ 
  content, 
  currentPage, 
  totalPages, 
  onNextPage, 
  onPrevPage,
  judgment 
}: { 
  content: string;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  judgment: Judgment | null;
}) => {
  const [fontSize, setFontSize] = useState(16);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  const processContentWithHeadings = useCallback((text: string): string[] => {
    if (!text) return [''];
    
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const pages: string[] = [];
    let currentPageContent = '';
    let currentWordCount = 0;
    const maxWordsPerPage = 350;

    paragraphs.forEach(paragraph => {
      const paragraphWords = paragraph.split(' ');
      const paragraphWordCount = paragraphWords.length;
      
      if (currentWordCount + paragraphWordCount > maxWordsPerPage && currentPageContent !== '') {
        pages.push(currentPageContent);
        currentPageContent = '';
        currentWordCount = 0;
      }
      
      let formattedParagraph = paragraph;
      
      const lines = paragraph.split('\n');
      if (lines.length === 1) {
        const line = lines[0].trim();
        if (
          line.length < 100 && 
          (line.endsWith(':') || 
           line === line.toUpperCase() || 
           /^[A-Z][a-z]+(:|\.)/.test(line) ||
           /^(BACKGROUND|FACTS|ISSUES|HELD|JUDGMENT|CONCLUSION)/i.test(line))
        ) {
          formattedParagraph = `**${line}**`;
        }
      }
      
      if (currentPageContent) {
        currentPageContent += '\n\n' + formattedParagraph;
      } else {
        currentPageContent = formattedParagraph;
      }
      currentWordCount += paragraphWordCount;
    });

    if (currentPageContent) {
      pages.push(currentPageContent);
    }

    return pages.length > 0 ? pages : [text];
  }, []);

  const pages = processContentWithHeadings(content);
  const displayTotalPages = Math.max(1, pages.length);

  const handleScroll = useCallback(() => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      
      setIsAtBottom(scrollBottom <= 50);
      setIsAtTop(scrollTop <= 10);
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight <= 1;
      const isAtTop = scrollTop === 0;

      if (e.deltaY > 0 && isAtBottom && currentPage < displayTotalPages) {
        e.preventDefault();
        onNextPage();
      }
      else if (e.deltaY < 0 && isAtTop && currentPage > 1) {
        e.preventDefault();
        onPrevPage();
      }
    }
  }, [currentPage, displayTotalPages, onNextPage, onPrevPage]);

  const formatTextWithHeadings = (text: string) => {
    if (!text) return null;
    
    return text.split('\n\n').map((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      
      if (trimmedParagraph.startsWith('**') && trimmedParagraph.endsWith('**')) {
        const headingText = trimmedParagraph.slice(2, -2);
        return (
          <h3 
            key={index} 
            className="font-bold text-[#8B4513] mb-4 mt-6 text-xl border-l-4 border-[#8B4513] pl-4 py-1"
          >
            {headingText}
          </h3>
        );
      } else if (
        trimmedParagraph.length < 100 && 
        (trimmedParagraph.endsWith(':') || 
         trimmedParagraph === trimmedParagraph.toUpperCase() ||
         /^(BACKGROUND|FACTS|ISSUES|HELD|JUDGMENT|CONCLUSION|ARGUMENTS|ANALYSIS)/i.test(trimmedParagraph))
      ) {
        return (
          <h3 
            key={index} 
            className="font-bold mb-4 mt-6 text-lg text-gray-800 border-b border-gray-200 pb-2"
          >
            {trimmedParagraph}
          </h3>
        );
      } else {
        return (
          <p 
            key={index} 
            className="mb-4 text-justify leading-relaxed text-gray-700"
            style={{ fontSize: `${fontSize}px` }}
          >
            {trimmedParagraph}
          </p>
        );
      }
    });
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      setIsAtTop(true);
      setIsAtBottom(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const scrollElement = contentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: COLOR_SCHEME.backgrounds.primary }}>
      {/* Header with Design Theme */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {judgment?.citation}
            </h3>
            <p className="text-sm opacity-90">
              {judgment?.court} • {judgment?.caseType}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Font Controls */}
          <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2 border border-white/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize(Math.max(14, fontSize - 1))}
              className="h-8 w-8 p-0 hover:bg-white/30 text-white rounded"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-white min-w-12 text-center">
              {fontSize}px
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize(Math.min(22, fontSize + 1))}
              className="h-8 w-8 p-0 hover:bg-white/30 text-white rounded"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Page Info */}
          <div className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30">
            <span className="text-sm font-medium">
              Page {currentPage} of {displayTotalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Document Header */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2 text-[#2C1810]">
                {judgment?.citation}
              </h1>
              <p className="text-lg mb-3 font-medium text-[#4A3520]">
                {judgment?.court}
              </p>
              <div className="flex justify-center gap-3 text-sm flex-wrap">
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full border border-gray-300">
                  Case Type: {judgment?.caseType}
                </span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full border border-gray-300">
                  Year: {judgment?.year}
                </span>
                {judgment?.judge && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full border border-gray-300">
                    Judge: {judgment.judge}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto bg-white"
            onWheel={handleWheel}
          >
            <div className="max-w-4xl mx-auto p-6">
              {/* Scroll indicators */}
              {isAtTop && currentPage > 1 && (
                <div className="text-center mb-4 p-3 bg-[#F5F2EB] border border-[#E8E2D6] rounded-lg">
                  <div className="text-sm font-medium text-[#8B4513] flex items-center justify-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Scroll up to go to previous page
                  </div>
                </div>
              )}

              {/* Formatted Content */}
              <div className="bg-white border border-[#E8E2D6] rounded-lg p-8">
                {formatTextWithHeadings(pages[currentPage - 1] || content)}
              </div>

              {/* End of Page Marker */}
              {currentPage < displayTotalPages && (
                <div className="text-center mt-6 pt-4 border-t border-[#E8E2D6]">
                  <div className="text-base italic mb-2 font-medium text-[#7A6956]">
                    — Continue to next page —
                  </div>
                  <div className="text-sm text-[#7A6956] flex items-center justify-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    Scroll down when at bottom
                  </div>
                </div>
              )}

              {isAtBottom && currentPage < displayTotalPages && (
                <div className="text-center mt-4 p-3 bg-[#F5F2EB] border border-[#E8E2D6] rounded-lg">
                  <div className="text-sm font-medium text-[#8B4513] flex items-center justify-center gap-2">
                    Scroll down to go to next page
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Page Footer */}
          <div className="p-4 bg-gray-50 border-t border-[#E8E2D6]">
            <div className="flex justify-between items-center text-sm font-medium">
              <div className="flex items-center gap-3">
                {judgment?.caseNumber && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full border border-gray-300">
                    Case No: {judgment.caseNumber}
                  </span>
                )}
              </div>
              <div className="font-bold text-[#2C1810]">
                — {currentPage} —
              </div>
              <div className="text-[#7A6956]">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation with Design Theme */}
      <div className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <Button
              onClick={onPrevPage}
              disabled={currentPage <= 1}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg disabled:opacity-50 border border-white/30"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Page
            </Button>

            {/* Page Info */}
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium mb-1 opacity-90">
                Page {currentPage} of {displayTotalPages}
              </span>
              <div className="w-48 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${(currentPage / displayTotalPages) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Next Button */}
            <Button
              onClick={onNextPage}
              disabled={currentPage >= displayTotalPages}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg disabled:opacity-50 border border-white/30"
            >
              Next Page
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Professional Judgment Card Component
interface JudgmentCardProps {
  judgment: Judgment;
  getCoverImage: (judgment: Judgment) => string;
  handleImageError: (judgmentId: string, imageUrl: string) => void;
  getDefaultCoverImage: (judgment: Judgment) => string;
  getCategoryBadgeColor: (category: string) => string;
  truncateText: (text: string, maxLength: number) => string;
  handleReadText: (judgment: Judgment) => void;
  handleViewPDF: (judgment: Judgment) => void;
}

const JudgmentCard = ({ 
  judgment, 
  getCoverImage, 
  handleImageError, 
  getDefaultCoverImage,
  getCategoryBadgeColor,
  truncateText,
  handleReadText,
  handleViewPDF
}: JudgmentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const coverImageUrl = getCoverImage(judgment);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getCaseTypeIcon = (caseType: string) => {
    const icons: Record<string, any> = {
      "Civil": <Scale className="h-3.5 w-3.5" />,
      "Criminal": <Shield className="h-3.5 w-3.5" />,
      "Constitutional": <Award className="h-3.5 w-3.5" />,
      "Family": <User className="h-3.5 w-3.5" />,
      "Commercial": <FileCheck className="h-3.5 w-3.5" />,
      "Administrative": <Layers className="h-3.5 w-3.5" />,
      "Labor": <FileSearch className="h-3.5 w-3.5" />,
    };
    return icons[caseType] || <Scale className="h-3.5 w-3.5" />;
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-[#E8E2D6] hover:border-[#8B4513]/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ backgroundColor: COLOR_SCHEME.backgrounds.secondary }}
    >
      {/* Cover Image Container */}
      <div className="relative h-48 overflow-hidden">
        {/* Main Image with Gradient Overlay */}
        <img
          src={coverImageUrl}
          alt={`${judgment.citation} cover`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            handleImageError(judgment._id, target.src);
            target.src = getDefaultCoverImage(judgment);
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-[#8B4513]/20 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {/* Case Type Badge */}
          <Badge className={`${getCategoryBadgeColor(judgment.caseType)} px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm`}>
            <div className="flex items-center gap-1.5">
              {getCaseTypeIcon(judgment.caseType)}
              <span>{judgment.caseType}</span>
            </div>
          </Badge>
          
          {/* Court Badge */}
          <Badge className="bg-white/20 backdrop-blur-md text-white px-2.5 py-1.5 rounded-full text-xs font-semibold border border-white/30 shadow-lg">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>{judgment.court?.split(" ")[0] || 'Court'}</span>
            </div>
          </Badge>
        </div>
        
        {/* Year Badge */}
        <div className="absolute bottom-4 right-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] flex items-center justify-center shadow-2xl border-2 border-white/40">
            <span className="text-xs font-bold text-gray-900">{judgment.year}</span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <User className="h-3.5 w-3.5 text-white/90" />
              <span className="text-xs font-medium text-white">
                {judgment.judge?.split(',')[0]?.split(' ')[0] || "Judge"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Calendar className="h-3.5 w-3.5 text-white/90" />
              <span className="text-xs font-medium text-white">
                {formatDate(judgment.createdAt)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Floating Action Button */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="flex items-center gap-2">
            {judgment.textFile && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReadText(judgment);
                }}
                className="bg-white hover:bg-white text-gray-800 font-medium rounded-full px-4 py-2.5 shadow-xl hover:scale-105 transition-transform"
              >
                <BookOpen className="h-4 w-4 mr-1.5" />
                Read Text
              </Button>
            )}
            {judgment.pdfFile && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewPDF(judgment);
                }}
                className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#A0522D] hover:to-[#8B4513] text-white font-medium rounded-full px-4 py-2.5 shadow-xl hover:scale-105 transition-transform"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                View PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Case Citation */}
        <div className="mb-3">
          <h3 className="font-bold text-[#2C1810] text-lg leading-tight line-clamp-2 group-hover:text-[#8B4513] transition-colors duration-300">
            {judgment.citation}
          </h3>
        </div>
        
        {/* Case Title */}
        <p className="text-sm text-[#4A3520] mb-4 leading-relaxed line-clamp-2">
          {truncateText(judgment.caseTitle || judgment.parties, 100)}
        </p>
        
        {/* Action Buttons - Always Visible */}
        <div className="flex items-center gap-2 mb-4">
          {judgment.textFile && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleReadText(judgment);
              }}
              className="flex-1 border-[#E8E2D6] text-[#4A3520] hover:bg-[#F5F2EB] hover:text-[#8B4513] hover:border-[#8B4513] transition-all duration-300"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Read
            </Button>
          )}
          {judgment.pdfFile && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewPDF(judgment);
              }}
              className="flex-1 bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#A0522D] hover:to-[#8B4513] text-white font-medium transition-all duration-300"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
          )}
        </div>
        
        {/* Metadata Footer */}
        <div className="pt-3 border-t border-[#E8E2D6]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-[#7A6956] font-medium">Available</span>
              </div>
              {judgment.caseNumber && (
                <span className="text-xs text-[#7A6956] font-medium">
                  • Case {judgment.caseNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-[#7A6956]" />
              <span className="text-xs text-[#7A6956] font-medium">View</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-16 h-1 bg-gradient-to-r from-[#8B4513] to-[#D4AF37]"></div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B4513] to-[#D4AF37] transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
      
      {/* Hover Effect Border */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#8B4513]/20 transition-all duration-500 pointer-events-none`}></div>
      
      {/* File Indicators */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        {judgment.textFile && (
          <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <BookOpen className="h-3 w-3 text-white" />
          </div>
        )}
        {judgment.pdfFile && (
          <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <FileText className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

// Main JudgmentSection Component
const JudgmentSection = () => {
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [selectedJudgment, setSelectedJudgment] = useState<Judgment | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeFileType, setActiveFileType] = useState<"text" | "pdf" | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Categories with design theme
  const categories = [
    { _id: "all", name: "All Judgments", color: "from-[#8B4513] to-[#D4AF37]" },
    { _id: "Civil", name: "Civil Cases", color: "from-[#8B4513] to-[#A0522D]" },
    { _id: "Criminal", name: "Criminal Cases", color: "from-[#800020] to-[#8B4513]" },
    { _id: "Constitutional", name: "Constitutional", color: "from-[#1A365D] to-[#2E8B57]" },
    { _id: "Family", name: "Family Cases", color: "from-[#A0522D] to-[#800020]" },
    { _id: "Commercial", name: "Commercial", color: "from-[#1A365D] to-[#D4AF37]" },
    { _id: "Administrative", name: "Administrative", color: "from-[#2E8B57] to-[#1A365D]" },
    { _id: "Labor", name: "Labor", color: "from-[#800020] to-[#D4AF37]" },
  ];

  // Fetch judgments - EXACTLY THE SAME WORKING LOGIC
  const fetchJudgments = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching judgments for category:', activeTab);

      const filters: JudgmentFilters = {
        page: 1,
        limit: 8,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (activeTab !== "all") {
        filters.caseType = activeTab;
      }

      const response = await JudgmentService.getAllJudgments(filters);
      console.log('📊 Judgments API response:', response);

      if (response.success && response.data) {
        setJudgments(response.data.judgments);
        console.log('✅ Loaded judgments:', response.data.judgments.length);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load judgments",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching judgments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load judgments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    fetchJudgments();
  }, [fetchJudgments]);

  const handleImageError = useCallback((judgmentId: string, imageUrl: string) => {
    console.log('❌ Image failed to load:', imageUrl);
    setImageErrors(prev => ({ ...prev, [judgmentId]: true }));
  }, []);

  // ORIGINAL WORKING getCoverImage LOGIC
  const getCoverImage = useCallback((judgment: Judgment): string => {
    if (imageErrors[judgment._id]) {
      console.log('🔄 Using default image for errored judgment:', judgment._id);
      return getDefaultCoverImage(judgment);
    }

    if (!judgment.coverImages || !Array.isArray(judgment.coverImages) || judgment.coverImages.length === 0) {
      console.log('ℹ️ No cover images for judgment:', judgment._id);
      return getDefaultCoverImage(judgment);
    }

    const coverImage = judgment.coverImages[0];
    console.log('🔍 Processing cover image:', {
      judgmentId: judgment._id,
      coverImage: coverImage,
      isArray: Array.isArray(judgment.coverImages),
      imageType: typeof coverImage
    });

    let imageUrl = coverImage;

    if (coverImage.startsWith('http')) {
      console.log('🌐 Using full HTTP URL:', coverImage);
      return coverImage;
    }

    if (coverImage.startsWith('/uploads/')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      imageUrl = `${apiUrl}${coverImage}`;
      console.log('🔗 Constructed URL from /uploads/ path:', imageUrl);
      return imageUrl;
    }

    if (coverImage && !coverImage.includes('/')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      imageUrl = `${apiUrl}/uploads/covers/${coverImage}`;
      console.log('📁 Constructed URL from filename:', imageUrl);
      return imageUrl;
    }

    console.log('⚠️ Using cover image as-is:', coverImage);
    return coverImage;
  }, [imageErrors]);

  // Clean default cover image
  const getDefaultCoverImage = (judgment: Judgment): string => {
    const caseType = judgment.caseType || 'Case';
    const year = judgment.year || new Date().getFullYear();
    
    const colors: Record<string, string> = {
      "Civil": "#8B4513",
      "Criminal": "#800020",
      "Constitutional": "#1A365D",
      "Family": "#A0522D",
      "Commercial": "#2C3E50",
      "Administrative": "#2E8B57",
      "Labor": "#5D4037",
      "default": "#8B4513"
    };
    
    const bgColor = colors[caseType] || colors.default;
    
    const svgContent = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="${bgColor}" opacity="0.9"/>
        
        <rect x="50" y="50" width="300" height="200" rx="8" fill="white" opacity="0.2"/>
        
        <!-- Book icon -->
        <rect x="170" y="100" width="60" height="100" rx="4" fill="white" opacity="0.3"/>
        <rect x="172" y="102" width="56" height="96" rx="3" fill="white" opacity="0.4"/>
        
        <!-- Text -->
        <g fill="white" text-anchor="middle" font-family="Arial, sans-serif">
          <text x="200" y="160" font-size="16" font-weight="bold" opacity="0.9">
            ${caseType}
          </text>
          <text x="200" y="190" font-size="14" font-weight="500" opacity="0.8">
            ${year}
          </text>
        </g>
        
        <!-- Border -->
        <rect x="40" y="40" width="320" height="220" rx="12" fill="none" stroke="white" stroke-width="2" stroke-opacity="0.3"/>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  // ORIGINAL WORKING FUNCTIONS
  const handleReadText = useCallback(
    async (judgment: Judgment) => {
      try {
        setLoadingFile(true);
        setSelectedJudgment(judgment);
        setTextContent("");
        setCurrentPage(1);
        setActiveFileType("text");
        setFilePreviewOpen(true);

        if (!judgment.textFile) {
          throw new Error("No text file available");
        }

        let textFileUrl = judgment.textFile;
        if (textFileUrl.startsWith('/uploads/')) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          textFileUrl = `${apiUrl}${textFileUrl}`;
        }

        console.log('📄 Loading text file from:', textFileUrl);
        const response = await axios.get(textFileUrl, { 
          responseType: "text",
          timeout: 10000 
        });

        if (!response.data) {
          throw new Error("Text file is empty");
        }

        setTextContent(response.data);
      } catch (error: any) {
        console.error('❌ Error loading text file:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load text file",
          variant: "destructive",
        });
        setTextContent("Error: Could not load text file.");
      } finally {
        setLoadingFile(false);
      }
    },
    [toast]
  );

  const handleViewPDF = useCallback(
    (judgment: Judgment) => {
      if (!judgment.pdfFile) {
        toast({
          title: "Error",
          description: "No PDF file available",
          variant: "destructive",
        });
        return;
      }
      
      let pdfFileUrl = judgment.pdfFile;
      if (pdfFileUrl.startsWith('/uploads/')) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        pdfFileUrl = `${apiUrl}${pdfFileUrl}`;
      }
      
      setSelectedJudgment(judgment);
      setActiveFileType("pdf");
      setFilePreviewOpen(true);
    },
    [toast]
  );

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const downloadFile = useCallback((filePath: string, filename: string) => {
    let downloadUrl = filePath;
    if (filePath.startsWith('/uploads/')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      downloadUrl = `${apiUrl}${filePath}`;
    }
    
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const truncateText = useCallback((text: string, maxLength: number): string => {
    if (!text) return "Legal judgment document";
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  }, []);

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      "Civil": "bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white",
      "Criminal": "bg-gradient-to-r from-[#800020] to-[#DC2626] text-white",
      "Constitutional": "bg-gradient-to-r from-[#1A365D] to-[#2E8B57] text-white",
      "Family": "bg-gradient-to-r from-[#A0522D] to-[#800020] text-white",
      "Commercial": "bg-gradient-to-r from-[#2C3E50] to-[#1A365D] text-white",
      "Administrative": "bg-gradient-to-r from-[#2E8B57] to-[#1A365D] text-white",
      "Labor": "bg-gradient-to-r from-[#5D4037] to-[#8B4513] text-white",
    };
    return colors[category] || "bg-gradient-to-r from-[#8B4513] to-[#D4AF37] text-white";
  };

  if (loading) {
    return (
      <section 
        className="min-h-screen py-20"
        style={{ background: COLOR_SCHEME.gradients.primary }}
      >
        <div className="container mx-auto px-4 text-center">
          <Scale className="h-20 w-20 mb-6 mx-auto text-[#8B4513]" />
          <h2 className="text-4xl font-bold mb-4 text-[#2C1810]">
            Legal Judgments
          </h2>
          <p className="text-lg text-[#4A3520] mb-8">
            Loading Court Rulings & Case Law
          </p>
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#8B4513] rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-[#7A6956]">
            Loading judgments...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="min-h-screen py-16"
      style={{ background: COLOR_SCHEME.gradients.primary }}
    >
      <div className="container mx-auto px-4">
        {/* Header Section with Design Theme */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#8B4513]/10 to-[#D4AF37]/10 rounded-full blur-xl"></div>
            <Scale className="h-16 w-16 relative z-10 text-[#8B4513]" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-[#2C1810]">
            Legal Judgments
          </h1>
          <p className="text-lg text-[#4A3520] max-w-2xl mx-auto">
            Explore comprehensive court rulings and case law across various legal categories.
          </p>
        </div>

        {/* Category Filter with Design Theme */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category._id}
              variant={activeTab === category._id ? "default" : "outline"}
              onClick={() => setActiveTab(category._id)}
              size="lg"
              className={`
                rounded-lg px-6 py-3 font-medium transition-all duration-300
                ${activeTab === category._id 
                  ? `bg-gradient-to-r ${category.color} text-white hover:opacity-90` 
                  : "border-[#E8E2D6] text-[#4A3520] hover:bg-[#F5F2EB] hover:border-[#8B4513]"
                }
              `}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Judgments Grid with NEW Professional Card Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
          {judgments.map((judgment) => (
            <JudgmentCard
              key={judgment._id}
              judgment={judgment}
              getCoverImage={getCoverImage}
              handleImageError={handleImageError}
              getDefaultCoverImage={getDefaultCoverImage}
              getCategoryBadgeColor={getCategoryBadgeColor}
              truncateText={truncateText}
              handleReadText={handleReadText}
              handleViewPDF={handleViewPDF}
            />
          ))}
        </div>

        {/* Empty State with Design Theme */}
        {judgments.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg border border-[#E8E2D6] p-8 max-w-md mx-auto" style={{ backgroundColor: COLOR_SCHEME.backgrounds.secondary }}>
              <Scale className="h-16 w-16 mx-auto mb-4 text-[#7A6956]" />
              <h3 className="text-xl font-bold mb-3 text-[#2C1810]">
                No Judgments Found
              </h3>
              <p className="text-[#4A3520] mb-6">
                No judgments found for the selected category.
              </p>
              <Button 
                onClick={() => setActiveTab("all")}
                className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#A0522D] hover:to-[#8B4513] text-white font-medium px-6 py-3 rounded-lg"
              >
                View All Judgments
              </Button>
            </div>
          </div>
        )}

        {/* File Preview Dialog with Design Theme */}
        <Dialog open={filePreviewOpen} onOpenChange={setFilePreviewOpen}>
          <DialogContent className="max-w-6xl w-[90vw] h-[80vh] p-0 overflow-hidden">
            <div className="flex flex-col h-full rounded-lg overflow-hidden border border-[#E8E2D6]" style={{ backgroundColor: COLOR_SCHEME.backgrounds.secondary }}>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white">
                <div className="flex items-center gap-3">
                  {activeFileType === "text" ? (
                    <BookOpen className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                  <div>
                    <DialogTitle className="text-lg font-bold text-white">
                      {selectedJudgment?.citation}
                    </DialogTitle>
                    <DialogDescription className="text-white/90 text-sm">
                      {selectedJudgment?.court} • {selectedJudgment?.caseType}
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeFileType === "text" && selectedJudgment?.textFile && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadFile(selectedJudgment.textFile, `${selectedJudgment.citation}.txt`)}
                      className="bg-white/20 hover:bg-white/30 text-white border-0 font-medium px-3 py-2 rounded"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  {activeFileType === "pdf" && selectedJudgment?.pdfFile && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadFile(selectedJudgment.pdfFile, `${selectedJudgment.citation}.pdf`)}
                      className="bg-white/20 hover:bg-white/30 text-white border-0 font-medium px-3 py-2 rounded"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setFilePreviewOpen(false)}
                    className="bg-white/20 hover:bg-white/30 text-white border-0 rounded"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                {activeFileType === "text" ? (
                  <BookTextViewer
                    content={textContent}
                    currentPage={currentPage}
                    totalPages={Math.ceil(textContent.length / 2000)}
                    onNextPage={nextPage}
                    onPrevPage={prevPage}
                    judgment={selectedJudgment}
                  />
                ) : activeFileType === "pdf" && selectedJudgment?.pdfFile ? (
                  (() => {
                    let pdfFileUrl = selectedJudgment.pdfFile;
                    if (pdfFileUrl.startsWith('/uploads/')) {
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                      pdfFileUrl = `${apiUrl}${pdfFileUrl}`;
                    }
                    return <PDFViewer fileUrl={pdfFileUrl} />;
                  })()
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-bold mb-2 text-gray-900">
                        No File Available
                      </h3>
                      <p className="text-gray-600">
                        This judgment doesn't have a file to display.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default JudgmentSection;