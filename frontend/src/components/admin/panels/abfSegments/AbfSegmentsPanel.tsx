'use client'

import BaseModal from '@/src/components/ui/BaseModal'
import RoundedButton from '@/src/components/ui/RoundedButton'
import FormSelect from '@/src/components/ui/FormSelect'
import FormInput from '@/src/components/ui/FormInput'
import Skeleton from '@/src/components/ui/skeletons/Skeleton'
import { useMemo, useState, useCallback } from 'react'
import { useAbfSegments } from '@/src/hooks/abfSegments/useAbfSegments'
import AbfSegmentRegister from './AbfSegmentRegister'
import AbfSegmentEditing from './AbfSegmentEditing'
import AbfSegmentsTable from './abfSegmentsTable/AbfSegmentsTable'
import AbfSegmentsTableBody from './abfSegmentsTable/AbfSegmentsTableBody'
import AbfSegmentsTableHeader from './abfSegmentsTable/AbfSegmentsTableHeader'
import AbfSegmentsTableRow from './abfSegmentsTable/AbfSegmentsTableRow'
import AbfForecastNotice from '@/src/components/mercado/AbfForecastNotice'
import type { AbfSegmentEntry } from '@/src/services/abfSegments'
import { isAbfYearQuarterForecast } from '@/src/utils/abfQuarterForecast'

const QUARTER_OPTIONS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

const formatValue = (value: number) => {
  return value >= 1000 ? String(value) : String(value)
}

export default function AbfSegmentsPanel() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isEditingModal, setIsEditingModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<AbfSegmentEntry | null>(
    null,
  )

  const [quarter, setQuarter] = useState<(typeof QUARTER_OPTIONS)[number]>('Q4')
  const [year, setYear] = useState<number>(2023)

  const { data: entries = [], isPending, refetch } = useAbfSegments({ quarter })

  const entriesForYear = useMemo(() => {
    return entries.filter((e) => e.year === year)
  }, [entries, year])

  const handleRegisterCloseModal = () => {
    setIsRegisterModalOpen(false)
  }

  const handleEditingCloseModal = () => {
    setIsEditingModal(false)
    setSelectedEntry(null)
  }

  const handleEditingModal = useCallback((entry: AbfSegmentEntry) => {
    setSelectedEntry(entry)
    setIsEditingModal(true)
  }, [])

  const handleOpenRegister = () => setIsRegisterModalOpen(true)

  if (isPending) {
    return (
      <div className="flex m-10 w-auto flex-col">
        <div className="flex flex-row justify-between items-center my-5">
          <div className="w-[40vw]">
            <Skeleton className="h-10 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-10 w-40 rounded" />
        </div>
        <Skeleton className="h-10 rounded-sm bg-[#E25E3E]" />
        <div className="overflow-x-auto mt-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border-b border-gray-200 py-3 px-4"
            >
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex m-10 w-auto flex-col">
      <h2 className="text-2xl font-medium">Painel de Segmentos ABF</h2>

      <div className="flex flex-row justify-between items-center my-5">
        <div className="flex flex-row items-center gap-3">
          <div className="w-32">
            <FormInput
              label="Ano"
              id="year"
              type="number"
              min={1900}
              max={2100}
              value={String(year)}
              onChange={(e) => {
                const next = Number(e.target.value)
                if (!Number.isFinite(next)) return
                if (next < 1900 || next > 2100) return
                setYear(next)
              }}
              paddingVariant="without-icon"
              className="bg-white"
            />
          </div>

          <div className="w-32">
            <FormSelect
              label="Trimestre"
              name="quarter"
              value={quarter}
              options={QUARTER_OPTIONS.map((q) => ({ value: q, label: q }))}
              onChange={(e) =>
                setQuarter(e.target.value as (typeof QUARTER_OPTIONS)[number])
              }
            />
          </div>
        </div>

        <RoundedButton
          color="#000000"
          hoverColor="#E25E3E"
          text="+ Novo segmento"
          textColor="white"
          onClick={handleOpenRegister}
        />
      </div>

      <div className="mt-[-10px] mb-6 space-y-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Ano:</span> selecione o
          ano do relatório ABF que você quer visualizar/alterar (pode cadastrar
          um ano ainda não existente).
        </p>
        <p>
          <span className="font-medium text-foreground">Trimestre:</span>{' '}
          escolha o trimestre do relatório ABF (Q1, Q2, Q3 ou Q4).
        </p>
        {isAbfYearQuarterForecast(year, quarter) ? (
          <AbfForecastNotice variant="compact" />
        ) : null}
      </div>

      <BaseModal
        tittleText="Cadastro de Segmento ABF"
        subtittleText="Após o cadastro, os gráficos serão atualizados automaticamente."
        isOpen={isRegisterModalOpen}
        onClose={handleRegisterCloseModal}
      >
        <AbfSegmentRegister
          defaultYear={year}
          defaultQuarter={quarter}
          onClose={handleRegisterCloseModal}
          onSuccess={() => refetch()}
        />
      </BaseModal>

      <BaseModal
        tittleText="Edição de Segmento ABF"
        subtittleText="Após a edição, os gráficos serão refletidos imediatamente."
        isOpen={isEditingModal}
        onClose={handleEditingCloseModal}
      >
        {selectedEntry && (
          <AbfSegmentEditing
            entry={selectedEntry}
            onClose={handleEditingCloseModal}
            onSuccess={() => refetch()}
          />
        )}
      </BaseModal>

      <AbfSegmentsTableHeader />

      <AbfSegmentsTable>
        <AbfSegmentsTableBody>
          {entriesForYear.length > 0 ? (
            entriesForYear.map((entry) => (
              <AbfSegmentsTableRow
                key={entry.id}
                entry={entry}
                onEditClick={handleEditingModal}
                formatValue={formatValue}
              />
            ))
          ) : (
            <tr className="bg-[#f6f6f9] border-b border-gray-200">
              <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                Nenhum segmento encontrado para {year} / {quarter}
              </td>
            </tr>
          )}
        </AbfSegmentsTableBody>
      </AbfSegmentsTable>
    </div>
  )
}
