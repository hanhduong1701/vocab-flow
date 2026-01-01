import { useState, useEffect, useCallback } from 'react';
import { VocabularyWord, DifficultyRating, ImportResult, CSVSource, DailyStats, LearningStreak } from '@/types/vocabulary';
import { calculateNextReview, getDueWords, getWordsDueToday, getNewWords } from '@/lib/srs';
import { importCSV } from '@/lib/csv-parser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function useVocabulary() {
  const { user } = useAuth();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [sources, setSources] = useState<CSVSource[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [streak, setStreak] = useState<LearningStreak>({
    current_streak: 0,
    longest_streak: 0,
    last_study_date: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch data from Supabase
  useEffect(() => {
    if (!user) {
      setWords([]);
      setSources([]);
      setDailyStats([]);
      setStreak({ current_streak: 0, longest_streak: 0, last_study_date: null });
      setIsLoaded(true);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch ALL vocabulary words using pagination (no limit)
        let allWords: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: wordsData, error: wordsError } = await supabase
            .from('vocabulary_words')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

          if (wordsError) throw wordsError;

          if (wordsData && wordsData.length > 0) {
            allWords = [...allWords, ...wordsData];
            from += pageSize;
            hasMore = wordsData.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        const mappedWords: VocabularyWord[] = allWords.map(w => ({
          id: w.id,
          vocabulary: w.word,
          type: w.type || undefined,
          ipa: w.ipa || undefined,
          meaning_vi: w.meaning,
          meaning_en: w.meaning_en || '',
          example_en: w.example || '',
          source_file: w.source_id || undefined,
          level: w.level,
          next_review: new Date(w.next_review),
          last_reviewed: w.last_reviewed ? new Date(w.last_reviewed) : undefined,
          correct_count: w.correct_count,
          incorrect_count: w.review_count - w.correct_count,
          created_at: new Date(w.created_at),
        }));
        setWords(mappedWords);

        // Fetch sources
        const { data: sourcesData, error: sourcesError } = await supabase
          .from('vocabulary_sources')
          .select('*')
          .eq('user_id', user.id)
          .order('imported_at', { ascending: false });

        if (sourcesError) throw sourcesError;

        const mappedSources: CSVSource[] = (sourcesData || []).map(s => ({
          id: s.id,
          filename: s.filename,
          imported_at: new Date(s.imported_at),
          word_count: s.word_count,
        }));
        setSources(mappedSources);

        // Fetch daily stats (last 30 days)
        const { data: statsData, error: statsError } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30);

        if (statsError) throw statsError;

        const mappedStats: DailyStats[] = (statsData || []).map(s => ({
          date: s.date,
          words_studied: s.words_studied,
          correct_count: s.correct_count,
          incorrect_count: s.words_studied - s.correct_count,
        }));
        setDailyStats(mappedStats.reverse());

        // Fetch streak
        const { data: streakData, error: streakError } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (streakError) throw streakError;

        if (streakData) {
          setStreak({
            current_streak: streakData.current_streak,
            longest_streak: streakData.longest_streak,
            last_study_date: streakData.last_study_date,
          });
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Error fetching vocabulary data:', error);
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [user]);

  const updateStreak = useCallback(async () => {
    if (!user) return;

    const today = getTodayString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let newCurrentStreak = 1;
    if (streak.last_study_date === today) {
      return; // Already studied today
    } else if (streak.last_study_date === yesterday) {
      newCurrentStreak = streak.current_streak + 1;
    }

    const newStreak = {
      current_streak: newCurrentStreak,
      longest_streak: Math.max(streak.longest_streak, newCurrentStreak),
      last_study_date: today,
    };

    setStreak(newStreak);

    // Upsert streak to database
    await supabase
      .from('user_streaks')
      .upsert({
        user_id: user.id,
        current_streak: newStreak.current_streak,
        longest_streak: newStreak.longest_streak,
        last_study_date: today,
      }, { onConflict: 'user_id' });
  }, [user, streak]);

  const recordDailyStats = useCallback(async (isCorrect: boolean) => {
    if (!user) return;

    const today = getTodayString();

    // Update local state
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
        }].slice(-30);
      }
    });

    // Upsert to database
    const existingStat = dailyStats.find(s => s.date === today);
    if (existingStat) {
      await supabase
        .from('daily_stats')
        .update({
          words_studied: existingStat.words_studied + 1,
          correct_count: existingStat.correct_count + (isCorrect ? 1 : 0),
        })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      await supabase
        .from('daily_stats')
        .insert({
          user_id: user.id,
          date: today,
          words_studied: 1,
          correct_count: isCorrect ? 1 : 0,
        });
    }

    updateStreak();
  }, [user, dailyStats, updateStreak]);

  const importWords = useCallback(
    async (csvText: string, onDuplicate: 'skip' | 'overwrite' = 'skip', filename: string = 'imported.csv'): Promise<ImportResult> => {
      if (!user) {
        return { success: 0, skipped: 0, failed: 0, errors: ['User not authenticated'] };
      }

      const sourceId = crypto.randomUUID();
      const { words: newWords, result } = importCSV(csvText, words, onDuplicate, sourceId);
      
      if (result.success > 0) {
        // Insert source first
        const { error: sourceError } = await supabase
          .from('vocabulary_sources')
          .insert({
            id: sourceId,
            user_id: user.id,
            filename,
            word_count: result.success,
          });

        if (sourceError) {
          console.error('Error inserting source:', sourceError);
          return { ...result, errors: [...result.errors, 'Failed to save source'] };
        }

        // Get the newly added words
        const addedWords = newWords.filter(w => w.source_file === sourceId);
        
        // Insert words to database
        const wordsToInsert = addedWords.map(w => ({
          id: w.id,
          user_id: user.id,
          source_id: sourceId,
          word: w.vocabulary,
          meaning: w.meaning_vi,
          meaning_en: w.meaning_en || null,
          example: w.example_en || null,
          type: w.type || null,
          ipa: w.ipa || null,
          level: w.level,
          next_review: w.next_review.toISOString(),
          review_count: 0,
          correct_count: 0,
        }));

        const { error: wordsError } = await supabase
          .from('vocabulary_words')
          .insert(wordsToInsert);

        if (wordsError) {
          console.error('Error inserting words:', wordsError);
          // Rollback source
          await supabase.from('vocabulary_sources').delete().eq('id', sourceId);
          return { ...result, errors: [...result.errors, 'Failed to save words'] };
        }

        // Update local state
        setWords(newWords);
        setSources(prev => [...prev, {
          id: sourceId,
          filename,
          imported_at: new Date(),
          word_count: result.success,
        }]);
      }
      
      return { ...result, sourceId };
    },
    [user, words]
  );

  const deleteSource = useCallback(async (sourceId: string, deleteWords: boolean = false) => {
    if (!user) return;

    if (deleteWords) {
      await supabase
        .from('vocabulary_words')
        .delete()
        .eq('source_id', sourceId)
        .eq('user_id', user.id);
      
      setWords(prev => prev.filter(w => w.source_file !== sourceId));
    }

    await supabase
      .from('vocabulary_sources')
      .delete()
      .eq('id', sourceId)
      .eq('user_id', user.id);

    setSources(prev => prev.filter(s => s.id !== sourceId));
  }, [user]);

  const updateWordAfterReview = useCallback(
    async (wordId: string, isCorrect: boolean, difficulty: DifficultyRating) => {
      if (!user) return;

      const word = words.find(w => w.id === wordId);
      if (!word) return;

      const { newLevel, nextReview } = calculateNextReview(
        word.level,
        difficulty,
        isCorrect
      );

      // Update local state
      setWords(prev =>
        prev.map(w => {
          if (w.id !== wordId) return w;
          return {
            ...w,
            level: newLevel,
            next_review: nextReview,
            last_reviewed: new Date(),
            correct_count: isCorrect ? w.correct_count + 1 : w.correct_count,
            incorrect_count: isCorrect ? w.incorrect_count : w.incorrect_count + 1,
          };
        })
      );

      // Update database
      await supabase
        .from('vocabulary_words')
        .update({
          level: newLevel,
          next_review: nextReview.toISOString(),
          last_reviewed: new Date().toISOString(),
          review_count: word.correct_count + word.incorrect_count + 1,
          correct_count: isCorrect ? word.correct_count + 1 : word.correct_count,
        })
        .eq('id', wordId)
        .eq('user_id', user.id);

      // Record stats
      recordDailyStats(isCorrect);
    },
    [user, words, recordDailyStats]
  );

  const deleteWord = useCallback(async (wordId: string) => {
    if (!user) return;

    await supabase
      .from('vocabulary_words')
      .delete()
      .eq('id', wordId)
      .eq('user_id', user.id);

    setWords(prev => prev.filter(w => w.id !== wordId));
  }, [user]);

  const clearAllWords = useCallback(async () => {
    if (!user) return;

    await supabase.from('vocabulary_words').delete().eq('user_id', user.id);
    await supabase.from('vocabulary_sources').delete().eq('user_id', user.id);

    setWords([]);
    setSources([]);
  }, [user]);

  // Computed values
  const dueNow = getDueWords(words);
  const dueToday = getWordsDueToday(words);
  const newWordsArr = getNewWords(words);

  const stats = {
    total: words.length,
    dueNow: dueNow.length,
    dueToday: dueToday.length,
    newWords: newWordsArr.length,
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
    newWords: newWordsArr,
    stats,
  };
}
