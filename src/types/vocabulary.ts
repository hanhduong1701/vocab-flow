export interface VocabularyWord {
  id: string;
  vocabulary: string;
  meaning_vi: string;
  meaning_en: string;
  example_en: string;
  example_vi?: string;
  topic?: string;
  extra_fields?: Record<string, string>;
  source_file?: string; // Track which CSV file this came from
  
  // Spaced repetition fields
  level: number; // 1-5
  next_review: Date;
  last_reviewed?: Date;
  correct_count: number;
  incorrect_count: number;
  created_at: Date;
}

export interface CSVSource {
  id: string;
  filename: string;
  imported_at: Date;
  word_count: number;
}

export interface StudySession {
  id: string;
  started_at: Date;
  ended_at?: Date;
  total_questions: number;
  correct_answers: number;
  words_reviewed: string[];
  words_leveled_up: string[];
  words_leveled_down: string[];
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  words_studied: number;
  correct_count: number;
  incorrect_count: number;
}

export interface LearningStreak {
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null; // YYYY-MM-DD
}

export type QuestionType = 'cloze' | 'multiple_choice' | 'listening' | 'active_recall';

export interface StudyQuestion {
  id: string;
  word: VocabularyWord;
  type: QuestionType;
  question: string;
  correctAnswer: string;
  options?: string[]; // For multiple choice
  clozeText?: string; // For cloze questions
}

export type DifficultyRating = 'easy' | 'good' | 'hard';

export interface ImportResult {
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
  sourceId?: string;
}

// Spaced repetition intervals in milliseconds
export const SRS_INTERVALS: Record<number, number> = {
  1: 10 * 60 * 1000, // 10 minutes
  2: 24 * 60 * 60 * 1000, // 1 day
  3: 3 * 24 * 60 * 60 * 1000, // 3 days
  4: 7 * 24 * 60 * 60 * 1000, // 7 days
  5: 25 * 24 * 60 * 60 * 1000, // 25 days
};

// Difficulty multipliers
export const DIFFICULTY_MULTIPLIERS: Record<DifficultyRating, number> = {
  easy: 1.3,
  good: 1.0,
  hard: 0.7,
};