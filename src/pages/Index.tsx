import { useState } from 'react';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ImportCSV } from '@/components/ImportCSV';
import { VocabularyList } from '@/components/VocabularyList';
import { StudySession } from '@/components/study/StudySession';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type View = 'dashboard' | 'import' | 'vocabulary' | 'study';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [studyWordCount, setStudyWordCount] = useState(10);
  
  const {
    words,
    isLoaded,
    importWords,
    updateWordAfterReview,
    deleteWord,
    stats,
  } = useVocabulary();

  const handleStartSession = (count: number) => {
    setStudyWordCount(count);
    setCurrentView('study');
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
        wordCount={studyWordCount}
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
            className="mb-6"
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
            onStartSession={handleStartSession}
            onShowImport={() => setCurrentView('import')}
            onShowVocabulary={() => setCurrentView('vocabulary')}
          />
        )}

        {/* Import view */}
        {currentView === 'import' && (
          <ImportCSV
            onImport={importWords}
            onClose={() => setCurrentView('dashboard')}
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
      </main>
    </div>
  );
};

export default Index;
