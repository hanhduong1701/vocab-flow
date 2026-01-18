/**
 * Language detection and TTS utilities
 * Supports multiple languages including English and Chinese
 */

// Check if text contains Chinese characters
export function containsChinese(text: string): boolean {
  // Match CJK Unified Ideographs and common Chinese punctuation
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

// Check if text contains Japanese specific characters (Hiragana/Katakana)
export function containsJapanese(text: string): boolean {
  return /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
}

// Check if text contains Korean characters
export function containsKorean(text: string): boolean {
  return /[\uac00-\ud7af\u1100-\u11ff]/.test(text);
}

// Check if text is primarily Latin/English
export function isLatin(text: string): boolean {
  // Match basic Latin characters
  return /^[\x00-\x7F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]+$/.test(text.replace(/\s/g, ''));
}

/**
 * Detect the language of a vocabulary word and return appropriate TTS language code
 * Priority: Chinese > Japanese > Korean > Default (English)
 */
export function detectLanguage(text: string): string {
  if (containsChinese(text) && !containsJapanese(text)) {
    return 'zh-CN'; // Mandarin Chinese
  }
  if (containsJapanese(text)) {
    return 'ja-JP'; // Japanese
  }
  if (containsKorean(text)) {
    return 'ko-KR'; // Korean
  }
  return 'en-US'; // Default to English
}

/**
 * Get language display name
 */
export function getLanguageName(langCode: string): string {
  const names: Record<string, string> = {
    'en-US': 'English',
    'zh-CN': 'Chinese (Mandarin)',
    'zh-TW': 'Chinese (Traditional)',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean',
    'vi-VN': 'Vietnamese',
  };
  return names[langCode] || langCode;
}

/**
 * Speak text using Web Speech API with auto language detection
 */
export function speakText(text: string, customLang?: string) {
  try {
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = customLang || detectLanguage(text);
    utterance.rate = 0.85;
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
    };
    
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Failed to play audio:', error);
  }
}
