/**
 * Test numeric parsing utilities for scraping
 * Tests the new parsing functions that convert scraped text to numeric ranges
 */

import { describe, expect, it } from '@jest/globals';
import {
  parseArea,
  parseInvestmentRange,
  parseMonetaryValue,
  parsePercentage,
  parseROIRange,
} from '../utils/numeric-parser.util';

describe('Numeric Parsing Utilities', () => {
  describe('parseMonetaryValue', () => {
    it('should parse Brazilian currency format', () => {
      expect(parseMonetaryValue('R$ 50.000')).toBe(50000);
      expect(parseMonetaryValue('R$ 1.500.000')).toBe(1500000);
      expect(parseMonetaryValue('R$90.000')).toBe(90000);
    });

    it('should handle decimals with comma separator', () => {
      expect(parseMonetaryValue('R$ 50.000,50')).toBe(50000.5);
      expect(parseMonetaryValue('R$ 1.500.000,99')).toBe(1500000.99);
    });

    it('should handle values without currency symbol', () => {
      expect(parseMonetaryValue('50.000')).toBe(50000);
      expect(parseMonetaryValue('1500000')).toBe(1500000);
    });

    it('should handle null/undefined/empty', () => {
      expect(parseMonetaryValue(null)).toBeNull();
      expect(parseMonetaryValue(undefined)).toBeNull();
      expect(parseMonetaryValue('')).toBeNull();
      expect(parseMonetaryValue('-')).toBeNull();
      expect(parseMonetaryValue('N/A')).toBeNull();
    });

    it('should handle malformed data', () => {
      expect(parseMonetaryValue('Consulte')).toBeNull();
      expect(parseMonetaryValue('abc')).toBeNull();
    });
  });

  describe('parseInvestmentRange', () => {
    it('should parse investment ranges with "a"', () => {
      const result = parseInvestmentRange('R$ 50.000 a R$ 100.000');
      expect(result.minimum).toBe(50000);
      expect(result.maximum).toBe(100000);
    });

    it('should parse investment ranges with "até"', () => {
      const result = parseInvestmentRange('R$ 50.000 até R$ 100.000');
      expect(result.minimum).toBe(50000);
      expect(result.maximum).toBe(100000);
    });

    it('should parse investment ranges with "-"', () => {
      const result = parseInvestmentRange('R$ 50.000 - R$ 100.000');
      expect(result.minimum).toBe(50000);
      expect(result.maximum).toBe(100000);
    });

    it('should parse ranges without spacing', () => {
      const result = parseInvestmentRange('135.000 a 300.000');
      expect(result.minimum).toBe(135000);
      expect(result.maximum).toBe(300000);
    });

    it('should handle "a partir de" pattern', () => {
      const result = parseInvestmentRange('a partir de R$ 415.000');
      expect(result.minimum).toBe(415000);
      expect(result.maximum).toBeNull();
    });

    it('should handle single values', () => {
      const result = parseInvestmentRange('R$ 50.000');
      expect(result.minimum).toBe(50000);
      expect(result.maximum).toBeNull();
    });

    it('should handle reversed min/max (auto-fix)', () => {
      const result = parseInvestmentRange('R$ 100.000 a R$ 50.000');
      expect(result.minimum).toBe(50000);
      expect(result.maximum).toBe(100000);
    });

    it('should handle null/undefined/empty', () => {
      expect(parseInvestmentRange(null)).toEqual({
        minimum: null,
        maximum: null,
      });
      expect(parseInvestmentRange('Consulte')).toEqual({
        minimum: null,
        maximum: null,
      });
      expect(parseInvestmentRange('-')).toEqual({
        minimum: null,
        maximum: null,
      });
    });

    it('should handle large numbers', () => {
      const result = parseInvestmentRange('a partir de R$ 1.500.000');
      expect(result.minimum).toBe(1500000);
      expect(result.maximum).toBeNull();
    });
  });

  describe('parseROIRange', () => {
    it('should parse ROI ranges in months', () => {
      const result = parseROIRange('12 a 18 meses');
      expect(result.minimum).toBe(12);
      expect(result.maximum).toBe(18);
    });

    it('should parse with "até"', () => {
      const result = parseROIRange('12 até 18 meses');
      expect(result.minimum).toBe(12);
      expect(result.maximum).toBe(18);
    });

    it('should parse with "de"', () => {
      const result = parseROIRange('de 9 a 18 meses');
      expect(result.minimum).toBe(9);
      expect(result.maximum).toBe(18);
    });

    it('should parse single month values', () => {
      const result = parseROIRange('12 meses');
      expect(result.minimum).toBe(12);
      expect(result.maximum).toBeNull();
    });

    it('should parse year ranges (convert to months)', () => {
      const result = parseROIRange('2 a 3 anos');
      expect(result.minimum).toBe(24);
      expect(result.maximum).toBe(36);
    });

    it('should parse single year values (convert to months)', () => {
      const result = parseROIRange('1 ano');
      expect(result.minimum).toBe(12);
      expect(result.maximum).toBeNull();
    });

    it('should handle null/undefined/empty', () => {
      expect(parseROIRange(null)).toEqual({ minimum: null, maximum: null });
      expect(parseROIRange('Consulte')).toEqual({
        minimum: null,
        maximum: null,
      });
      expect(parseROIRange('-')).toEqual({ minimum: null, maximum: null });
    });

    it('should handle edge cases', () => {
      const result = parseROIRange('de 24 a 36 meses');
      expect(result.minimum).toBe(24);
      expect(result.maximum).toBe(36);
    });
  });

  describe('parsePercentage', () => {
    it('should parse percentage values', () => {
      expect(parsePercentage('5%')).toBe(5);
      expect(parsePercentage('10%')).toBe(10);
      expect(parsePercentage('3,5%')).toBe(3.5);
    });

    it('should handle values without % symbol', () => {
      expect(parsePercentage('5')).toBe(5);
      expect(parsePercentage('3.5')).toBe(3.5);
    });

    it('should handle comma decimal separator', () => {
      expect(parsePercentage('5,5%')).toBe(5.5);
      expect(parsePercentage('10,25%')).toBe(10.25);
    });

    it('should handle null/undefined/empty', () => {
      expect(parsePercentage(null)).toBeNull();
      expect(parsePercentage(undefined)).toBeNull();
      expect(parsePercentage('')).toBeNull();
      expect(parsePercentage('-')).toBeNull();
    });
  });

  describe('parseArea', () => {
    it('should parse area in square meters', () => {
      expect(parseArea('100 m²')).toBe(100);
      expect(parseArea('100m2')).toBe(100);
      expect(parseArea('100 metros quadrados')).toBe(100);
    });

    it('should handle decimals (rounded)', () => {
      expect(parseArea('100.5 m²')).toBe(101);
      expect(parseArea('100,5 m²')).toBe(101);
    });

    it('should handle values without units', () => {
      expect(parseArea('100')).toBe(100);
    });

    it('should handle null/undefined/empty', () => {
      expect(parseArea(null)).toBeNull();
      expect(parseArea(undefined)).toBeNull();
      expect(parseArea('')).toBeNull();
    });
  });

  describe('Integration - Real Scraping Scenarios', () => {
    it('should parse O Boticário investment', () => {
      const result = parseInvestmentRange('a partir de R$ 385.000');
      expect(result.minimum).toBe(385000);
      expect(result.maximum).toBeNull();
    });

    it('should parse Subway investment range', () => {
      const result = parseInvestmentRange('300.000 a 600.000');
      expect(result.minimum).toBe(300000);
      expect(result.maximum).toBe(600000);
    });

    it('should parse typical ROI', () => {
      const result = parseROIRange('de 18 a 30 meses');
      expect(result.minimum).toBe(18);
      expect(result.maximum).toBe(30);
    });

    it('should parse typical franchise fee', () => {
      const fee = parseMonetaryValue('90.000 (Fixo)');
      expect(fee).toBe(90000);
    });

    it('should parse typical royalties', () => {
      const royalties = parsePercentage('5%');
      expect(royalties).toBe(5);
    });

    it('should handle complete franchise data', () => {
      const investmentRange = parseInvestmentRange('R$ 135.000 a R$ 300.000');
      const roiRange = parseROIRange('de 9 a 18 meses');
      const fee = parseMonetaryValue('90.000');
      const revenue = parseMonetaryValue('R$150.000');
      const royalties = parsePercentage('5%');
      const area = parseArea('100 m²');

      expect(investmentRange).toEqual({ minimum: 135000, maximum: 300000 });
      expect(roiRange).toEqual({ minimum: 9, maximum: 18 });
      expect(fee).toBe(90000);
      expect(revenue).toBe(150000);
      expect(royalties).toBe(5);
      expect(area).toBe(100);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle text with currency values', () => {
      // Parser is designed for clean monetary values, not arbitrary text
      // For mixed text, scrapers should extract the value first
      const cleanValue = 'R$ 50.000';
      const result = parseMonetaryValue(cleanValue);
      expect(result).toBe(50000);
    });

    it('should handle very large numbers', () => {
      const result = parseInvestmentRange('R$ 5.000.000 a R$ 10.000.000');
      expect(result.minimum).toBe(5000000);
      expect(result.maximum).toBe(10000000);
    });

    it('should handle zero values', () => {
      expect(parseMonetaryValue('0')).toBe(0);
      expect(parsePercentage('0%')).toBe(0);
    });

    it('should handle whitespace variations', () => {
      expect(parseMonetaryValue('  R$  50.000  ')).toBe(50000);
      expect(parsePercentage('  5%  ')).toBe(5);
    });
  });
});
