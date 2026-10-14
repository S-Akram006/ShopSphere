/**
 * Tolerant / Fuzzy Search Utility for ShopSphere
 * Handles:
 * - Case-insensitivity & normalization
 * - Plurals and singulars (e.g., 'headphones' <-> 'headphone', 'watches' <-> 'watch', 'hoodies' <-> 'hoodie')
 * - Minor typo tolerance via Levenshtein distance (e.g., 'wirless' -> 'wireless', 'leathr' -> 'leather')
 * - Multi-token queries (e.g., 'comfort headphone')
 * - Field weighting (Title > Category > Tags > Description)
 */

// Compute Levenshtein distance between two strings
export function levenshteinDistance(a, b) {
  if (!a || !b) return (a || '').length + (b || '').length;
  if (a === b) return 0;

  const al = a.length;
  const bl = b.length;
  const matrix = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));

  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[al][bl];
}

// Normalize word and return stem variations (singular, plural forms)
export function getWordVariations(word) {
  const clean = word.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (!clean) return [];

  const variations = new Set([clean]);

  // Plural to singular rules
  if (clean.endsWith('ies') && clean.length > 4) {
    variations.add(clean.slice(0, -3) + 'y');
  } else if (clean.endsWith('es') && clean.length > 3) {
    variations.add(clean.slice(0, -2));
    variations.add(clean.slice(0, -1)); // for cases like 'shoes' -> 'shoe'
  } else if (clean.endsWith('s') && clean.length > 2) {
    variations.add(clean.slice(0, -1));
  }

  // Singular to plural rules
  if (clean.endsWith('y') && clean.length > 2) {
    variations.add(clean.slice(0, -1) + 'ies');
  } else {
    variations.add(clean + 's');
    variations.add(clean + 'es');
  }

  return Array.from(variations);
}

/**
 * Check if a query token fuzzy-matches a target word
 */
export function tokenMatchesWord(queryToken, targetWord) {
  const qToken = queryToken.toLowerCase().trim();
  const tWord = targetWord.toLowerCase().trim();

  if (!qToken || !tWord) return false;

  // Exact or prefix match
  if (tWord.includes(qToken) || qToken.includes(tWord)) return true;

  // Check stem variations (plurals/singulars)
  const qVariations = getWordVariations(qToken);
  const tVariations = getWordVariations(tWord);

  for (const qv of qVariations) {
    for (const tv of tVariations) {
      if (qv === tv || tv.includes(qv) || qv.includes(tv)) {
        return true;
      }
    }
  }

  // Levenshtein typo tolerance based on word length
  const minLen = Math.min(qToken.length, tWord.length);
  const allowedDistance = minLen <= 3 ? 0 : minLen <= 5 ? 1 : 2;

  // Check direct distance
  if (levenshteinDistance(qToken, tWord) <= allowedDistance) {
    return true;
  }

  // Check distance against stems
  for (const qv of qVariations) {
    for (const tv of tVariations) {
      if (levenshteinDistance(qv, tv) <= allowedDistance) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a product matches a search query with typo and plural tolerance
 */
export function fuzzyMatchProduct(product, query) {
  if (!query || !query.trim()) return true;

  const rawTokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return true;

  // Extract all searchable text components from product
  const title = (product.title || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const tags = Array.isArray(product.tags) ? product.tags.map((t) => String(t).toLowerCase()) : [];
  const originCity = (product.originCity || '').toLowerCase();
  const storeName = (product.storeId?.storeName || '').toLowerCase();

  // Combine words
  const titleWords = title.split(/\s+/).filter(Boolean);
  const catWords = category.split(/\s+/).filter(Boolean);
  const descWords = description.split(/\s+/).filter(Boolean);
  const tagWords = tags.flatMap((t) => t.split(/\s+/).filter(Boolean));
  const storeWords = storeName.split(/\s+/).filter(Boolean);

  const allWords = [...titleWords, ...catWords, ...tagWords, ...storeWords, ...descWords];

  // For multi-token query (e.g., 'wireless headphones'), all tokens should match at least one word
  return rawTokens.every((token) => {
    // 1. Direct fast substring check on full text fields
    if (
      title.includes(token) ||
      category.includes(token) ||
      tags.some((t) => t.includes(token)) ||
      storeName.includes(token) ||
      description.includes(token)
    ) {
      return true;
    }

    // 2. Fuzzy token match against words in title, tags, category, store, description
    return allWords.some((word) => tokenMatchesWord(token, word));
  });
}
