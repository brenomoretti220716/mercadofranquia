/**
 * Utility functions to parse string monetary and numeric values
 * from Brazilian format to numeric values for database storage
 */

/**
 * Parse Brazilian monetary string to number
 * Handles specific patterns from your database:
 *   "135.000 a 300.000" → 135000 (range: takes first/minimum)
 *   "a partir de R$ 415.000" → 415000 (most common)
 *   "R$90.000" → 90000
 *   "90.000" → 90000
 *   null/undefined → null
 */
export function parseMonetaryValue(
  value: string | null | undefined,
): number | null {
  if (!value || value.trim() === '') return null;

  try {
    let cleaned = value.trim();

    // Remove "a partir de" prefix (most common pattern)
    cleaned = cleaned.replace(/a partir de/gi, '').trim();

    // Remove R$ symbol and spaces
    cleaned = cleaned.replace(/R\$/gi, '').trim();

    // Handle ranges: "135.000 a 300.000" → take first number
    if (cleaned.includes(' a ')) {
      const parts = cleaned.split(' a ');
      cleaned = parts[0].trim();
    }

    // Remove any remaining letters (but keep numbers and dots)
    cleaned = cleaned.replace(/[a-zA-Z()]/g, '').trim();

    // Brazilian format uses dots (.) as thousand separators (no decimals in your data)
    // "150.000" → "150000"
    // "1.500.000" → "1500000"
    cleaned = cleaned.replace(/\./g, '');

    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? null : parsed;
  } catch (error) {
    console.warn(`Failed to parse monetary value: "${value}"`, error);
    return null;
  }
}

/**
 * Parse ROI (Return on Investment) string to months
 * Handles specific pattern from your database:
 *   "de 9 a 18 meses" → 9 (takes first/minimum in range)
 *   "18 meses" → 18
 *   "2 anos" → 24
 *   null/undefined → null
 */
export function parseROIToMonths(
  value: string | null | undefined,
): number | null {
  if (!value || value.trim() === '') return null;

  try {
    let cleaned = value.toLowerCase().trim();

    // Remove "de" prefix if present: "de 9 a 18 meses"
    cleaned = cleaned.replace(/^de\s+/gi, '').trim();

    // Extract all numbers
    const numbers = cleaned.match(/\d+/g);
    if (!numbers || numbers.length === 0) return null;

    // Take the first number (minimum in range)
    let months = parseInt(numbers[0], 10);

    // Convert years to months if "ano" is mentioned
    if (cleaned.includes('ano')) {
      months = months * 12;
    }

    return isNaN(months) ? null : months;
  } catch (error) {
    console.warn(`Failed to parse ROI value: "${value}"`, error);
    return null;
  }
}

/**
 * Parse area string to square meters
 * Examples:
 *   "150 m²" → 150
 *   "200m2" → 200
 *   "50 a 100 m²" → 50
 */
export function parseAreaToSquareMeters(
  value: string | null | undefined,
): number | null {
  if (!value || value.trim() === '') return null;

  try {
    let cleaned = value
      .toLowerCase()
      .replace(/m²|m2|metros quadrados/g, '')
      .replace(/a partir de/g, '')
      .replace(/até/g, '')
      .trim();

    // Handle ranges: take the first number (minimum)
    if (cleaned.includes('a') || cleaned.includes('-')) {
      cleaned = cleaned.split(/a|-/)[0].trim();
    }

    // Remove thousand separators and handle decimal
    if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : Math.round(parsed);
  } catch (error) {
    console.warn(`Failed to parse area value: "${value}"`, error);
    return null;
  }
}

/**
 * Test function to validate parsing with YOUR DATABASE patterns
 */
export function testParsers() {
  console.log('=== Testing totalInvestment Parser ===');
  const investmentTests = [
    '135.000 a 300.000', // Range pattern
    'a partir de R$ 415.000', // Most common
    'a partir de R$ 1.500.000', // Large value
    null,
  ];

  investmentTests.forEach((test) => {
    console.log(`"${test}" → ${parseMonetaryValue(test)}`);
  });

  console.log('\n=== Testing returnOnInvestment Parser ===');
  const roiTests = [
    'de 9 a 18 meses', // Your database pattern
    'de 12 a 24 meses',
    '18 meses',
    null,
  ];

  roiTests.forEach((test) => {
    console.log(`"${test}" → ${parseROIToMonths(test)}`);
  });

  console.log('\n=== Testing franchiseFee Parser ===');
  const feeTests = [
    '90.000', // Just number
    '90.000 (Fixo)', // With (Fixo) suffix
    '150.000',
    null,
  ];

  feeTests.forEach((test) => {
    console.log(`"${test}" → ${parseMonetaryValue(test)}`);
  });

  console.log('\n=== Testing averageMonthlyRevenue Parser ===');
  const revenueTests = [
    'R$90.000', // Your database pattern
    'R$150.000',
    'R$1.500.000',
    null,
  ];

  revenueTests.forEach((test) => {
    console.log(`"${test}" → ${parseMonetaryValue(test)}`);
  });
}
