import { useState, useEffect, useCallback } from 'react';
import { Volume2, HelpCircle, X } from 'lucide-react';
import { StudyQuestion, DifficultyRating } from '@/types/vocabulary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReviewPanel } from './ReviewPanel';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: StudyQuestion;
  onAnswer: (answer: string, difficulty: DifficultyRating) => boolean;
  onSkip: () => void;
  onNext: () => void;
}

export function QuestionCard({ question, onAnswer, onSkip, onNext }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setTypedAnswer('');
    setIsSubmitted(false);
    setIsCorrect(null);
    setShowResultModal(false);
  }, [question.id]);

  // TTS function
  const speak = useCallback((text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }, []);

  // Auto-play audio for dictation type
  useEffect(() => {
    if (question.type === 'dictation' && !isSubmitted) {
      const timer = setTimeout(() => speak(question.word.vocabulary), 500);
      return () => clearTimeout(timer);
    }
  }, [question.id, question.type, question.word.vocabulary, isSubmitted, speak]);

  // Submit answer and show feedback - DO NOT advance
  const handleSubmitAnswer = (answer: string) => {
    if (isSubmitted) return;

    const correct = onAnswer(answer, 'good');
    setIsCorrect(correct);
    setIsSubmitted(true);
    setShowResultModal(true);
  };

  // Continue - ONLY now advance
  const handleContinue = () => {
    setShowResultModal(false);
    onNext();
  };

  // Handle option click - ONLY select/highlight (do not submit)
  const handleOptionClick = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmitSelectedOption = () => {
    if (isSubmitted) return;
    if (!selectedOption) return;
    handleSubmitAnswer(selectedOption);
  };

  // Handle typed answer submission
  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim() || isSubmitted) return;
    handleSubmitAnswer(typedAnswer);
  };

  // Handle "I don't know" - treat as incorrect, show feedback
  const handleSkip = () => {
    if (isSubmitted) return;
    onSkip();
    setIsCorrect(false);
    setIsSubmitted(true);
    setShowResultModal(true);
  };

  const getOptionVariant = (option: string) => {
    if (!isSubmitted) {
      return selectedOption === option ? 'optionSelected' : 'option';
    }
    if (option === question.correctAnswer) return 'optionCorrect';
    if (option === selectedOption && !isCorrect) return 'optionIncorrect';
    return 'option';
  };

  const getTypeLabel = () => {
    switch (question.type) {
      case 'gap_fill_text':
        return 'Fill in the Blank';
      case 'gap_fill_audio':
        return 'Listen & Fill';
      case 'context_meaning':
        return 'Context Meaning';
      case 'simple_meaning':
        return 'Vocabulary';
      case 'dictation':
        return 'Dictation';
      case 'translation':
        return 'Translation';
      default:
        return question.type;
    }
  };

  // Render different question formats
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'gap_fill_text':
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Fill in the blank:</p>
            <p className="text-xl md:text-2xl font-medium leading-relaxed">{question.clozeText}</p>
          </div>
        );

      case 'gap_fill_audio':
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Listen and fill in the blank:</p>
            <p className="text-xl md:text-2xl font-medium leading-relaxed mb-4">{question.clozeText}</p>
            <p className="text-sm text-muted-foreground">Click options to hear the word</p>
          </div>
        );

      case 'context_meaning':
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">What does the underlined word mean?</p>
            <p
              className="text-xl md:text-2xl font-medium leading-relaxed"
              dangerouslySetInnerHTML={{
                __html:
                  question.underlinedText?.replace(
                    /<u>(.*?)<\/u>/g,
                    '<span class="underline decoration-2 decoration-primary underline-offset-4 font-bold text-primary">$1</span>'
                  ) || question.question,
              }}
            />
          </div>
        );

      case 'simple_meaning':
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">What does this word mean?</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-3xl md:text-4xl font-bold text-primary">{question.word.vocabulary}</p>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10"
                onClick={() => speak(question.word.vocabulary)}
              >
                <Volume2 className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </div>
        );

      case 'dictation':
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Listen and type the word:</p>
            <button
              onClick={() => speak(question.word.vocabulary)}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all',
                'bg-primary/10 hover:bg-primary/20 active:scale-95 border-2 border-primary/20'
              )}
            >
              <Volume2 className="h-10 w-10 text-primary" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => speak(question.word.vocabulary)}
              className="text-muted-foreground"
            >
              Play again
            </Button>
          </div>
        );

      case 'translation':
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Type the English word for:</p>
            <p className="text-2xl md:text-3xl font-bold text-primary">"{question.word.meaning_vi}"</p>
          </div>
        );

      default:
        return <p className="text-xl md:text-2xl font-medium text-center">{question.question}</p>;
    }
  };

  // Render answer options based on type
  const renderAnswerInput = () => {
    const hasOptions = ['gap_fill_text', 'gap_fill_audio', 'context_meaning', 'simple_meaning'].includes(question.type);
    const isTyped = ['dictation', 'translation'].includes(question.type);
    const isAudioOptions = question.type === 'gap_fill_audio';

    if (hasOptions && question.options) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant={getOptionVariant(option)}
              className="w-full rounded-xl py-6 min-h-[60px]"
              onClick={() => handleOptionClick(option)}
              disabled={isSubmitted}
            >
              {isAudioOptions ? (
                <div className="flex items-center gap-2 w-full justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(option);
                    }}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{String.fromCharCode(65 + index)}</span>
                </div>
              ) : (
                <>
                  <span className="font-medium mr-2 opacity-60">{String.fromCharCode(65 + index)}.</span>
                  <span className="text-left flex-1">{option}</span>
                </>
              )}
            </Button>
          ))}
        </div>
      );
    }

    if (isTyped) {
      return (
        <form onSubmit={handleTypedSubmit} className="mb-6">
          <div className="flex gap-3">
            <Input
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="text-lg h-12 rounded-xl"
              autoFocus
              disabled={isSubmitted}
            />
            <Button
              type="submit"
              disabled={!typedAnswer.trim() || isSubmitted}
              size="lg"
              className="rounded-xl"
            >
              Submit
            </Button>
          </div>
        </form>
      );
    }

    return null;
  };


  const hasOptionsQuestion = ['gap_fill_text', 'gap_fill_audio', 'context_meaning', 'simple_meaning'].includes(question.type);

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto animate-scale-in overflow-hidden rounded-3xl">
        <CardContent className="p-6 md:p-8">
          {/* Question type badge */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wide">
              {getTypeLabel()}
            </span>
          </div>

          {/* Question content */}
          <div className="mb-8">{renderQuestionContent()}</div>

          {/* Answer options/input (locked after submit) */}
          {renderAnswerInput()}

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            {!isSubmitted ? (
              <>
                {hasOptionsQuestion && (
                  <Button
                    onClick={handleSubmitSelectedOption}
                    size="lg"
                    className="rounded-full px-10"
                    disabled={!selectedOption}
                  >
                    Submit
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground rounded-full"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  I don't know
                </Button>
              </>
            ) : (
              <Button onClick={handleContinue} size="lg" className="rounded-full px-8">
                Continue →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result popup/modal (shown after submit). Closing it does NOT advance; Continue does. */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg">Answer feedback</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowResultModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {isCorrect !== null && (
            <ReviewPanel
              word={question.word}
              isCorrect={!!isCorrect}
              correctAnswer={question.correctAnswer}
              onContinue={handleContinue}
              // keep flow strict: never auto-advance via difficulty buttons
              showDifficulty={false}
              onDifficultySelect={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
