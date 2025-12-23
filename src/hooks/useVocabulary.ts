import { useState, useEffect, useCallback } from 'react';
import { VocabularyWord, DifficultyRating, ImportResult } from '@/types/vocabulary';
import { calculateNextReview, getDueWords, getWordsDueToday, getNewWords } from '@/lib/srs';
import { importCSV } from '@/lib/csv-parser';

const STORAGE_KEY = 'vocabulary_words';

export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
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
    setIsLoaded(true);
  }, []);

  // Save to localStorage when words change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    }
  }, [words, isLoaded]);

  const importWords = useCallback(
    (csvText: string, onDuplicate: 'skip' | 'overwrite' = 'skip'): ImportResult => {
      const { words: newWords, result } = importCSV(csvText, words, onDuplicate);
      setWords(newWords);
      return result;
    },
    [words]
  );

  const updateWordAfterReview = useCallback(
    (wordId: string, isCorrect: boolean, difficulty: DifficultyRating) => {
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
    []
  );

  const deleteWord = useCallback((wordId: string) => {
    setWords(prev => prev.filter(w => w.id !== wordId));
  }, []);

  const clearAllWords = useCallback(() => {
    setWords([]);
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
    isLoaded,
    importWords,
    updateWordAfterReview,
    deleteWord,
    clearAllWords,
    dueNow,
    dueToday,
    newWords,
    stats,
  };
}
