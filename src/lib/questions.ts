import { VocabularyWord, StudyQuestion, QuestionType } from '@/types/vocabulary';

/**
 * Type A - Gap Fill with Text Options
 * Show sentence with blank, options are text words
 */
function generateGapFillText(word: VocabularyWord, allWords: VocabularyWord[]): StudyQuestion | null {
  const example = word.example_en;
  const vocabulary = word.vocabulary.toLowerCase();
  
  // Check if the vocabulary appears in the example
  const regex = new RegExp(`\\b${vocabulary}\\b`, 'gi');
  if (!regex.test(example)) {
    return null;
  }
  
  const clozeText = example.replace(regex, '[_____]');
  
  // Get distractors (other vocabulary words)
  const distractors = getDistractorWords(word, allWords, 3);
  const options = [word.vocabulary, ...distractors].sort(() => Math.random() - 0.5);
  
  return {
    id: `gap-text-${word.id}-${Date.now()}`,
    word,
    type: 'gap_fill_text',
    question: 'Fill in the blank:',
    correctAnswer: word.vocabulary,
    clozeText,
    options,
  };
}

/**
 * Type B - Gap Fill with Audio Options
 * Show sentence with blank, options are audio buttons
 */
function generateGapFillAudio(word: VocabularyWord, allWords: VocabularyWord[]): StudyQuestion | null {
  const example = word.example_en;
  const vocabulary = word.vocabulary.toLowerCase();
  
  // Check if the vocabulary appears in the example
  const regex = new RegExp(`\\b${vocabulary}\\b`, 'gi');
  if (!regex.test(example)) {
    return null;
  }
  
  const clozeText = example.replace(regex, '[_____]');
  
  // Get distractors
  const distractors = getDistractorWords(word, allWords, 3);
  const options = [word.vocabulary, ...distractors].sort(() => Math.random() - 0.5);
  
  return {
    id: `gap-audio-${word.id}-${Date.now()}`,
    word,
    type: 'gap_fill_audio',
    question: 'Listen and fill in the blank:',
    correctAnswer: word.vocabulary,
    clozeText,
    options,
  };
}

/**
 * Type C - Context Meaning
 * Show full sentence with underlined word, options are meanings
 */
function generateContextMeaning(word: VocabularyWord, allWords: VocabularyWord[]): StudyQuestion {
  const example = word.example_en;
  const vocabulary = word.vocabulary;
  
  // Create underlined version of the sentence
  const regex = new RegExp(`\\b(${vocabulary})\\b`, 'gi');
  const underlinedText = example.replace(regex, '<u>$1</u>');
  
  // Get meaning distractors
  const distractorMeanings = getDistractorMeanings(word, allWords, 3);
  const options = [word.meaning_vi, ...distractorMeanings].sort(() => Math.random() - 0.5);
  
  return {
    id: `context-${word.id}-${Date.now()}`,
    word,
    type: 'context_meaning',
    question: 'What does the underlined word mean?',
    correctAnswer: word.meaning_vi,
    underlinedText,
    options,
  };
}

/**
 * Type D - Simple Meaning
 * Show just the word, options are meanings
 */
function generateSimpleMeaning(word: VocabularyWord, allWords: VocabularyWord[]): StudyQuestion {
  // Get meaning distractors
  const distractorMeanings = getDistractorMeanings(word, allWords, 3);
  const options = [word.meaning_vi, ...distractorMeanings].sort(() => Math.random() - 0.5);
  
  return {
    id: `simple-${word.id}-${Date.now()}`,
    word,
    type: 'simple_meaning',
    question: `What does "${word.vocabulary}" mean?`,
    correctAnswer: word.meaning_vi,
    options,
  };
}

/**
 * Type E - Dictation
 * User listens to audio and types the word
 */
function generateDictation(word: VocabularyWord): StudyQuestion {
  return {
    id: `dictation-${word.id}-${Date.now()}`,
    word,
    type: 'dictation',
    question: 'Listen and type what you hear:',
    correctAnswer: word.vocabulary,
  };
}

/**
 * Type F - Translation
 * Show Vietnamese meaning, user types English word
 */
function generateTranslation(word: VocabularyWord): StudyQuestion {
  return {
    id: `translation-${word.id}-${Date.now()}`,
    word,
    type: 'translation',
    question: 'Type the English word for:',
    correctAnswer: word.vocabulary,
  };
}

/**
 * Get distractor words (vocabulary)
 */
function getDistractorWords(word: VocabularyWord, allWords: VocabularyWord[], count: number): string[] {
  const sameTopicWords = allWords.filter(w => w.id !== word.id && w.topic === word.topic);
  const otherWords = allWords.filter(w => w.id !== word.id && w.topic !== word.topic);
  
  const potentialDistractors = [...sameTopicWords, ...otherWords];
  const distractors: string[] = [];
  
  const shuffled = potentialDistractors.sort(() => Math.random() - 0.5);
  for (const w of shuffled) {
    if (distractors.length >= count) break;
    if (w.vocabulary !== word.vocabulary && !distractors.includes(w.vocabulary)) {
      distractors.push(w.vocabulary);
    }
  }
  
  // Fallback if not enough distractors
  while (distractors.length < count) {
    distractors.push(`word${distractors.length + 1}`);
  }
  
  return distractors;
}

/**
 * Get distractor meanings (Vietnamese)
 */
function getDistractorMeanings(word: VocabularyWord, allWords: VocabularyWord[], count: number): string[] {
  const sameTopicWords = allWords.filter(w => w.id !== word.id && w.topic === word.topic);
  const otherWords = allWords.filter(w => w.id !== word.id && w.topic !== word.topic);
  
  const potentialDistractors = [...sameTopicWords, ...otherWords];
  const distractors: string[] = [];
  
  const shuffled = potentialDistractors.sort(() => Math.random() - 0.5);
  for (const w of shuffled) {
    if (distractors.length >= count) break;
    if (w.meaning_vi !== word.meaning_vi && !distractors.includes(w.meaning_vi)) {
      distractors.push(w.meaning_vi);
    }
  }
  
  // Fallback
  while (distractors.length < count) {
    distractors.push(`meaning ${distractors.length + 1}`);
  }
  
  return distractors;
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
  
  // Check which types are available
  const gapFillTextQ = generateGapFillText(word, allWords);
  const gapFillAudioQ = generateGapFillAudio(word, allWords);
  
  if (gapFillTextQ) availableTypes.push('gap_fill_text');
  if (gapFillAudioQ) availableTypes.push('gap_fill_audio');
  
  // These are always available
  availableTypes.push('context_meaning', 'simple_meaning', 'dictation', 'translation');
  
  // Select type
  let selectedType = preferredType;
  if (!selectedType || !availableTypes.includes(selectedType)) {
    selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }
  
  switch (selectedType) {
    case 'gap_fill_text':
      return gapFillTextQ || generateSimpleMeaning(word, allWords);
    case 'gap_fill_audio':
      return gapFillAudioQ || generateDictation(word);
    case 'context_meaning':
      return generateContextMeaning(word, allWords);
    case 'simple_meaning':
      return generateSimpleMeaning(word, allWords);
    case 'dictation':
      return generateDictation(word);
    case 'translation':
      return generateTranslation(word);
    default:
      return generateSimpleMeaning(word, allWords);
  }
}

/**
 * Generate questions for a study session
 * Ensures variety of question types
 */
export function generateSessionQuestions(
  words: VocabularyWord[],
  allWords: VocabularyWord[]
): StudyQuestion[] {
  if (words.length === 0) return [];
  
  const questions: StudyQuestion[] = [];
  const allTypes: QuestionType[] = [
    'gap_fill_text', 
    'gap_fill_audio', 
    'context_meaning', 
    'simple_meaning', 
    'dictation', 
    'translation'
  ];
  
  // Shuffle types for variety
  const shuffledTypes = [...allTypes].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Cycle through types for variety
    const preferredType = shuffledTypes[i % shuffledTypes.length];
    const question = generateQuestion(word, allWords, preferredType);
    questions.push(question);
  }
  
  return questions;
}

/**
 * Check if answer is correct (case-insensitive, ignore whitespace and punctuation)
 */
export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
  return normalize(userAnswer) === normalize(correctAnswer);
}
