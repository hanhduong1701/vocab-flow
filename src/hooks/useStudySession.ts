import { useState, useCallback, useMemo, useRef } from 'react';
import { VocabularyWord, StudyQuestion, DifficultyRating } from '@/types/vocabulary';
import { selectWordsForSession } from '@/lib/srs';
import { generateSessionQuestions, checkAnswer } from '@/lib/questions';

interface SessionResult {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  wordsLeveledUp: VocabularyWord[];
  wordsLeveledDown: VocabularyWord[];
  incorrectWords: VocabularyWord[];
  duration: number;
}

const MAX_QUESTIONS = 100;

export function useStudySession(
  allWords: VocabularyWord[],
  onUpdateWord: (wordId: string, isCorrect: boolean, difficulty: DifficultyRating) => void
) {
  const [isActive, setIsActive] = useState(false);
  const [sessionWords, setSessionWords] = useState<VocabularyWord[]>([]);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  
  // Track answers properly with correct count
  const answersRef = useRef<Map<string, { isCorrect: boolean; difficulty: DifficultyRating }>>(new Map());
  const correctCountRef = useRef(0);
  const answeredCountRef = useRef(0);
  
  // Track previous word levels to detect level changes
  const prevLevelsRef = useRef<Map<string, number>>(new Map());

  const currentQuestion = useMemo(() => {
    return questions[currentIndex] || null;
  }, [questions, currentIndex]);

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((currentIndex + 1) / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const startSession = useCallback(() => {
    // Select words and cap at MAX_QUESTIONS
    const selected = selectWordsForSession(allWords, MAX_QUESTIONS);
    if (selected.length === 0) return false;

    const sessionQuestions = generateSessionQuestions(selected, allWords).slice(0, MAX_QUESTIONS);
    
    // Store initial levels for tracking
    const initialLevels = new Map<string, number>();
    selected.forEach(w => initialLevels.set(w.id, w.level));
    prevLevelsRef.current = initialLevels;
    
    // Reset all tracking
    answersRef.current = new Map();
    correctCountRef.current = 0;
    answeredCountRef.current = 0;
    
    setSessionWords(selected);
    setQuestions(sessionQuestions);
    setCurrentIndex(0);
    setStartTime(new Date());
    setSessionResult(null);
    setIsActive(true);
    
    return true;
  }, [allWords]);

  const submitAnswer = useCallback((
    userAnswer: string,
    difficulty: DifficultyRating = 'good'
  ) => {
    if (!currentQuestion) return false;

    const wordId = currentQuestion.word.id;
    const isCorrect = checkAnswer(userAnswer, currentQuestion.correctAnswer);
    
    // Only count if not already answered
    if (!answersRef.current.has(wordId)) {
      answersRef.current.set(wordId, { isCorrect, difficulty });
      answeredCountRef.current += 1;
      if (isCorrect) {
        correctCountRef.current += 1;
      }
      
      // Update the word in the main store IMMEDIATELY
      onUpdateWord(wordId, isCorrect, difficulty);
    }

    return isCorrect;
  }, [currentQuestion, onUpdateWord]);

  const skipQuestion = useCallback(() => {
    if (!currentQuestion) return;

    const wordId = currentQuestion.word.id;
    
    // Only count if not already answered
    if (!answersRef.current.has(wordId)) {
      answersRef.current.set(wordId, { isCorrect: false, difficulty: 'hard' });
      answeredCountRef.current += 1;
      // Skip counts as incorrect, so don't increment correctCountRef
      
      onUpdateWord(wordId, false, 'hard');
    }
  }, [currentQuestion, onUpdateWord]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentIndex, questions.length]);

  const calculateResult = useCallback((): SessionResult => {
    const endTime = new Date();
    const duration = startTime ? (endTime.getTime() - startTime.getTime()) / 1000 : 0;

    const answeredCount = answeredCountRef.current;
    const correctAnswers = correctCountRef.current;
    const accuracy = answeredCount > 0 ? (correctAnswers / answeredCount) * 100 : 0;

    // Find words that leveled up or down
    const wordsLeveledUp: VocabularyWord[] = [];
    const wordsLeveledDown: VocabularyWord[] = [];
    const incorrectWords: VocabularyWord[] = [];

    answersRef.current.forEach((answer, wordId) => {
      const word = sessionWords.find(w => w.id === wordId);
      const prevLevel = prevLevelsRef.current.get(wordId) || 1;
      
      if (word) {
        if (answer.isCorrect && prevLevel < 5) {
          wordsLeveledUp.push(word);
        } else if (!answer.isCorrect) {
          wordsLeveledDown.push(word);
          incorrectWords.push(word);
        }
      }
    });

    return {
      totalQuestions: answeredCount,
      correctAnswers,
      accuracy,
      wordsLeveledUp,
      wordsLeveledDown,
      incorrectWords,
      duration,
    };
  }, [sessionWords, startTime]);

  const endSession = useCallback(() => {
    const result = calculateResult();
    setSessionResult(result);
    setIsActive(false);
    return result;
  }, [calculateResult]);

  const resetSession = useCallback(() => {
    setIsActive(false);
    setSessionWords([]);
    setQuestions([]);
    setCurrentIndex(0);
    setStartTime(null);
    setSessionResult(null);
    answersRef.current = new Map();
    correctCountRef.current = 0;
    answeredCountRef.current = 0;
    prevLevelsRef.current = new Map();
  }, []);

  return {
    isActive,
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    answeredCount: answeredCountRef.current,
    progress,
    sessionResult,
    startSession,
    submitAnswer,
    skipQuestion,
    nextQuestion,
    endSession,
    resetSession,
  };
}
