import {
  isSubsegmentMatch,
  mapQuizSegmentToDbSegments,
} from './segment-matcher.util';

describe('segment-matcher.util', () => {
  describe('isSubsegmentMatch', () => {
    it('should match subsegments with same meaning but different word order', () => {
      const quizValue = 'Clínicas médicas e serviços';
      const dbValue = 'Clínicas médicas';

      expect(isSubsegmentMatch(quizValue, dbValue)).toBe(true);
    });

    it('should ignore stop words and accents when matching', () => {
      const quizValue = 'Docerias, Padarias e Cafés';
      const dbValue = 'Padarias e cafes';

      expect(isSubsegmentMatch(quizValue, dbValue)).toBe(true);
    });

    it('should require at least some word overlap to match', () => {
      const quizValue = 'Serviços Estéticos e Bem-Estar';
      const dbValue = 'Lavanderia';

      expect(isSubsegmentMatch(quizValue, dbValue)).toBe(false);
    });
  });

  describe('mapQuizSegmentToDbSegments', () => {
    it('should map Alimentação to canonical and DB alimentação segments', () => {
      const result = mapQuizSegmentToDbSegments('Alimentação');

      expect(result).toContain('Alimentação');
      expect(result).toEqual([
        'Alimentação',
        'Alimentação - Comercialização e Distribuição',
        'Alimentação - Comércio e Distribuição',
        'Alimentação - Food Service',
        'Alimentação - Foodservice',
      ]);
    });

    it('should map Serviços Automotivos to canonical and lowercase db variant', () => {
      const result = mapQuizSegmentToDbSegments('Serviços Automotivos');

      expect(result).toContain('Serviços Automotivos');
      expect(result).toEqual(['Serviços Automotivos', 'Serviços automotivos']);
    });

    it('should return original segment when no special mapping exists', () => {
      const segment = 'Educação';
      const result = mapQuizSegmentToDbSegments(segment);

      expect(result).toEqual([segment]);
    });
  });
});

