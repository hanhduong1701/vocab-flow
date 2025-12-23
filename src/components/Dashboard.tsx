import { useState } from 'react';
import { 
  BookOpen, 
  Upload, 
  Play, 
  Clock, 
  Zap, 
  Star,
  ChevronRight,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from './ProgressRing';
import { LevelBadge } from './LevelBadge';
import { cn } from '@/lib/utils';

interface DashboardProps {
  stats: {
    total: number;
    dueNow: number;
    dueToday: number;
    newWords: number;
    mastered: number;
    byLevel: Record<number, number>;
  };
  onStartSession: (count: number) => void;
  onShowImport: () => void;
  onShowVocabulary: () => void;
}

export function Dashboard({ stats, onStartSession, onShowImport, onShowVocabulary }: DashboardProps) {
  const [selectedCount, setSelectedCount] = useState(10);

  const masteryPercent = stats.total > 0 
    ? Math.round((stats.mastered / stats.total) * 100) 
    : 0;

  const studyCounts = [5, 10, 20, 30];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero section */}
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Ready to learn?
        </h1>
        <p className="text-muted-foreground">
          {stats.dueNow > 0 
            ? `You have ${stats.dueNow} words waiting for review`
            : stats.total > 0 
              ? "Great job! No words due right now"
              : "Import vocabulary to start learning"
          }
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{stats.dueNow}</p>
            <p className="text-xs text-muted-foreground">Due Now</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold">{stats.dueToday}</p>
            <p className="text-xs text-muted-foreground">Due Today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{stats.newWords}</p>
            <p className="text-xs text-muted-foreground">New Words</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{stats.mastered}</p>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>
      </div>

      {/* Start study session */}
      {stats.total > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Start Study Session
            </CardTitle>
            <CardDescription>
              Choose how many words to study
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {studyCounts.map(count => (
                <Button
                  key={count}
                  variant={selectedCount === count ? 'default' : 'outline'}
                  onClick={() => setSelectedCount(count)}
                  disabled={count > stats.total}
                >
                  {count} words
                </Button>
              ))}
            </div>
            
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => onStartSession(selectedCount)}
              disabled={stats.total === 0}
            >
              <Play className="h-5 w-5 mr-2" />
              Start with {Math.min(selectedCount, stats.total)} words
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress overview */}
      {stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ProgressRing progress={masteryPercent} size={120} strokeWidth={8}>
                <div className="text-center">
                  <p className="text-2xl font-bold">{masteryPercent}%</p>
                  <p className="text-xs text-muted-foreground">Mastered</p>
                </div>
              </ProgressRing>
              
              <div className="flex-1 space-y-3 w-full">
                {[1, 2, 3, 4, 5].map(level => {
                  const count = stats.byLevel[level] || 0;
                  const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <LevelBadge level={level} size="sm" className="w-24" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            `level-badge-${level}`
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-10 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow group"
          onClick={onShowImport}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Import Vocabulary</h3>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with your words
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow group"
          onClick={onShowVocabulary}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary">
              <BookOpen className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Browse Vocabulary</h3>
              <p className="text-sm text-muted-foreground">
                {stats.total} words in your library
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
