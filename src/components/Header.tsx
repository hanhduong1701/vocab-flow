import { BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  totalWords: number;
}

export function Header({ totalWords }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">VocabMaster</h1>
              <p className="text-xs text-muted-foreground">
                {totalWords > 0 ? `${totalWords} words` : 'Start learning'}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
