/**
 * Maps CSV column headers in Portuguese to the English field names used by the franchise schema.
 * Keys not in this map are left unchanged (supports CSVs with English headers).
 */
export const CSV_HEADER_PT_TO_EN: Record<string, string> = {
  nome: 'name',
  descrição: 'description',
  segmento: 'segment',
  investimento_mínimo: 'minimumInvestment',
  investimento_máximo: 'maximumInvestment',
  cidade: 'headquarter',
  estado: 'headquarterState',
  site: 'website',
  'e-mail': 'email',
  telefone: 'phone',
  total_unidades: 'totalUnits',
}

/**
 * Translates CSV record keys from Portuguese to English using CSV_HEADER_PT_TO_EN.
 * Unmapped keys are preserved (e.g. already-English headers).
 */
export function translateCsvRecords(
  records: Record<string, unknown>[],
): Record<string, unknown>[] {
  return records.map((record) => {
    const translated: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(record)) {
      const enKey = CSV_HEADER_PT_TO_EN[key.trim()] ?? key
      translated[enKey] = value
    }
    return translated
  })
}
