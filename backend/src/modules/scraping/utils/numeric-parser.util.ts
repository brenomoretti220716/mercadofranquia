/**
 * Utility functions for parsing numeric values from scraped text
 */

export interface NumericRange {
  minimum: number | null;
  maximum: number | null;
}

export interface ROIRange {
  minimum: number | null; // in months
  maximum: number | null; // in months
}

/**
 * Parse monetary value from Brazilian format to number
 * Examples:
 *   "R$ 50.000" → 50000
 *   "R$ 1.500.000,50" → 1500000.50
 *   "50000" → 50000
 */
export function parseMonetaryValue(
  value: string | null | undefined,
): number | null {
  if (!value || typeof value !== 'string') return null;

  // Remove common prefixes and clean
  let cleaned = value
    .replace(/R\$\s*/gi, '')
    .replace(/USD\s*/gi, '')
    .replace(/\s+/g, '')
    .trim();

  // Handle empty after cleaning
  if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'n/a')
    return null;

  // Replace Brazilian decimal separator (comma) with period
  // But first, remove thousand separators (periods in Brazilian format)
  cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse investment range from text
 * Examples:
 *   "R$ 50.000 a R$ 100.000" → { minimum: 50000, maximum: 100000 }
 *   "R$ 50.000 até R$ 100.000" → { minimum: 50000, maximum: 100000 }
 *   "R$ 50.000" → { minimum: 50000, maximum: null }
 *   "A partir de R$ 50.000" → { minimum: 50000, maximum: null }
 */
export function parseInvestmentRange(
  value: string | null | undefined,
): NumericRange {
  if (!value || typeof value !== 'string') {
    return { minimum: null, maximum: null };
  }

  const text = value.trim();

  // Handle "N/A", "Consulte", etc.
  if (
    !text ||
    text === '-' ||
    text.toLowerCase().includes('consulte') ||
    text.toLowerCase() === 'n/a'
  ) {
    return { minimum: null, maximum: null };
  }

  // Pattern: "R$ X a R$ Y" or "R$ X até R$ Y" or "R$ X - R$ Y"
  const rangePatterns = [
    /(?:R\$\s*)?([0-9.,]+)\s*(?:a|até|-)\s*(?:R\$\s*)?([0-9.,]+)/i,
  ];

  for (const pattern of rangePatterns) {
    const match = text.match(pattern);
    if (match) {
      const minimum = parseMonetaryValue(match[1]);
      const maximum = parseMonetaryValue(match[2]);

      // Ensure minimum <= maximum
      if (minimum !== null && maximum !== null && minimum > maximum) {
        return { minimum: maximum, maximum: minimum };
      }

      return { minimum, maximum };
    }
  }

  // Pattern: "A partir de R$ X"
  if (text.toLowerCase().includes('a partir de')) {
    const match = text.match(/([0-9.,]+)/);
    if (match) {
      return { minimum: parseMonetaryValue(match[1]), maximum: null };
    }
  }

  // Single value - try to parse as minimum
  const singleValue = parseMonetaryValue(text);
  if (singleValue !== null) {
    return { minimum: singleValue, maximum: null };
  }

  return { minimum: null, maximum: null };
}

/**
 * Parse ROI (Return on Investment) from text to months
 * Examples:
 *   "12 a 18 meses" → { minimum: 12, maximum: 18 }
 *   "12 meses" → { minimum: 12, maximum: null }
 *   "1 ano" → { minimum: 12, maximum: null }
 *   "2 a 3 anos" → { minimum: 24, maximum: 36 }
 */
export function parseROIRange(value: string | null | undefined): ROIRange {
  if (!value || typeof value !== 'string') {
    return { minimum: null, maximum: null };
  }

  const text = value.trim().toLowerCase();

  // Handle "N/A", "Consulte", etc.
  if (!text || text === '-' || text.includes('consulte') || text === 'n/a') {
    return { minimum: null, maximum: null };
  }

  // Pattern: "X a Y anos" (check FIRST - more specific)
  const yearsRangeMatch = text.match(/(\d+)\s*(?:a|até)\s*(\d+)\s*anos?/i);
  if (yearsRangeMatch) {
    const minYears = parseInt(yearsRangeMatch[1]);
    const maxYears = parseInt(yearsRangeMatch[2]);
    return {
      minimum: isNaN(minYears) ? null : minYears * 12,
      maximum: isNaN(maxYears) ? null : maxYears * 12,
    };
  }

  // Pattern: "X ano" or "X anos" (single year)
  const singleYearMatch = text.match(/(\d+)\s*anos?(?:\s|$)/i);
  if (singleYearMatch) {
    const years = parseInt(singleYearMatch[1]);
    return {
      minimum: isNaN(years) ? null : years * 12,
      maximum: null,
    };
  }

  // Pattern: "X a Y meses" or "X até Y meses" (require "mes")
  const monthsRangeMatch = text.match(
    /(\d+)\s*(?:a|até)\s*(\d+)\s*mes(?:es)?/i,
  );
  if (monthsRangeMatch) {
    const min = parseInt(monthsRangeMatch[1]);
    const max = parseInt(monthsRangeMatch[2]);
    return {
      minimum: isNaN(min) ? null : min,
      maximum: isNaN(max) ? null : max,
    };
  }

  // Pattern: "X meses" (single month - require "mes")
  const singleMonthMatch = text.match(/(\d+)\s*mes(?:es)?/i);
  if (singleMonthMatch) {
    const months = parseInt(singleMonthMatch[1]);
    return {
      minimum: isNaN(months) ? null : months,
      maximum: null,
    };
  }

  return { minimum: null, maximum: null };
}

/**
 * Parse percentage from text
 * Examples:
 *   "5%" → 5
 *   "5,5%" → 5.5
 *   "5.5%" → 5.5
 */
export function parsePercentage(
  value: string | null | undefined,
): number | null {
  if (!value || typeof value !== 'string') return null;

  const cleaned = value
    .replace(/%/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .trim();

  if (!cleaned || cleaned === '-') return null;

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse area from text to square meters
 * Examples:
 *   "100 m²" → 100
 *   "100m2" → 100
 *   "100 metros quadrados" → 100
 */
export function parseArea(value: string | null | undefined): number | null {
  if (!value || typeof value !== 'string') return null;

  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;

  const cleaned = match[1].replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : Math.round(parsed);
}
