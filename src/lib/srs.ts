import { VocabularyWord, DifficultyRating, SRS_INTERVALS, DIFFICULTY_MULTIPLIERS } from '@/types/vocabulary';

/**
 * Calculate the next review date based on current level and difficulty rating
 */
export function calculateNextReview(
  currentLevel: number,
  difficulty: DifficultyRating,
  isCorrect: boolean
): { newLevel: number; nextReview: Date } {
  const now = new Date();
  
  if (!isCorrect) {
    // Wrong answer: reduce level (minimum 1) and schedule for soon
    const newLevel = Math.max(1, currentLevel - 1);
    const interval = SRS_INTERVALS[1] * 0.5; // Half of level 1 interval
    return {
      newLevel,
      nextReview: new Date(now.getTime() + interval),
    };
  }
  
  // Correct answer: increase level (maximum 5)
  const newLevel = Math.min(5, currentLevel + 1);
  const baseInterval = SRS_INTERVALS[newLevel];
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty];
  const interval = baseInterval * multiplier;
  
  return {
    newLevel,
    nextReview: new Date(now.getTime() + interval),
  };
}

/**
 * Sort words by review priority (Golden Time principle)
 * 1. Overdue words (past next_review)
 * 2. Due today
 * 3. New words (never reviewed)
 * 4. Low-frequency reinforcement
 */
export function sortByReviewPriority(words: VocabularyWord[]): VocabularyWord[] {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  return [...words].sort((a, b) => {
    const aNextReview = new Date(a.next_review);
    const bNextReview = new Date(b.next_review);
    
    const aOverdue = aNextReview < now;
    const bOverdue = bNextReview < now;
    const aDueToday = aNextReview <= todayEnd && !aOverdue;
    const bDueToday = bNextReview <= todayEnd && !bOverdue;
    const aNew = !a.last_reviewed;
    const bNew = !b.last_reviewed;
    
    // Priority: overdue > due today > new > future
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    if (aDueToday && !bDueToday && !bOverdue) return -1;
    if (!aDueToday && bDueToday && !aOverdue) return 1;
    
    if (aNew && !bNew && !bOverdue && !bDueToday) return -1;
    if (!aNew && bNew && !aOverdue && !aDueToday) return 1;
    
    // Within same priority, sort by lower level first (needs more practice)
    if (a.level !== b.level) return a.level - b.level;
    
    // Then by next review date
    return aNextReview.getTime() - bNextReview.getTime();
  });
}

/**
 * Get words that are due for review
 */
export function getDueWords(words: VocabularyWord[]): VocabularyWord[] {
  const now = new Date();
  return words.filter(word => new Date(word.next_review) <= now);
}

/**
 * Get words due today (including overdue)
 */
export function getWordsDueToday(words: VocabularyWord[]): VocabularyWord[] {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  return words.filter(word => new Date(word.next_review) <= todayEnd);
}

/**
 * Get new words (never reviewed)
 */
export function getNewWords(words: VocabularyWord[]): VocabularyWord[] {
  return words.filter(word => !word.last_reviewed);
}

/**
 * Select words for a study session based on Golden Time principle
 */
export function selectWordsForSession(
  words: VocabularyWord[],
  count: number
): VocabularyWord[] {
  const sorted = sortByReviewPriority(words);
  return sorted.slice(0, count);
}

/**
 * Get level display info
 */
export function getLevelInfo(level: number): { label: string; color: string; description: string } {
  const levels: Record<number, { label: string; color: string; description: string }> = {
    1: { label: 'New', color: 'level-1', description: 'Just learning' },
    2: { label: 'Learning', color: 'level-2', description: 'Getting familiar' },
    3: { label: 'Familiar', color: 'level-3', description: 'Recognizing well' },
    4: { label: 'Known', color: 'level-4', description: 'Almost mastered' },
    5: { label: 'Mastered', color: 'level-5', description: 'Fully learned!' },
  };
  
  return levels[level] || levels[1];
}
