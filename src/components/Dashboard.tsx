import { useState } from 'react';
import { 
  BookOpen, 
  Upload, 
  Play, 
  Clock, 
  Zap, 
  Star,
  ChevronRight,
  Flame,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from './ProgressRing';
import { LevelBadge } from './LevelBadge';
import { CSVSource, DailyStats, LearningStreak } from '@/types/vocabulary';
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
  sources: CSVSource[];
  dailyStats: DailyStats[];
  streak: LearningStreak;
  onStartSession: () => void;
  onShowImport: () => void;
  onShowVocabulary: () => void;
  onShowSources: () => void;
  onShowAnalytics: () => void;
}

export function Dashboard({ 
  stats, 
  sources,
  dailyStats,
  streak,
  onStartSession, 
  onShowImport, 
  onShowVocabulary,
  onShowSources,
  onShowAnalytics,
}: DashboardProps) {
  const masteryPercent = stats.total > 0 
    ? Math.round((stats.mastered / stats.total) * 100) 
    : 0;

  const todayStats = dailyStats.find(s => s.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero section */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-secondary-foreground text-sm font-medium mb-4">
          <Flame className="h-4 w-4" />
          {streak.current_streak > 0 ? `${streak.current_streak} day streak!` : 'Start your streak today!'}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Ready to learn? ✨
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{stats.dueNow}</p>
            <p className="text-xs text-muted-foreground">Due Now</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-warning/20 bg-gradient-to-br from-warning/10 to-transparent">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-warning-foreground" />
            <p className="text-2xl font-bold text-warning-foreground">{stats.dueToday}</p>
            <p className="text-xs text-muted-foreground">Due Today</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-accent/20 bg-gradient-to-br from-accent/20 to-transparent">
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-accent-foreground" />
            <p className="text-2xl font-bold text-accent-foreground">{stats.newWords}</p>
            <p className="text-xs text-muted-foreground">New Words</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-success/20 bg-gradient-to-br from-success/20 to-transparent">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2 text-success-foreground" />
            <p className="text-2xl font-bold text-success-foreground">{stats.mastered}</p>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>
      </div>

      {/* Start study session */}
      {stats.total > 0 && (
        <Card className="overflow-hidden rounded-3xl border-primary/20">
          <CardHeader className="bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Play className="h-5 w-5" />
              Ready to Study?
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {stats.dueNow > 0 
                ? `${Math.min(stats.dueNow, 100)} words ready for review`
                : `${Math.min(stats.total, 100)} words available`
              }
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <Button 
              size="lg" 
              className="w-full rounded-full h-14 text-lg font-bold shadow-soft hover:shadow-soft-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={onStartSession}
              disabled={stats.total === 0}
            >
              <Play className="h-6 w-6 mr-2" />
              Start Learning
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Progress saves after each question • Exit anytime
            </p>
          </CardContent>
        </Card>
      )}

      {/* Progress overview */}
      {stats.total > 0 && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Progress
            </CardTitle>
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
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            `level-badge-${level}`
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-10 text-right font-medium">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's activity */}
            {todayStats && (
              <div className="mt-6 p-4 rounded-2xl bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4" />
                  Today's Activity
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">{todayStats.words_studied}</p>
                    <p className="text-xs text-muted-foreground">Studied</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-success-foreground">{todayStats.correct_count}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-destructive-foreground">{todayStats.incorrect_count}</p>
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-soft transition-all group rounded-2xl"
          onClick={onShowImport}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
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
          className="cursor-pointer hover:shadow-soft transition-all group rounded-2xl"
          onClick={onShowVocabulary}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-secondary/30 to-accent/20">
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

        {sources.length > 0 && (
          <Card 
            className="cursor-pointer hover:shadow-soft transition-all group rounded-2xl"
            onClick={onShowSources}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-warning/20 to-accent/20">
                <Upload className="h-6 w-6 text-warning-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Manage Sources</h3>
                <p className="text-sm text-muted-foreground">
                  {sources.length} imported file{sources.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        )}

        {dailyStats.length > 0 && (
          <Card 
            className="cursor-pointer hover:shadow-soft transition-all group rounded-2xl"
            onClick={onShowAnalytics}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-success/20 to-primary/20">
                <TrendingUp className="h-6 w-6 text-success-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Learning Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track your progress
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}