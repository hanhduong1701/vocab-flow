import { useState, useCallback, useMemo } from 'react';
import { VocabularyWord, StudyQuestion, DifficultyRating, StudySession } from '@/types/vocabulary';
import { selectWordsForSession } from '@/lib/srs';
import { generateSessionQuestions, checkAnswer } from '@/lib/questions';

interface SessionResult {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  wordsLeveledUp: VocabularyWord[];
  wordsLeveledDown: VocabularyWord[];
  duration: number;
}

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

  const currentQuestion = useMemo(() => {
    return questions[currentIndex] || null;
  }, [questions, currentIndex]);

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return (currentIndex / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const startSession = useCallback((wordCount: number = 10) => {
    const selected = selectWordsForSession(allWords, wordCount);
    if (selected.length === 0) return false;

    const sessionQuestions = generateSessionQuestions(selected, allWords);
    
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

    // Update the word in the main store
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

  const endSession = useCallback(() => {
    const endTime = new Date();
    const duration = startTime ? (endTime.getTime() - startTime.getTime()) / 1000 : 0;

    const correctAnswers = Array.from(answers.values()).filter(a => a.isCorrect).length;
    const accuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

    // Find words that leveled up or down
    const wordsLeveledUp: VocabularyWord[] = [];
    const wordsLeveledDown: VocabularyWord[] = [];

    answers.forEach((answer, wordId) => {
      const word = sessionWords.find(w => w.id === wordId);
      if (word) {
        if (answer.isCorrect && word.level < 5) {
          wordsLeveledUp.push(word);
        } else if (!answer.isCorrect) {
          wordsLeveledDown.push(word);
        }
      }
    });

    const result: SessionResult = {
      totalQuestions: questions.length,
      correctAnswers,
      accuracy,
      wordsLeveledUp,
      wordsLeveledDown,
      duration,
    };

    setSessionResult(result);
    setIsActive(false);

    return result;
  }, [answers, questions.length, sessionWords, startTime]);

  const resetSession = useCallback(() => {
    setIsActive(false);
    setSessionWords([]);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers(new Map());
    setStartTime(null);
    setSessionResult(null);
  }, []);

  return {
    isActive,
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
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
