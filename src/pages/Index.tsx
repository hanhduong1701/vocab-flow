import { useState } from 'react';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ImportCSV } from '@/components/ImportCSV';
import { VocabularyList } from '@/components/VocabularyList';
import { StudySession } from '@/components/study/StudySession';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type View = 'dashboard' | 'import' | 'vocabulary' | 'study' | 'sources' | 'analytics';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const {
    words,
    sources,
    dailyStats,
    streak,
    isLoaded,
    importWords,
    deleteSource,
    updateWordAfterReview,
    deleteWord,
    stats,
  } = useVocabulary();

  const handleStartSession = () => {
    if (stats.total === 0) {
      toast.error('No vocabulary to study. Import some words first!');
      return;
    }
    setCurrentView('study');
  };

  const handleImportSuccess = () => {
    toast.success('Vocabulary imported successfully!');
    setCurrentView('dashboard');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your vocabulary...</p>
        </div>
      </div>
    );
  }

  // Study session view (full screen)
  if (currentView === 'study') {
    return (
      <StudySession
        words={words}
        onUpdateWord={updateWordAfterReview}
        onClose={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header totalWords={stats.total} />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Navigation for non-dashboard views */}
        {currentView !== 'dashboard' && (
          <Button
            variant="ghost"
            className="mb-6 rounded-full"
            onClick={() => setCurrentView('dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        )}

        {/* Dashboard */}
        {currentView === 'dashboard' && (
          <Dashboard
            stats={stats}
            sources={sources}
            dailyStats={dailyStats}
            streak={streak}
            onStartSession={handleStartSession}
            onShowImport={() => setCurrentView('import')}
            onShowVocabulary={() => setCurrentView('vocabulary')}
            onShowSources={() => setCurrentView('sources')}
            onShowAnalytics={() => setCurrentView('analytics')}
          />
        )}

        {/* Import view */}
        {currentView === 'import' && (
          <ImportCSV
            onImport={importWords}
            onSuccess={handleImportSuccess}
          />
        )}

        {/* Vocabulary list view */}
        {currentView === 'vocabulary' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Your Vocabulary</h2>
              <p className="text-muted-foreground">
                Manage and browse all your words
              </p>
            </div>
            <VocabularyList
              words={words}
              onDelete={deleteWord}
            />
          </div>
        )}

        {/* Sources management placeholder */}
        {currentView === 'sources' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Imported Sources</h2>
              <p className="text-muted-foreground">Manage your CSV imports</p>
            </div>
            <div className="space-y-3">
              {sources.map(source => (
                <div key={source.id} className="p-4 rounded-2xl border bg-card flex items-center justify-between">
                  <div>
                    <p className="font-medium">{source.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {source.word_count} words • {new Date(source.imported_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="rounded-full"
                    onClick={() => {
                      deleteSource(source.id, true);
                      toast.success('Source deleted');
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics placeholder */}
        {currentView === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Learning Analytics</h2>
              <p className="text-muted-foreground">Track your learning progress</p>
            </div>
            <div className="grid gap-4">
              <div className="p-6 rounded-2xl border bg-card">
                <h3 className="font-semibold mb-4">Study History (Last 7 days)</h3>
                <div className="flex gap-2 justify-between">
                  {dailyStats.slice(-7).map(day => (
                    <div key={day.date} className="text-center">
                      <div 
                        className="w-8 h-20 bg-primary/20 rounded-lg flex items-end justify-center mb-1"
                      >
                        <div 
                          className="w-full bg-primary rounded-lg transition-all"
                          style={{ height: `${Math.min(100, day.words_studied * 5)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{day.date.slice(-2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-2xl border bg-card">
                <h3 className="font-semibold">Current Streak</h3>
                <p className="text-4xl font-bold text-primary">{streak.current_streak} days</p>
                <p className="text-sm text-muted-foreground">Longest: {streak.longest_streak} days</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;