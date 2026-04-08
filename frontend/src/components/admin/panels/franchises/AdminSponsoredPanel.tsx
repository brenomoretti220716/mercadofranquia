'use client'

import RoundedButton from '@/src/components/ui/RoundedButton'
import SearchBar from '@/src/components/ui/SearchBar'
import { useAdminRankingPaginated } from '@/src/hooks/franchises/useRanking'
import { franchiseKeys } from '@/src/queries/franchises'
import type { SponsorPlacement } from '@/src/schemas/franchises/Franchise'
import { updateSponsorPlacements } from '@/src/services/franchises'
import { getClientAuthCookie } from '@/src/utils/clientCookie'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const PLACEMENT_OPTIONS: Array<{ value: SponsorPlacement; label: string }> = [
  { value: 'HOME_DESTAQUES', label: 'Destaques Home' },
  { value: 'RANKING_CATEGORIA', label: 'Ranking por Categoria' },
  { value: 'QUIZ', label: 'Quiz' },
]

export default function AdminSponsoredPanel() {
  const token = getClientAuthCookie() || ''
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const limit = 200
  const [savingByFranchiseId, setSavingByFranchiseId] = useState<
    Record<string, boolean>
  >({})
  const [draftPlacements, setDraftPlacements] = useState<
    Record<string, SponsorPlacement[]>
  >({})

  const { franchises } = useAdminRankingPaginated({
    token,
    limit,
    search: searchTerm,
    isSponsored: true,
  })

  const sponsoredFranchises = useMemo(
    () => franchises.filter((franchise) => franchise.isSponsored),
    [franchises],
  )

  const resolvedPlacements = useMemo(() => {
    return sponsoredFranchises.reduce<Record<string, SponsorPlacement[]>>(
      (acc, franchise) => {
        acc[franchise.id] =
          draftPlacements[franchise.id] ?? franchise.sponsorPlacements ?? []
        return acc
      },
      {},
    )
  }, [draftPlacements, sponsoredFranchises])

  const { mutate: savePlacements } = useMutation({
    mutationFn: ({
      franchiseId,
      placements,
    }: {
      franchiseId: string
      placements: SponsorPlacement[]
    }) => updateSponsorPlacements(franchiseId, placements),
    onMutate: ({ franchiseId }) => {
      setSavingByFranchiseId((prev) => ({
        ...prev,
        [franchiseId]: true,
      }))
    },
    onSuccess: () => {
      toast.success('Posicionamentos atualizados com sucesso.')
      queryClient.invalidateQueries({ queryKey: franchiseKeys.all })
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar posicionamentos', {
        description: error.message,
      })
    },
    onSettled: (_data, _error, variables) => {
      setSavingByFranchiseId((prev) => ({
        ...prev,
        [variables.franchiseId]: false,
      }))
    },
  })

  const handlePlacementToggle = (
    franchiseId: string,
    placement: SponsorPlacement,
    checked: boolean,
  ) => {
    const currentPlacements = resolvedPlacements[franchiseId] ?? []
    const nextPlacements = checked
      ? [...new Set([...currentPlacements, placement])]
      : currentPlacements.filter((item) => item !== placement)

    setDraftPlacements((prev) => ({
      ...prev,
      [franchiseId]: nextPlacements,
    }))
  }

  return (
    <div className="m-5 md:m-10 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/franquias"
            className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Voltar para Franquias
          </Link>
          <h2 className="text-2xl font-medium">Painel de Patrocinados</h2>
        </div>
        <div className="text-sm text-muted-foreground tabular-nums">
          {sponsoredFranchises.length} patrocinados encontrados
        </div>
      </div>

      <div className="rounded-xl border border-[#E25E3E]/30 bg-[#E25E3E]/10 p-4 text-sm text-[#5F2A1D]">
        Primeiro marque as franquias como patrocinadas no painel de franquias.
        Depois, volte aqui para escolher onde cada uma aparece (Home, Ranking e
        Quiz).
      </div>

      <div className="w-full md:w-[40vw]">
        <SearchBar
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          setSearchTerm={setSearchTerm}
          setPage={() => {}}
          placeholder="Buscar patrocinado..."
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(260px,1.2fr)_auto] gap-4 px-4 py-3 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Franquia</span>
          <span>Posicionamentos</span>
        </div>
        {sponsoredFranchises.map((franchise) => (
          <div
            key={franchise.id}
            className="grid grid-cols-1 md:grid-cols-[minmax(260px,1.2fr)_auto] gap-3 md:gap-4 px-4 py-3 border-b border-border last:border-b-0 items-center"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-md border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                {franchise.logoUrl ? (
                  <Image
                    src={franchise.logoUrl}
                    alt={franchise.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                ) : (
                  <span>🏢</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {franchise.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(3,minmax(170px,1fr))_auto] gap-2 items-center md:justify-items-stretch">
              {PLACEMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs whitespace-nowrap h-8"
                >
                  <input
                    type="checkbox"
                    checked={(resolvedPlacements[franchise.id] ?? []).includes(
                      option.value,
                    )}
                    onChange={(event) =>
                      handlePlacementToggle(
                        franchise.id,
                        option.value,
                        event.target.checked,
                      )
                    }
                  />
                  {option.label}
                </label>
              ))}
              <div className="md:justify-self-end">
                <RoundedButton
                  color="#E25E3E"
                  hoverColor="#000000"
                  text={
                    savingByFranchiseId[franchise.id] ? 'Salvando...' : 'Salvar'
                  }
                  textColor="white"
                  onClick={() =>
                    savePlacements({
                      franchiseId: franchise.id,
                      placements: resolvedPlacements[franchise.id] ?? [],
                    })
                  }
                  disabled={Boolean(savingByFranchiseId[franchise.id])}
                />
              </div>
            </div>
          </div>
        ))}

        {sponsoredFranchises.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma franquia patrocinada encontrada.
          </div>
        )}
      </div>
    </div>
  )
}
