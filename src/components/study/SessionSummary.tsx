import { Trophy, TrendingUp, TrendingDown, Clock, RotateCcw, Home, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProgressRing } from '@/components/ProgressRing';
import { LevelBadge } from '@/components/LevelBadge';
import { VocabularyWord } from '@/types/vocabulary';
import { cn } from '@/lib/utils';

interface SessionResult {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  wordsLeveledUp: VocabularyWord[];
  wordsLeveledDown: VocabularyWord[];
  incorrectWords: VocabularyWord[];
  duration: number;
}

interface SessionSummaryProps {
  result: SessionResult;
  onRestart: () => void;
  onClose: () => void;
}

export function SessionSummary({ result, onRestart, onClose }: SessionSummaryProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getAccuracyMessage = (accuracy: number) => {
    if (accuracy >= 90) return { text: "Amazing!", emoji: "🎉" };
    if (accuracy >= 70) return { text: "Great job!", emoji: "✨" };
    if (accuracy >= 50) return { text: "Keep going!", emoji: "💪" };
    return { text: "Don't give up!", emoji: "🌱" };
  };

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  const { text: message, emoji } = getAccuracyMessage(result.accuracy);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg animate-bounce-in rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-2 bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent">
          <div className="text-5xl mb-4">{emoji}</div>
          <CardTitle className="text-2xl">{message}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* Accuracy ring */}
          <div className="flex justify-center">
            <ProgressRing progress={result.accuracy} size={140} strokeWidth={10}>
              <div className="text-center">
                <p className="text-3xl font-bold">{Math.round(result.accuracy)}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </ProgressRing>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-success/10">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold text-success">{result.correctAnswers}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary">
              <p className="text-2xl font-bold">{result.totalQuestions}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatDuration(result.duration)}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </div>

          {/* Words leveled up */}
          {result.wordsLeveledUp.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-success">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {result.wordsLeveledUp.length} words leveled up!
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.wordsLeveledUp.slice(0, 5).map(word => (
                  <div
                    key={word.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-sm"
                  >
                    <span>{word.vocabulary}</span>
                    <LevelBadge level={Math.min(word.level + 1, 5)} showLabel={false} size="sm" />
                  </div>
                ))}
                {result.wordsLeveledUp.length > 5 && (
                  <span className="text-sm text-muted-foreground px-2 py-1">
                    +{result.wordsLeveledUp.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Incorrect words section */}
          {result.incorrectWords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-warning">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {result.incorrectWords.length} words to review
                </span>
              </div>
              
              <ScrollArea className="h-[200px] rounded-2xl border bg-muted/30 p-1">
                <div className="space-y-2 p-2">
                  {result.incorrectWords.map(word => (
                    <div
                      key={word.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{word.vocabulary}</p>
                        <p className="text-sm text-muted-foreground truncate">{word.meaning_vi}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-full hover:bg-primary/10"
                        onClick={() => speak(word.vocabulary)}
                      >
                        <Volume2 className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={onClose}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              className="flex-1 rounded-full"
              onClick={onRestart}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Study Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
