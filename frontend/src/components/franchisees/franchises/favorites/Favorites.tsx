'use client'

import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'

import RankingCard from '@/src/components/ranking/RankingCard'
import ViewModeToggle from '@/src/components/ranking/ViewModeToggle'
import { Pagination } from '@/src/components/ui/Pagination'
import RoundedButton from '@/src/components/ui/RoundedButton'
import SearchBar from '@/src/components/ui/SearchBar'
import { useFavoritesPaginated } from '@/src/hooks/franchises/useFavorites'
import { isMember, useAuth } from '@/src/hooks/users/useAuth'
import { Franchise } from '@/src/schemas/franchises/Franchise'
import FavoritesTable from './FavoritesTable'
import FavoritesTableBody from './FavoritesTableBody'
import FavoritesTableHeader from './FavoritesTableHeader'
import FavoritesTableRow from './FavoritesTableRow'

interface FavoritesProps {
  token: string
}

export default function Favorites({ token }: FavoritesProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  )
  const [searchTerm, setSearchTerm] = useState(searchInput)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ history: 'push' }),
  )
  const limit = 10

  const { franchises, total } = useFavoritesPaginated({
    page,
    limit,
    search: searchTerm,
    sortBy: 'createdAt',
    order: 'desc',
    token,
  })

  const { payload } = useAuth()
  const validateMember = isMember(payload)

  const handleClick = (franchiseSlug: string) => {
    router.push(`/ranking/${franchiseSlug}`)
  }

  return (
    <>
      {validateMember ? (
        <div className="flex flex-col justify-center items-center min-h-[70vh] gap-5">
          <h2 className="text-2xl">
            Você precisa completar seu cadastro para obter acesso aos favoritos!
          </h2>
          <RoundedButton
            text="Completar o cadastro"
            textColor="white"
            color="#E25E3E"
            hoverColor="black"
            href="/"
          />
        </div>
      ) : (
        <div id="favorites-list" className="flex w-auto flex-col">
          <h2 className="mb-4 font-medium text-2xl md:text-3xl lg:text-3xl">
            Minhas Franquias Favoritas
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative w-full md:w-[40vw]">
              <SearchBar
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                setSearchTerm={setSearchTerm}
                setPage={setPage}
              />
            </div>
            {franchises.length > 0 && (
              <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            )}
          </div>

          {franchises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border">
              <p className="text-foreground text-lg font-medium text-center">
                {searchTerm
                  ? 'Nenhuma franquia encontrada com este termo de busca.'
                  : 'Você ainda não tem franquias favoritas.'}
              </p>
              {!searchTerm && (
                <>
                  <p className="text-muted-foreground text-sm mt-2 text-center max-w-md">
                    Acesse o ranking, clique no coração nas franquias que deseja
                    salvar e elas aparecerão aqui.
                  </p>
                  <div className="mt-6">
                    <RoundedButton
                      text="Ver ranking"
                      textColor="white"
                      color="#E25E3E"
                      hoverColor="black"
                      href="/ranking"
                    />
                  </div>
                </>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {franchises.map((franchise: Franchise, index: number) => (
                  <RankingCard
                    key={franchise.id}
                    franchise={franchise}
                    position={index + 1}
                    onClick={handleClick}
                  />
                ))}
              </div>
              {total > limit && (
                <div className="flex mt-8">
                  <Pagination
                    page={page}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                    scrollToId="favorites-list"
                    scrollMarginTop={80}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <FavoritesTable>
                <FavoritesTableHeader />
                <FavoritesTableBody>
                  {franchises.map((franchise: Franchise, index: number) => (
                    <FavoritesTableRow
                      key={franchise.id}
                      franchise={franchise}
                      position={index + 1}
                      onRowClick={handleClick}
                      previousFranchise={
                        index > 0 ? franchises[index - 1] : undefined
                      }
                      nextFranchise={
                        index < franchises.length - 1
                          ? franchises[index + 1]
                          : undefined
                      }
                    />
                  ))}
                </FavoritesTableBody>
              </FavoritesTable>

              {total > limit && (
                <div className="flex mt-8">
                  <Pagination
                    page={page}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                    scrollToId="favorites-list"
                    scrollMarginTop={80}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
