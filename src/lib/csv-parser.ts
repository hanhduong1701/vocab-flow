import { VocabularyWord, ImportResult } from '@/types/vocabulary';

interface RawCSVRow {
  vocabulary?: string;
  Type?: string; // Part of speech
  IPA?: string; // Pronunciation
  Meaning_VI?: string;
  Meaning_EN?: string;
  Example_EN?: string;
  Example_VI?: string;
  Topic?: string;
  [key: string]: string | undefined;
}

/**
 * Parse a CSV string into rows
 */
function parseCSV(csvText: string): RawCSVRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const rows: RawCSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: RawCSVRow = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Generate a unique UUID
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Import vocabulary from CSV
 */
export function importCSV(
  csvText: string,
  existingWords: VocabularyWord[],
  onDuplicate: 'skip' | 'overwrite' = 'skip',
  sourceId?: string
): { words: VocabularyWord[]; result: ImportResult } {
  const result: ImportResult = {
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
  
  const rows = parseCSV(csvText);
  const newWords: VocabularyWord[] = [...existingWords];
  const existingVocab = new Map(
    existingWords.map(w => [w.vocabulary.toLowerCase(), w])
  );
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // Account for header and 0-indexing
    
    // Validate required fields
    if (!row.vocabulary?.trim()) {
      result.failed++;
      result.errors.push(`Line ${lineNum}: Missing vocabulary`);
      continue;
    }
    
    if (!row.Meaning_VI?.trim() && !row.Meaning_EN?.trim()) {
      result.failed++;
      result.errors.push(`Line ${lineNum}: Missing meaning (VI or EN required)`);
      continue;
    }
    
    if (!row.Example_EN?.trim()) {
      result.failed++;
      result.errors.push(`Line ${lineNum}: Missing Example_EN`);
      continue;
    }
    
    const vocabLower = row.vocabulary.trim().toLowerCase();
    const existing = existingVocab.get(vocabLower);
    
    if (existing) {
      if (onDuplicate === 'skip') {
        result.skipped++;
        continue;
      }
      // Overwrite: update existing word
      const index = newWords.findIndex(w => w.id === existing.id);
      if (index !== -1) {
        newWords[index] = {
          ...existing,
          vocabulary: row.vocabulary.trim(),
          type: row.Type?.trim() || existing.type,
          ipa: row.IPA?.trim() || existing.ipa,
          meaning_vi: row.Meaning_VI?.trim() || existing.meaning_vi,
          meaning_en: row.Meaning_EN?.trim() || existing.meaning_en,
          example_en: row.Example_EN.trim(),
          example_vi: row.Example_VI?.trim(),
          topic: row.Topic?.trim(),
          extra_fields: extractExtraFields(row),
          source_file: sourceId || existing.source_file,
        };
        result.success++;
        continue;
      }
    }
    
    // Create new word
    const newWord: VocabularyWord = {
      id: generateId(),
      vocabulary: row.vocabulary.trim(),
      type: row.Type?.trim(),
      ipa: row.IPA?.trim(),
      meaning_vi: row.Meaning_VI?.trim() || '',
      meaning_en: row.Meaning_EN?.trim() || '',
      example_en: row.Example_EN.trim(),
      example_vi: row.Example_VI?.trim(),
      topic: row.Topic?.trim(),
      extra_fields: extractExtraFields(row),
      source_file: sourceId,
      level: 1,
      next_review: new Date(),
      correct_count: 0,
      incorrect_count: 0,
      created_at: new Date(),
    };
    
    newWords.push(newWord);
    existingVocab.set(vocabLower, newWord);
    result.success++;
  }
  
  return { words: newWords, result };
}

/**
 * Extract extra fields from a row
 */
function extractExtraFields(row: RawCSVRow): Record<string, string> {
  const knownFields = ['vocabulary', 'Type', 'IPA', 'Meaning_VI', 'Meaning_EN', 'Example_EN', 'Example_VI', 'Topic'];
  const extra: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(row)) {
    if (!knownFields.includes(key) && value?.trim()) {
      extra[key] = value.trim();
    }
  }
  
  return Object.keys(extra).length > 0 ? extra : {};
}