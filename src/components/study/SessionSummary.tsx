import { Trophy, TrendingUp, TrendingDown, Clock, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (accuracy >= 90) return { text: "Excellent!", emoji: "🎉" };
    if (accuracy >= 70) return { text: "Great job!", emoji: "👏" };
    if (accuracy >= 50) return { text: "Keep practicing!", emoji: "💪" };
    return { text: "Don't give up!", emoji: "🌱" };
  };

  const { text: message, emoji } = getAccuracyMessage(result.accuracy);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg animate-bounce-in">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-4">{emoji}</div>
          <CardTitle className="text-2xl">{message}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
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
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{result.correctAnswers}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{result.totalQuestions}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
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
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success/10 text-sm"
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

          {/* Words needing review */}
          {result.wordsLeveledDown.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-warning">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {result.wordsLeveledDown.length} words need more practice
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.wordsLeveledDown.slice(0, 5).map(word => (
                  <span
                    key={word.id}
                    className="px-2 py-1 rounded-lg bg-warning/10 text-sm"
                  >
                    {word.vocabulary}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              className="flex-1"
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
