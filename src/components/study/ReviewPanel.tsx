import { Volume2 } from 'lucide-react';
import { VocabularyWord } from '@/types/vocabulary';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewPanelProps {
  word: VocabularyWord;
  isCorrect: boolean;
  correctAnswer: string;
  onContinue: () => void;
  showDifficulty: boolean;
  onDifficultySelect: (difficulty: 'easy' | 'good' | 'hard') => void;
}

export function ReviewPanel({
  word,
  isCorrect,
  correctAnswer,
  onContinue,
  showDifficulty,
  onDifficultySelect,
}: ReviewPanelProps) {
  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="animate-slide-up space-y-4">
      {/* Correct/Incorrect indicator */}
      <div className={cn(
        "p-4 rounded-2xl border-2",
        isCorrect 
          ? "bg-success/10 border-success/30" 
          : "bg-destructive/10 border-destructive/30"
      )}>
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "text-2xl font-bold",
            isCorrect ? "text-success" : "text-destructive"
          )}>
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </span>
        </div>
        {!isCorrect && (
          <p className="text-foreground">
            The answer is: <span className="font-semibold text-primary">{correctAnswer}</span>
          </p>
        )}
      </div>

      {/* Word review card */}
      <div className="bg-secondary/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">{word.vocabulary}</h3>
            <p className="text-muted-foreground font-medium">{word.meaning_vi}</p>
            <p className="text-sm text-muted-foreground">{word.meaning_en}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shrink-0 bg-primary/10 border-primary/30 hover:bg-primary/20"
            onClick={() => speak(word.vocabulary)}
          >
            <Volume2 className="h-5 w-5 text-primary" />
          </Button>
        </div>
        
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm italic text-muted-foreground leading-relaxed">
            "{word.example_en}"
          </p>
          {word.example_vi && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              "{word.example_vi}"
            </p>
          )}
        </div>
      </div>

      {/* Difficulty rating or Continue button */}
      {showDifficulty ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">How easy was this?</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => onDifficultySelect('hard')}
              className="flex-1 max-w-[110px] rounded-full border-warning/50 hover:bg-warning/10"
            >
              😓 Hard
            </Button>
            <Button
              variant="secondary"
              onClick={() => onDifficultySelect('good')}
              className="flex-1 max-w-[110px] rounded-full"
            >
              😊 Good
            </Button>
            <Button
              variant="default"
              onClick={() => onDifficultySelect('easy')}
              className="flex-1 max-w-[110px] rounded-full"
            >
              😎 Easy
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-2">
          <Button 
            onClick={onContinue} 
            size="lg" 
            className="rounded-full px-8"
          >
            Continue →
          </Button>
        </div>
      )}
    </div>
  );
}
