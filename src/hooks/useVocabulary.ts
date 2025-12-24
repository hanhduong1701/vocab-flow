import { useState, useEffect, useCallback } from 'react';
import { VocabularyWord, DifficultyRating, ImportResult, CSVSource, DailyStats, LearningStreak } from '@/types/vocabulary';
import { calculateNextReview, getDueWords, getWordsDueToday, getNewWords } from '@/lib/srs';
import { importCSV } from '@/lib/csv-parser';

const STORAGE_KEY = 'vocabulary_words';
const SOURCES_KEY = 'csv_sources';
const DAILY_STATS_KEY = 'daily_stats';
const STREAK_KEY = 'learning_streak';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [sources, setSources] = useState<CSVSource[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [streak, setStreak] = useState<LearningStreak>({
    current_streak: 0,
    longest_streak: 0,
    last_study_date: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const wordsWithDates = parsed.map((w: VocabularyWord) => ({
          ...w,
          next_review: new Date(w.next_review),
          last_reviewed: w.last_reviewed ? new Date(w.last_reviewed) : undefined,
          created_at: new Date(w.created_at),
        }));
        setWords(wordsWithDates);
      } catch (e) {
        console.error('Failed to parse stored words:', e);
      }
    }

    const storedSources = localStorage.getItem(SOURCES_KEY);
    if (storedSources) {
      try {
        const parsed = JSON.parse(storedSources);
        setSources(parsed.map((s: CSVSource) => ({
          ...s,
          imported_at: new Date(s.imported_at),
        })));
      } catch (e) {
        console.error('Failed to parse stored sources:', e);
      }
    }

    const storedStats = localStorage.getItem(DAILY_STATS_KEY);
    if (storedStats) {
      try {
        setDailyStats(JSON.parse(storedStats));
      } catch (e) {
        console.error('Failed to parse daily stats:', e);
      }
    }

    const storedStreak = localStorage.getItem(STREAK_KEY);
    if (storedStreak) {
      try {
        setStreak(JSON.parse(storedStreak));
      } catch (e) {
        console.error('Failed to parse streak:', e);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    }
  }, [words, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
    }
  }, [sources, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(dailyStats));
    }
  }, [dailyStats, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    }
  }, [streak, isLoaded]);

  const updateStreak = useCallback(() => {
    const today = getTodayString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setStreak(prev => {
      if (prev.last_study_date === today) {
        return prev; // Already studied today
      }

      let newCurrentStreak = 1;
      if (prev.last_study_date === yesterday) {
        newCurrentStreak = prev.current_streak + 1;
      }

      return {
        current_streak: newCurrentStreak,
        longest_streak: Math.max(prev.longest_streak, newCurrentStreak),
        last_study_date: today,
      };
    });
  }, []);

  const recordDailyStats = useCallback((isCorrect: boolean) => {
    const today = getTodayString();
    
    setDailyStats(prev => {
      const existingIndex = prev.findIndex(s => s.date === today);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          words_studied: updated[existingIndex].words_studied + 1,
          correct_count: updated[existingIndex].correct_count + (isCorrect ? 1 : 0),
          incorrect_count: updated[existingIndex].incorrect_count + (isCorrect ? 0 : 1),
        };
        return updated;
      } else {
        return [...prev, {
          date: today,
          words_studied: 1,
          correct_count: isCorrect ? 1 : 0,
          incorrect_count: isCorrect ? 0 : 1,
        }].slice(-30); // Keep last 30 days
      }
    });

    updateStreak();
  }, [updateStreak]);

  const importWords = useCallback(
    (csvText: string, onDuplicate: 'skip' | 'overwrite' = 'skip', filename: string = 'imported.csv'): ImportResult => {
      const sourceId = crypto.randomUUID();
      const { words: newWords, result } = importCSV(csvText, words, onDuplicate, sourceId);
      
      setWords(newWords);
      
      if (result.success > 0) {
        const newSource: CSVSource = {
          id: sourceId,
          filename,
          imported_at: new Date(),
          word_count: result.success,
        };
        setSources(prev => [...prev, newSource]);
      }
      
      return { ...result, sourceId };
    },
    [words]
  );

  const deleteSource = useCallback((sourceId: string, deleteWords: boolean = false) => {
    if (deleteWords) {
      setWords(prev => prev.filter(w => w.source_file !== sourceId));
    }
    setSources(prev => prev.filter(s => s.id !== sourceId));
  }, []);

  const updateWordAfterReview = useCallback(
    (wordId: string, isCorrect: boolean, difficulty: DifficultyRating) => {
      recordDailyStats(isCorrect);
      
      setWords(prev =>
        prev.map(word => {
          if (word.id !== wordId) return word;

          const { newLevel, nextReview } = calculateNextReview(
            word.level,
            difficulty,
            isCorrect
          );

          return {
            ...word,
            level: newLevel,
            next_review: nextReview,
            last_reviewed: new Date(),
            correct_count: isCorrect ? word.correct_count + 1 : word.correct_count,
            incorrect_count: isCorrect ? word.incorrect_count : word.incorrect_count + 1,
          };
        })
      );
    },
    [recordDailyStats]
  );

  const deleteWord = useCallback((wordId: string) => {
    setWords(prev => prev.filter(w => w.id !== wordId));
  }, []);

  const clearAllWords = useCallback(() => {
    setWords([]);
    setSources([]);
  }, []);

  // Computed values
  const dueNow = getDueWords(words);
  const dueToday = getWordsDueToday(words);
  const newWords = getNewWords(words);

  const stats = {
    total: words.length,
    dueNow: dueNow.length,
    dueToday: dueToday.length,
    newWords: newWords.length,
    mastered: words.filter(w => w.level === 5).length,
    byLevel: {
      1: words.filter(w => w.level === 1).length,
      2: words.filter(w => w.level === 2).length,
      3: words.filter(w => w.level === 3).length,
      4: words.filter(w => w.level === 4).length,
      5: words.filter(w => w.level === 5).length,
    },
  };

  return {
    words,
    sources,
    dailyStats,
    streak,
    isLoaded,
    importWords,
    deleteSource,
    updateWordAfterReview,
    deleteWord,
    clearAllWords,
    dueNow,
    dueToday,
    newWords,
    stats,
  };
}