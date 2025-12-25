import { useState, useMemo } from 'react';
import { Search, Trash2, BookOpen, Clock, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { VocabularyWord } from '@/types/vocabulary';
import { LevelBadge } from './LevelBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface VocabularyListProps {
  words: VocabularyWord[];
  onDelete: (wordId: string) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function VocabularyList({ words, onDelete }: VocabularyListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const topics = useMemo(() => {
    const topicSet = new Set(words.map(w => w.topic).filter(Boolean));
    return Array.from(topicSet) as string[];
  }, [words]);

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const matchesSearch = 
        word.vocabulary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.meaning_vi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.meaning_en.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTopic = !selectedTopic || word.topic === selectedTopic;
      const matchesLevel = selectedLevel === null || word.level === selectedLevel;
      
      return matchesSearch && matchesTopic && matchesLevel;
    });
  }, [words, searchQuery, selectedTopic, selectedLevel]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTopic, selectedLevel, pageSize]);

  const totalPages = Math.ceil(filteredWords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedWords = filteredWords.slice(startIndex, startIndex + pageSize);

  const formatNextReview = (date: Date) => {
    const now = new Date();
    const diff = new Date(date).getTime() - now.getTime();
    
    if (diff < 0) return 'Due now';
    if (diff < 60 * 60 * 1000) return `${Math.ceil(diff / 60000)}m`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.ceil(diff / 3600000)}h`;
    return `${Math.ceil(diff / 86400000)}d`;
  };

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No vocabulary yet</h3>
        <p className="text-sm text-muted-foreground/70">Import a CSV file to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Topic filter */}
          {topics.length > 0 && (
            <select
              value={selectedTopic || ''}
              onChange={(e) => setSelectedTopic(e.target.value || null)}
              className="h-10 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="">All topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          )}
          
          {/* Level filter */}
          <select
            value={selectedLevel ?? ''}
            onChange={(e) => setSelectedLevel(e.target.value ? Number(e.target.value) : null)}
            className="h-10 px-3 rounded-xl border border-input bg-background text-sm"
          >
            <option value="">All levels</option>
            {[1, 2, 3, 4, 5].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-10 px-3 rounded-xl border border-input bg-background text-sm"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        </div>
      </div>

      {/* Word count and pagination info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filteredWords.length)} of {filteredWords.length} words
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Word list */}
      <div className="space-y-2">
        {paginatedWords.map((word) => (
          <Card key={word.id} className="group overflow-hidden rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg">{word.vocabulary}</h3>
                    <LevelBadge level={word.level} size="sm" />
                    {word.topic && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {word.topic}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-1">
                    {word.meaning_vi || word.meaning_en}
                  </p>
                  
                  <p className="text-xs text-muted-foreground/70 italic truncate">
                    "{word.example_en}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right text-xs hidden sm:block">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatNextReview(word.next_review)}
                    </div>
                    <div className="text-muted-foreground/70">
                      {word.correct_count}✓ / {word.incorrect_count}✗
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/10"
                    onClick={() => speak(word.vocabulary)}
                  >
                    <Volume2 className="h-4 w-4 text-primary" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive rounded-full"
                    onClick={() => onDelete(word.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {/* First page */}
            {currentPage > 2 && (
              <>
                <Button
                  variant={currentPage === 1 ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full w-8 h-8 p-0"
                  onClick={() => goToPage(1)}
                >
                  1
                </Button>
                {currentPage > 3 && <span className="px-1 text-muted-foreground">...</span>}
              </>
            )}
            
            {/* Page numbers around current */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              if (pageNum < 1 || pageNum > totalPages) return null;
              if (pageNum === 1 && currentPage > 2) return null;
              if (pageNum === totalPages && currentPage < totalPages - 1) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full w-8 h-8 p-0"
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            {/* Last page */}
            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && <span className="px-1 text-muted-foreground">...</span>}
                <Button
                  variant={currentPage === totalPages ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full w-8 h-8 p-0"
                  onClick={() => goToPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
