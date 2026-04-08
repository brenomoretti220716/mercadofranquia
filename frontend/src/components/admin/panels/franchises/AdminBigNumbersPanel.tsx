'use client'

import RoundedButton from '@/src/components/ui/RoundedButton'
import { useAdminRankingBigNumbers } from '@/src/hooks/ranking/useRankingBigNumbers'
import { rankingBigNumbersKeys } from '@/src/queries/rankingBigNumbers'
import type { RankingBigNumber } from '@/src/schemas/ranking/RankingBigNumber'
import {
  bulkCreateRankingBigNumbers,
  setRankingBigNumbersYearVisibility,
  updateRankingBigNumber,
} from '@/src/services/franchises'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

type EditableCard = {
  id: string
  name: string
  position: number
  growthPercentage: string
}

export default function AdminBigNumbersPanel() {
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const { cards } = useAdminRankingBigNumbers(year)
  const [draftById, setDraftById] = useState<Record<string, EditableCard>>({})
  const [savingById, setSavingById] = useState<Record<string, boolean>>({})
  const [bulkCards, setBulkCards] = useState<
    Record<number, { name: string; growthPercentage: string }>
  >({
    1: { name: '', growthPercentage: '' },
    2: { name: '', growthPercentage: '' },
    3: { name: '', growthPercentage: '' },
    4: { name: '', growthPercentage: '' },
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: rankingBigNumbersKeys.all })
    setDraftById({})
  }

  const { mutate: saveCard } = useMutation({
    mutationFn: async (card: EditableCard) => {
      const growth = Number(card.growthPercentage.replace(',', '.'))
      if (Number.isNaN(growth)) {
        throw new Error('Percentual inválido.')
      }
      return await updateRankingBigNumber(card.id, {
        name: card.name,
        growthPercentage: growth,
        position: card.position,
      })
    },
    onMutate: (card) => {
      setSavingById((prev) => ({ ...prev, [card.id]: true }))
    },
    onSuccess: async () => {
      await invalidate()
      toast.success('Card atualizado com sucesso.')
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar card', { description: error.message })
    },
    onSettled: (_data, _error, variables) => {
      setSavingById((prev) => ({ ...prev, [variables.id]: false }))
    },
  })

  const { mutate: createYear, isPending: isCreatingYear } = useMutation({
    mutationFn: async () => {
      const cardsPayload = [1, 2, 3, 4].map((position) => {
        const entry = bulkCards[position]
        const growth = Number(entry.growthPercentage.replace(',', '.'))
        if (Number.isNaN(growth)) {
          throw new Error(`Percentual inválido na posição ${position}.`)
        }
        if (!entry.name.trim()) {
          throw new Error(`Nome obrigatório na posição ${position}.`)
        }
        return {
          position,
          name: entry.name.trim(),
          growthPercentage: growth,
        }
      })

      return await bulkCreateRankingBigNumbers({
        year,
        cards: cardsPayload,
      })
    },
    onSuccess: async () => {
      await invalidate()
      toast.success('Ano criado com os 4 cards.')
      setBulkCards({
        1: { name: '', growthPercentage: '' },
        2: { name: '', growthPercentage: '' },
        3: { name: '', growthPercentage: '' },
        4: { name: '', growthPercentage: '' },
      })
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar ano', { description: error.message })
    },
  })

  const { mutate: toggleYearVisibility, isPending: isTogglingVisibility } =
    useMutation({
      mutationFn: async (isHidden: boolean) =>
        setRankingBigNumbersYearVisibility({ year, isHidden }),
      onSuccess: async (_data, isHidden) => {
        await invalidate()
        toast.success(
          isHidden ? 'Ano ocultado com sucesso.' : 'Ano exibido novamente.',
        )
      },
      onError: (error: Error) => {
        toast.error('Erro ao atualizar visibilidade', {
          description: error.message,
        })
      },
    })

  const resolveDraft = (card: RankingBigNumber): EditableCard => {
    return (
      draftById[card.id] ?? {
        id: card.id,
        name: card.name,
        position: card.position,
        growthPercentage: String(card.growthPercentage),
      }
    )
  }

  const updateDraft = (
    card: RankingBigNumber,
    field: keyof Omit<EditableCard, 'id'>,
    value: string | number,
  ) => {
    const draft = resolveDraft(card)
    setDraftById((prev) => ({
      ...prev,
      [card.id]: {
        ...draft,
        [field]: value,
      },
    }))
  }

  const sortedCards = cards.slice().sort((a, b) => a.position - b.position)
  const hasCards = sortedCards.length > 0
  const isYearHidden = hasCards
    ? sortedCards.every((card) => card.isHidden)
    : false

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
          <h2 className="text-2xl font-medium">BigNumbers do Ranking</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ano</span>
          <input
            type="number"
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value))
              setDraftById({})
            }}
            className="h-9 w-28 rounded-md border border-border px-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#E25E3E]/30 bg-[#E25E3E]/10 p-4 text-sm text-[#E25E3E]">
        {hasCards
          ? 'Edite os cards em lista e salve por linha.'
          : 'Cadastre os 4 cards para criar o ano (1º, 2º, 3º e pior).'}
      </div>

      {hasCards && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Visibilidade pública do ano {year}
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isYearHidden}
              disabled={isTogglingVisibility}
              onChange={(event) => toggleYearVisibility(event.target.checked)}
            />
            Ocultar
          </label>
        </div>
      )}

      {hasCards ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(240px,1fr)_120px_140px_auto] gap-3 px-4 py-3 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Segmento</span>
            <span>Posição</span>
            <span>Crescimento (%)</span>
            <span>Ação</span>
          </div>
          {sortedCards.map((card) => {
            const draft = resolveDraft(card)
            return (
              <div
                key={card.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(240px,1fr)_120px_140px_auto] gap-3 px-4 py-3 border-b border-border last:border-b-0 items-center bg-[#FFF4EE]"
              >
                <input
                  value={draft.name}
                  onChange={(event) =>
                    updateDraft(card, 'name', event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-border px-3 text-sm bg-background"
                  placeholder="Nome do segmento"
                />
                <select
                  value={draft.position}
                  onChange={(event) =>
                    updateDraft(card, 'position', Number(event.target.value))
                  }
                  className="h-10 w-full rounded-md border border-border px-2 text-sm bg-background"
                >
                  <option value={1}>1º</option>
                  <option value={2}>2º</option>
                  <option value={3}>3º</option>
                  <option value={4}>Pior</option>
                </select>
                <input
                  value={draft.growthPercentage}
                  onChange={(event) =>
                    updateDraft(card, 'growthPercentage', event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-border px-3 text-sm bg-background"
                  placeholder="14.8"
                />
                <div>
                  <RoundedButton
                    color="#E25E3E"
                    hoverColor="#000000"
                    text={savingById[card.id] ? 'Salvando...' : 'Salvar'}
                    textColor="white"
                    disabled={Boolean(savingById[card.id])}
                    onClick={() => saveCard(draft)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Criar ano {year} com 4 cards
          </h3>
          {[1, 2, 3, 4].map((position) => (
            <div
              key={position}
              className="grid grid-cols-1 md:grid-cols-[120px_minmax(240px,1fr)_140px] gap-3 items-center"
            >
              <div className="text-sm font-medium text-muted-foreground">
                {position === 4 ? 'Pior' : `${position}º lugar`}
              </div>
              <input
                value={bulkCards[position]?.name ?? ''}
                onChange={(event) =>
                  setBulkCards((prev) => ({
                    ...prev,
                    [position]: {
                      ...prev[position],
                      name: event.target.value,
                    },
                  }))
                }
                className="h-10 w-full rounded-md border border-border px-3 text-sm"
                placeholder="Nome do segmento"
              />
              <input
                value={bulkCards[position]?.growthPercentage ?? ''}
                onChange={(event) =>
                  setBulkCards((prev) => ({
                    ...prev,
                    [position]: {
                      ...prev[position],
                      growthPercentage: event.target.value,
                    },
                  }))
                }
                className="h-10 w-full rounded-md border border-border px-3 text-sm"
                placeholder="14.8"
              />
            </div>
          ))}
          <div className="pt-2">
            <RoundedButton
              color="#000000"
              hoverColor="#E25E3E"
              text={isCreatingYear ? 'Salvando ano...' : 'Salvar ano (4 cards)'}
              textColor="white"
              disabled={isCreatingYear}
              onClick={() => createYear()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
