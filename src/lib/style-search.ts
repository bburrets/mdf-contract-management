import { type Style, type StyleSuggestion } from '@/types/contract';

/**
 * Calculate similarity score between two strings using Levenshtein distance
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1 (1 being identical)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Score a style match based on multiple criteria
 * @param style - The style to score
 * @param searchQuery - The search query
 * @returns Match score and reason
 */
export function scoreStyleMatch(style: Style, searchQuery: string): { score: number; reason: string } {
  const query = searchQuery.toLowerCase().trim();
  
  // Exact matches get highest scores
  if (style.style_number.toLowerCase() === query) {
    return { score: 1.0, reason: 'Exact style number match' };
  }
  
  if (style.item_number.toLowerCase() === query) {
    return { score: 0.95, reason: 'Exact item number match' };
  }
  
  // Partial matches
  if (style.style_number.toLowerCase().includes(query)) {
    const similarity = calculateStringSimilarity(style.style_number, query);
    return { score: 0.8 + (similarity * 0.15), reason: 'Style number partial match' };
  }
  
  if (style.item_number.toLowerCase().includes(query)) {
    const similarity = calculateStringSimilarity(style.item_number, query);
    return { score: 0.7 + (similarity * 0.15), reason: 'Item number partial match' };
  }
  
  // Description matches
  if (style.item_desc.toLowerCase().includes(query)) {
    const similarity = calculateStringSimilarity(style.item_desc, query);
    return { score: 0.5 + (similarity * 0.2), reason: 'Description match' };
  }
  
  // Metadata matches
  if (style.season.toLowerCase().includes(query)) {
    return { score: 0.3, reason: 'Season match' };
  }
  
  if (style.business_line.toLowerCase().includes(query)) {
    return { score: 0.25, reason: 'Business line match' };
  }
  
  // Fuzzy matches using Levenshtein distance
  const styleNumberSimilarity = calculateStringSimilarity(style.style_number, query);
  const itemNumberSimilarity = calculateStringSimilarity(style.item_number, query);
  const descriptionSimilarity = calculateStringSimilarity(style.item_desc, query);
  
  const maxSimilarity = Math.max(styleNumberSimilarity, itemNumberSimilarity, descriptionSimilarity * 0.7);
  
  if (maxSimilarity > 0.6) {
    let reason = 'Fuzzy match';
    if (styleNumberSimilarity === maxSimilarity) reason = 'Style number fuzzy match';
    else if (itemNumberSimilarity === maxSimilarity) reason = 'Item number fuzzy match';
    else if (descriptionSimilarity * 0.7 === maxSimilarity) reason = 'Description fuzzy match';
    
    return { score: maxSimilarity * 0.4, reason };
  }
  
  return { score: 0, reason: 'No significant match' };
}

/**
 * Rank and filter style suggestions based on search query
 * @param styles - Array of styles to rank
 * @param searchQuery - The search query
 * @param minScore - Minimum score to include in results (default: 0.2)
 * @returns Ranked array of style suggestions
 */
export function rankStyleMatches(
  styles: Style[], 
  searchQuery: string, 
  minScore: number = 0.2
): StyleSuggestion[] {
  const suggestions: StyleSuggestion[] = styles
    .map(style => {
      const { score, reason } = scoreStyleMatch(style, searchQuery);
      return {
        style,
        confidence: score,
        match_reason: reason
      };
    })
    .filter(suggestion => suggestion.confidence >= minScore)
    .sort((a, b) => {
      // Sort by confidence score (descending), then by style number (ascending)
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return a.style.style_number.localeCompare(b.style.style_number);
    });
    
  return suggestions;
}

/**
 * Validate if a style number exists and return style details
 * @param styleNumber - The style number to validate
 * @param availableStyles - Array of available styles
 * @returns Style if found, null otherwise
 */
export function validateStyleNumber(styleNumber: string, availableStyles: Style[]): Style | null {
  const normalizedInput = styleNumber.trim().toLowerCase();
  
  // First try exact match on style number
  const exactMatch = availableStyles.find(
    style => style.style_number.toLowerCase() === normalizedInput
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Then try exact match on item number
  const itemMatch = availableStyles.find(
    style => style.item_number.toLowerCase() === normalizedInput
  );
  
  return itemMatch || null;
}

/**
 * Format style display name for UI components
 * @param style - The style to format
 * @param includeDescription - Whether to include description
 * @returns Formatted display string
 */
export function formatStyleDisplayName(style: Style, includeDescription: boolean = true): string {
  const base = `${style.style_number} (${style.item_number})`;
  
  if (includeDescription && style.item_desc) {
    return `${base} - ${style.item_desc}`;
  }
  
  return base;
}