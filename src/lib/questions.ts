import { VocabularyWord, StudyQuestion, QuestionType } from '@/types/vocabulary';

/**
 * Generate a cloze (fill-in-the-blank) question
 */
function generateClozeQuestion(word: VocabularyWord): StudyQuestion | null {
  const example = word.example_en;
  const vocabulary = word.vocabulary.toLowerCase();
  
  // Check if the vocabulary appears in the example
  const regex = new RegExp(`\\b${vocabulary}\\b`, 'gi');
  if (!regex.test(example)) {
    return null;
  }
  
  const clozeText = example.replace(regex, '_____');
  
  return {
    id: `cloze-${word.id}-${Date.now()}`,
    word,
    type: 'cloze',
    question: 'Fill in the blank:',
    correctAnswer: word.vocabulary,
    clozeText,
  };
}

/**
 * Generate a multiple choice question
 */
function generateMultipleChoiceQuestion(
  word: VocabularyWord,
  allWords: VocabularyWord[],
  useMeaningVI: boolean = true
): StudyQuestion {
  const correctMeaning = useMeaningVI ? word.meaning_vi : word.meaning_en;
  
  // Get distractors - prefer same topic
  const sameTopicWords = allWords.filter(
    w => w.id !== word.id && w.topic === word.topic
  );
  const otherWords = allWords.filter(
    w => w.id !== word.id && w.topic !== word.topic
  );
  
  const potentialDistractors = [...sameTopicWords, ...otherWords];
  const distractors: string[] = [];
  
  // Shuffle and pick 3 distractors
  const shuffled = potentialDistractors.sort(() => Math.random() - 0.5);
  for (const w of shuffled) {
    if (distractors.length >= 3) break;
    const meaning = useMeaningVI ? w.meaning_vi : w.meaning_en;
    if (meaning && meaning !== correctMeaning && !distractors.includes(meaning)) {
      distractors.push(meaning);
    }
  }
  
  // If not enough distractors, add some generic ones
  while (distractors.length < 3) {
    distractors.push(`Unknown meaning ${distractors.length + 1}`);
  }
  
  // Shuffle options with correct answer
  const options = [correctMeaning, ...distractors].sort(() => Math.random() - 0.5);
  
  return {
    id: `mc-${word.id}-${Date.now()}`,
    word,
    type: 'multiple_choice',
    question: `What does "${word.vocabulary}" mean?`,
    correctAnswer: correctMeaning,
    options,
  };
}

/**
 * Generate a listening question
 */
function generateListeningQuestion(
  word: VocabularyWord,
  allWords: VocabularyWord[]
): StudyQuestion {
  // Get distractors
  const otherWords = allWords.filter(w => w.id !== word.id);
  const shuffled = otherWords.sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 3).map(w => w.vocabulary);
  
  // Shuffle options
  const options = [word.vocabulary, ...distractors].sort(() => Math.random() - 0.5);
  
  return {
    id: `listen-${word.id}-${Date.now()}`,
    word,
    type: 'listening',
    question: 'Listen and select the correct word:',
    correctAnswer: word.vocabulary,
    options,
  };
}

/**
 * Generate an active recall question
 */
function generateActiveRecallQuestion(word: VocabularyWord): StudyQuestion {
  return {
    id: `recall-${word.id}-${Date.now()}`,
    word,
    type: 'active_recall',
    question: `Type the English word for:\n"${word.meaning_vi}"`,
    correctAnswer: word.vocabulary,
  };
}

/**
 * Generate a question for a word
 */
export function generateQuestion(
  word: VocabularyWord,
  allWords: VocabularyWord[],
  preferredType?: QuestionType
): StudyQuestion {
  const availableTypes: QuestionType[] = [];
  
  // Check which types are available for this word
  const clozeQuestion = generateClozeQuestion(word);
  if (clozeQuestion) {
    availableTypes.push('cloze');
  }
  
  availableTypes.push('multiple_choice', 'listening', 'active_recall');
  
  // Select type
  let selectedType = preferredType;
  if (!selectedType || !availableTypes.includes(selectedType)) {
    selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }
  
  switch (selectedType) {
    case 'cloze':
      return clozeQuestion || generateMultipleChoiceQuestion(word, allWords);
    case 'multiple_choice':
      return generateMultipleChoiceQuestion(word, allWords);
    case 'listening':
      return generateListeningQuestion(word, allWords);
    case 'active_recall':
      return generateActiveRecallQuestion(word);
    default:
      return generateMultipleChoiceQuestion(word, allWords);
  }
}

/**
 * Generate questions for a study session
 * Ensures at least 3 different question types
 */
export function generateSessionQuestions(
  words: VocabularyWord[],
  allWords: VocabularyWord[]
): StudyQuestion[] {
  if (words.length === 0) return [];
  
  const questions: StudyQuestion[] = [];
  const types: QuestionType[] = ['cloze', 'multiple_choice', 'listening', 'active_recall'];
  const usedTypes = new Set<QuestionType>();
  
  // First, ensure at least 3 different types if we have enough words
  const minTypes = Math.min(3, words.length);
  const shuffledTypes = types.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let preferredType: QuestionType | undefined;
    
    // For first few questions, try to use different types
    if (usedTypes.size < minTypes && i < shuffledTypes.length) {
      preferredType = shuffledTypes[i];
    }
    
    const question = generateQuestion(word, allWords, preferredType);
    questions.push(question);
    usedTypes.add(question.type);
  }
  
  return questions;
}

/**
 * Check if answer is correct (with some tolerance)
 */
export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^\w\s]/g, '');
  return normalize(userAnswer) === normalize(correctAnswer);
}
