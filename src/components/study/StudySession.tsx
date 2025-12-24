import { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { VocabularyWord, DifficultyRating } from '@/types/vocabulary';
import { useStudySession } from '@/hooks/useStudySession';
import { QuestionCard } from './QuestionCard';
import { SessionSummary } from './SessionSummary';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface StudySessionProps {
  words: VocabularyWord[];
  onUpdateWord: (wordId: string, isCorrect: boolean, difficulty: DifficultyRating) => void;
  onClose: () => void;
}

export function StudySession({ words, onUpdateWord, onClose }: StudySessionProps) {
  const {
    isActive,
    currentQuestion,
    currentIndex,
    totalQuestions,
    answeredCount,
    progress,
    sessionResult,
    startSession,
    submitAnswer,
    skipQuestion,
    nextQuestion,
    endSession,
    resetSession,
  } = useStudySession(words, onUpdateWord);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const handleAnswer = (answer: string, difficulty: DifficultyRating) => {
    return submitAnswer(answer, difficulty);
  };

  const handleNext = () => {
    const hasMore = nextQuestion();
    if (!hasMore) {
      endSession();
    }
  };

  if (sessionResult) {
    return (
      <SessionSummary
        result={sessionResult}
        onRestart={() => {
          resetSession();
          startSession();
        }}
        onClose={onClose}
      />
    );
  }

  if (!isActive || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing your study session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => endSession()} className="rounded-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit
            </Button>
            
            <span className="text-sm font-medium text-muted-foreground">
              {currentIndex + 1} / {totalQuestions}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => endSession()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Progress value={progress} className="h-2 rounded-full" />
        </div>
      </header>

      {/* Question area */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          onSkip={skipQuestion}
          onNext={handleNext}
        />
      </main>
    </div>
  );
}