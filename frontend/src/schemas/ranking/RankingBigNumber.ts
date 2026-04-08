export interface RankingBigNumber {
  id: string
  name: string
  position: number
  growthPercentage: number
  isWorst: boolean
  isHidden: boolean
  year: number
  createdAt: string
  updatedAt: string
}

export interface RankingBigNumberInput {
  name: string
  position: number
  growthPercentage: number
  year?: number
}
