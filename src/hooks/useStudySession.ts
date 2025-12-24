import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  const [answers, setAnswers] = useState<Map<string, { isCorrect: boolean; difficulty: DifficultyRating }>>(new Map());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  
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
    
    setSessionWords(selected);
    setQuestions(sessionQuestions);
    setCurrentIndex(0);
    setAnswers(new Map());
    setStartTime(new Date());
    setSessionResult(null);
    setIsActive(true);
    
    return true;
  }, [allWords]);

  const submitAnswer = useCallback((
    userAnswer: string,
    difficulty: DifficultyRating = 'good'
  ) => {
    if (!currentQuestion) return;

    const isCorrect = checkAnswer(userAnswer, currentQuestion.correctAnswer);
    
    // Record answer
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestion.word.id, { isCorrect, difficulty });
      return newAnswers;
    });

    // Update the word in the main store IMMEDIATELY (progress is saved after each question)
    onUpdateWord(currentQuestion.word.id, isCorrect, difficulty);

    return isCorrect;
  }, [currentQuestion, onUpdateWord]);

  const skipQuestion = useCallback(() => {
    if (!currentQuestion) return;

    // Mark as incorrect with hard difficulty
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestion.word.id, { isCorrect: false, difficulty: 'hard' });
      return newAnswers;
    });

    onUpdateWord(currentQuestion.word.id, false, 'hard');
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

    const answeredCount = answers.size;
    const correctAnswers = Array.from(answers.values()).filter(a => a.isCorrect).length;
    const accuracy = answeredCount > 0 ? (correctAnswers / answeredCount) * 100 : 0;

    // Find words that leveled up or down
    const wordsLeveledUp: VocabularyWord[] = [];
    const wordsLeveledDown: VocabularyWord[] = [];
    const incorrectWords: VocabularyWord[] = [];

    answers.forEach((answer, wordId) => {
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
  }, [answers, sessionWords, startTime]);

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
    setAnswers(new Map());
    setStartTime(null);
    setSessionResult(null);
    prevLevelsRef.current = new Map();
  }, []);

  return {
    isActive,
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    answeredCount: answers.size,
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