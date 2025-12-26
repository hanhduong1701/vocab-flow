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

interface AnswerRecord {
  questionId: string;
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  difficulty: DifficultyRating;
  timestamp: Date;
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
  
  // Use state for tracking so updates trigger re-renders
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  // Store detailed answer records
  const answersRef = useRef<Map<string, AnswerRecord>>(new Map());
  
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
    setAnsweredCount(0);
    setCorrectCount(0);
    
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
  ): boolean => {
    if (!currentQuestion) return false;

    const questionId = currentQuestion.id;
    const wordId = currentQuestion.word.id;
    
    // Only count if this question hasn't been answered yet
    if (answersRef.current.has(questionId)) {
      // Already answered - just return the previous result
      return answersRef.current.get(questionId)!.isCorrect;
    }
    
    const isCorrect = checkAnswer(userAnswer, currentQuestion.correctAnswer);
    
    // Record this answer
    const record: AnswerRecord = {
      questionId,
      wordId,
      userAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      difficulty,
      timestamp: new Date(),
    };
    
    answersRef.current.set(questionId, record);
    
    // Update state counts
    setAnsweredCount(prev => prev + 1);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    
    // Update the word in the main store IMMEDIATELY
    onUpdateWord(wordId, isCorrect, difficulty);

    return isCorrect;
  }, [currentQuestion, onUpdateWord]);

  const skipQuestion = useCallback(() => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const wordId = currentQuestion.word.id;
    
    // Only count if this question hasn't been answered yet
    if (answersRef.current.has(questionId)) return;
    
    // Record as incorrect skip
    const record: AnswerRecord = {
      questionId,
      wordId,
      userAnswer: '',
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: false,
      difficulty: 'hard',
      timestamp: new Date(),
    };
    
    answersRef.current.set(questionId, record);
    
    // Update state counts
    setAnsweredCount(prev => prev + 1);
    // Don't increment correctCount for skips
    
    onUpdateWord(wordId, false, 'hard');
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

    // Get counts from the answers map directly for accuracy
    let totalAnswered = 0;
    let totalCorrect = 0;
    const wordsLeveledUp: VocabularyWord[] = [];
    const wordsLeveledDown: VocabularyWord[] = [];
    const incorrectWords: VocabularyWord[] = [];
    const processedWordIds = new Set<string>();

    answersRef.current.forEach((record) => {
      totalAnswered++;
      if (record.isCorrect) {
        totalCorrect++;
      }
      
      // Process word level changes (only once per word)
      if (!processedWordIds.has(record.wordId)) {
        processedWordIds.add(record.wordId);
        
        const word = sessionWords.find(w => w.id === record.wordId);
        const prevLevel = prevLevelsRef.current.get(record.wordId) || 1;
        
        if (word) {
          if (record.isCorrect && prevLevel < 5) {
            wordsLeveledUp.push(word);
          } else if (!record.isCorrect) {
            wordsLeveledDown.push(word);
            incorrectWords.push(word);
          }
        }
      }
    });

    const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

    return {
      totalQuestions: totalAnswered,
      correctAnswers: totalCorrect,
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
    setAnsweredCount(0);
    setCorrectCount(0);
    prevLevelsRef.current = new Map();
  }, []);

  return {
    isActive,
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    answeredCount,
    correctCount,
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
