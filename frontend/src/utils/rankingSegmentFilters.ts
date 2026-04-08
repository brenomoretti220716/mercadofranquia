export interface RankingSegmentFilterParams {
  segment?: string
  subsegment?: string
  excludeSubsegment?: string
}

const FOOD_SEGMENT = 'Alimentação'
const DISTRIBUTION_SUBSEGMENT = 'Mercados e Distribuição'
const FOOD_DISTRIBUTION_LABEL = 'Alimentação - Mercados e Distribuição'
const LEGACY_FOOD_DISTRIBUTION_LABEL =
  'Alimentação - Comercialização e Distribuição'
const FOOD_SERVICE_LABEL = 'Alimentação - Food Service'

export function getRankingSegmentFilterParams(
  selectedSegment?: string,
): RankingSegmentFilterParams {
  if (!selectedSegment) {
    return {}
  }

  if (
    selectedSegment === FOOD_DISTRIBUTION_LABEL ||
    selectedSegment === LEGACY_FOOD_DISTRIBUTION_LABEL
  ) {
    return {
      segment: FOOD_SEGMENT,
      subsegment: DISTRIBUTION_SUBSEGMENT,
    }
  }

  if (selectedSegment === FOOD_SERVICE_LABEL) {
    return {
      segment: FOOD_SEGMENT,
      excludeSubsegment: DISTRIBUTION_SUBSEGMENT,
    }
  }

  return { segment: selectedSegment }
}
