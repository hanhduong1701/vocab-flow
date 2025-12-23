import { useState, useEffect } from 'react';
import { Volume2, HelpCircle } from 'lucide-react';
import { StudyQuestion, DifficultyRating } from '@/types/vocabulary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: StudyQuestion;
  onAnswer: (answer: string, difficulty: DifficultyRating) => boolean | undefined;
  onSkip: () => void;
  onNext: () => void;
}

export function QuestionCard({ question, onAnswer, onSkip, onNext }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showDifficulty, setShowDifficulty] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setTypedAnswer('');
    setIsAnswered(false);
    setIsCorrect(null);
    setShowDifficulty(false);
  }, [question.id]);

  // TTS for listening questions
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (question.type === 'listening' && !isAnswered) {
      // Auto-play on mount for listening questions
      const timer = setTimeout(() => speak(question.word.vocabulary), 500);
      return () => clearTimeout(timer);
    }
  }, [question.id, question.type, question.word.vocabulary, isAnswered]);

  const handleSubmit = (answer: string) => {
    if (isAnswered) return;
    
    const correct = onAnswer(answer, 'good');
    setIsCorrect(correct ?? false);
    setIsAnswered(true);
    setShowDifficulty(correct === true);
  };

  const handleDifficultyAndNext = (difficulty: DifficultyRating) => {
    // Re-submit with proper difficulty
    onAnswer(selectedOption || typedAnswer, difficulty);
    onNext();
  };

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    handleSubmit(option);
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;
    handleSubmit(typedAnswer);
  };

  const getOptionVariant = (option: string) => {
    if (!isAnswered) {
      return selectedOption === option ? 'optionSelected' : 'option';
    }
    if (option === question.correctAnswer) return 'optionCorrect';
    if (option === selectedOption && !isCorrect) return 'optionIncorrect';
    return 'option';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto animate-scale-in overflow-hidden">
      <CardContent className="p-6 md:p-8">
        {/* Question type badge */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wide">
            {question.type.replace('_', ' ')}
          </span>
          
          {question.type === 'listening' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak(question.word.vocabulary)}
              disabled={isAnswered}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Play again
            </Button>
          )}
        </div>

        {/* Question content */}
        <div className="mb-8">
          {question.type === 'cloze' ? (
            <div>
              <p className="text-lg text-muted-foreground mb-2">Fill in the blank:</p>
              <p className="text-xl md:text-2xl font-medium leading-relaxed">
                {question.clozeText}
              </p>
            </div>
          ) : question.type === 'listening' ? (
            <div className="text-center">
              <button
                onClick={() => speak(question.word.vocabulary)}
                disabled={isAnswered}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all",
                  "bg-primary/10 hover:bg-primary/20 active:scale-95",
                  isAnswered && "opacity-50"
                )}
              >
                <Volume2 className="h-10 w-10 text-primary" />
              </button>
              <p className="text-lg text-muted-foreground">
                {question.question}
              </p>
            </div>
          ) : question.type === 'active_recall' ? (
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Type the English word for:
              </p>
              <p className="text-2xl md:text-3xl font-medium text-primary">
                "{question.word.meaning_vi}"
              </p>
            </div>
          ) : (
            <p className="text-xl md:text-2xl font-medium text-center">
              {question.question}
            </p>
          )}
        </div>

        {/* Answer options */}
        {(question.type === 'multiple_choice' || question.type === 'listening') && question.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={getOptionVariant(option)}
                className="w-full"
                onClick={() => handleOptionClick(option)}
                disabled={isAnswered}
              >
                <span className="font-medium mr-2 opacity-60">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>
        )}

        {/* Text input for cloze and active recall */}
        {(question.type === 'cloze' || question.type === 'active_recall') && (
          <form onSubmit={handleTypedSubmit} className="mb-6">
            <div className="flex gap-3">
              <Input
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type your answer..."
                disabled={isAnswered}
                className="text-lg h-12"
                autoFocus
              />
              <Button 
                type="submit" 
                disabled={isAnswered || !typedAnswer.trim()}
                size="lg"
              >
                Check
              </Button>
            </div>
          </form>
        )}

        {/* Feedback */}
        {isAnswered && (
          <div className={cn(
            "p-4 rounded-xl mb-6 animate-slide-up",
            isCorrect 
              ? "bg-success/10 border border-success/30" 
              : "bg-destructive/10 border border-destructive/30"
          )}>
            <p className={cn(
              "font-semibold text-lg mb-1",
              isCorrect ? "text-success" : "text-destructive"
            )}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            {!isCorrect && (
              <p className="text-foreground">
                The answer is: <span className="font-medium">{question.correctAnswer}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2 italic">
              "{question.word.example_en}"
            </p>
          </div>
        )}

        {/* Difficulty rating (only for correct answers) */}
        {showDifficulty && (
          <div className="space-y-3 animate-slide-up">
            <p className="text-center text-sm text-muted-foreground">How easy was this?</p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => handleDifficultyAndNext('hard')}
                className="flex-1 max-w-[120px]"
              >
                Hard
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDifficultyAndNext('good')}
                className="flex-1 max-w-[120px]"
              >
                Good
              </Button>
              <Button
                variant="default"
                onClick={() => handleDifficultyAndNext('easy')}
                className="flex-1 max-w-[120px]"
              >
                Easy
              </Button>
            </div>
          </div>
        )}

        {/* Continue button for wrong answers */}
        {isAnswered && !isCorrect && (
          <div className="flex justify-center">
            <Button onClick={onNext} size="lg">
              Continue
            </Button>
          </div>
        )}

        {/* Skip button (only when not answered) */}
        {!isAnswered && (
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSkip();
                setIsAnswered(true);
                setIsCorrect(false);
              }}
              className="text-muted-foreground"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              I don't know
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
