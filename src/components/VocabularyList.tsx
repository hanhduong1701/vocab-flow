import { useState, useMemo } from 'react';
import { Search, Filter, Trash2, BookOpen, Clock } from 'lucide-react';
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

export function VocabularyList({ words, onDelete }: VocabularyListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

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

  const formatNextReview = (date: Date) => {
    const now = new Date();
    const diff = new Date(date).getTime() - now.getTime();
    
    if (diff < 0) return 'Due now';
    if (diff < 60 * 60 * 1000) return `${Math.ceil(diff / 60000)}m`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.ceil(diff / 3600000)}h`;
    return `${Math.ceil(diff / 86400000)}d`;
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
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Topic filter */}
          {topics.length > 0 && (
            <select
              value={selectedTopic || ''}
              onChange={(e) => setSelectedTopic(e.target.value || null)}
              className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
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
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
          >
            <option value="">All levels</option>
            {[1, 2, 3, 4, 5].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Word count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredWords.length} of {words.length} words
      </p>

      {/* Word list */}
      <div className="space-y-2">
        {filteredWords.map((word) => (
          <Card key={word.id} className="group overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{word.vocabulary}</h3>
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

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
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
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
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
    </div>
  );
}
