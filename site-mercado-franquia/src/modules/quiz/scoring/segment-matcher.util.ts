const STOP_WORDS = new Set([
  'e',
  'de',
  'da',
  'do',
  'das',
  'dos',
  'para',
  'em',
  '-',
]);

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tokenize(value: string): string[] {
  return removeAccents(value)
    .toLowerCase()
    .split(/[\s/-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));
}

export function normalizeSegmentLabel(value: string): string {
  return removeAccents(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isSegmentFamilyMatch(
  quizSegment: string,
  dbSegment: string,
): boolean {
  const quizNorm = normalizeSegmentLabel(quizSegment);
  const dbNorm = normalizeSegmentLabel(dbSegment);

  if (quizNorm.startsWith('alimentacao')) {
    return dbNorm.startsWith('alimentacao');
  }

  if (quizNorm.startsWith('saude, beleza e bem')) {
    return dbNorm.startsWith('saude, beleza e bem');
  }

  if (quizNorm.startsWith('servicos automotivos')) {
    return dbNorm.startsWith('servicos automotivos');
  }

  return quizNorm === dbNorm;
}

export function isSubsegmentMatch(quizValue: string, dbValue: string): boolean {
  const quizTokens = tokenize(quizValue);
  const dbTokens = tokenize(dbValue);

  if (quizTokens.length === 0 || dbTokens.length === 0) {
    return false;
  }

  const dbSet = new Set(dbTokens);
  let overlap = 0;

  for (const token of quizTokens) {
    if (dbSet.has(token)) {
      overlap += 1;
    }
  }

  // Require at least 2 overlapping significant words to avoid false positives
  return overlap >= 2 || (overlap === 1 && quizTokens.length === 1);
}

/**
 * Maps a quiz segment label to one or more database segment strings.
 * This handles cases where the ABF segments differ slightly from how
 * they are stored in the database. Includes the canonical quiz key so that
 * canonical segment values stored in the database match correctly.
 */
export function mapQuizSegmentToDbSegments(quizSegment: string): string[] {
  switch (quizSegment) {
    case 'Alimentação':
    case 'Alimentacao':
    case 'Alimentação - Comercialização e Distribuição':
    case 'Alimentação - Comércio e Distribuição':
    case 'Alimentacao - Comercializacao e Distribuicao':
    case 'Alimentacao - Comercio e Distribuicao':
    case 'Alimentação - Food Service':
    case 'Alimentação - Foodservice':
    case 'Alimentacao - Food Service':
    case 'Alimentacao - Foodservice':
      return [
        'Alimentação',
        'Alimentação - Comercialização e Distribuição',
        'Alimentação - Comércio e Distribuição',
        'Alimentação - Food Service',
        'Alimentação - Foodservice',
      ];

    case 'Serviços Automotivos':
    case 'Serviços automotivos':
      return ['Serviços Automotivos', 'Serviços automotivos'];

    case 'Serviços e Outros Negócios':
      return ['Serviços e Outros Negócios'];

    case 'Casa e Construção':
      return ['Casa e Construção'];

    case 'Comunicação, Informática e Eletrônicos':
      return ['Comunicação, Informática e Eletrônicos'];

    case 'Educação':
      return ['Educação'];

    case 'Entretenimento e Lazer':
      return ['Entretenimento e Lazer'];

    case 'Hotelaria e Turismo':
      return ['Hotelaria e Turismo', 'Hotelaria e Turismo*'];

    case 'Limpeza e Conservação':
      return ['Limpeza e Conservação'];

    case 'Moda':
      return ['Moda'];

    case 'Saúde, Beleza e Bem-Estar':
    case 'Saúde, Beleza e Bem-estar':
    case 'Saúde, Beleza e Bem Estar':
      return [
        'Saúde, Beleza e Bem-Estar',
        'Saúde, Beleza e Bem-estar',
        'Saúde, Beleza e Bem Estar',
      ];

    default:
      return [quizSegment];
  }
}
