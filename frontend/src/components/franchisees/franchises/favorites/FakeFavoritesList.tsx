import type { Franchise } from '@/src/schemas/franchises/Franchise'
import FavoritesTable from './FavoritesTable'
import FavoritesTableBody from './FavoritesTableBody'
import FavoritesTableHeader from './FavoritesTableHeader'
import FavoritesTableRow from './FavoritesTableRow'

const baseFranchise: Franchise = {
  id: 'base',
  name: 'Base Franchise',
  slug: 'base-franchise',
  headquarterState: 'SP',
  totalUnits: 0,
  segment: '',
  subsegment: '',
  businessType: '',
  brandFoundationYear: 2000,
  franchiseStartYear: 2000,
  abfSince: 2000,
  isActive: true,
  isSponsored: false,
  isReview: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const fakeFranchises: Franchise[] = [
  {
    ...baseFranchise,
    id: 'fake-1',
    name: 'Franquia Exemplo A',
    segment: 'Alimentação',
    subsegment: 'Geral',
    businessType: 'Loja',
    averageRating: 4.8,
    totalUnits: 120,
    unitsEvolution: 'UP',
    minimumInvestment: 150_000,
    isSponsored: true,
    logoUrl: '',
  },
  {
    ...baseFranchise,
    id: 'fake-2',
    name: 'Franquia Exemplo B',
    segment: 'Educação',
    subsegment: 'Geral',
    businessType: 'Loja',
    averageRating: 4.6,
    totalUnits: 80,
    unitsEvolution: 'UP',
    minimumInvestment: 100_000,
    isSponsored: false,
    logoUrl: '',
  },
  {
    ...baseFranchise,
    id: 'fake-3',
    name: 'Franquia Exemplo C',
    segment: 'Saúde e Beleza',
    subsegment: 'Geral',
    businessType: 'Loja',
    averageRating: 4.9,
    totalUnits: 60,
    unitsEvolution: 'UP',
    minimumInvestment: 200_000,
    isSponsored: false,
    logoUrl: '',
  },
]

export default function FakeFavoritesList() {
  return (
    <div className="flex w-auto flex-col filter blur-sm pointer-events-none select-none">
      <h2 className="mb-4 font-medium text-2xl md:text-3xl lg:text-3xl">
        Minhas Franquias Favoritas
      </h2>

      <div className="flex items-center mb-4">
        <div className="relative w-full md:w-[40vw]">
          <div className="h-10 rounded-full bg-gray-200" />
        </div>
      </div>

      <FavoritesTable>
        <FavoritesTableHeader />
        <FavoritesTableBody>
          {fakeFranchises.map((franchise, index) => (
            <FavoritesTableRow
              key={franchise.id}
              position={index + 1}
              franchise={franchise}
              onRowClick={() => {}}
              previousFranchise={
                index > 0 ? fakeFranchises[index - 1] : undefined
              }
              nextFranchise={
                index < fakeFranchises.length - 1
                  ? fakeFranchises[index + 1]
                  : undefined
              }
            />
          ))}
        </FavoritesTableBody>
      </FavoritesTable>
    </div>
  )
}
