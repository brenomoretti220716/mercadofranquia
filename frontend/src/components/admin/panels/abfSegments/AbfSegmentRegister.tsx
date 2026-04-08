'use client'

import RoundedButton from '@/src/components/ui/RoundedButton'
import FormInput from '@/src/components/ui/FormInput'
import FilterMenuSelectWithSearch from '@/src/components/ui/FilterMenu/FilterMenuSelectWithSearch'
import { useCreateAbfSegment } from '@/src/hooks/abfSegments/useAbfSegmentsMutations'
import AbfForecastNotice from '@/src/components/mercado/AbfForecastNotice'
import {
  CreateAbfSegmentSchema,
  type CreateAbfSegmentType,
} from '@/src/schemas/abfSegments'
import { isAbfYearQuarterForecast } from '@/src/utils/abfQuarterForecast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface AbfSegmentRegisterProps {
  defaultYear: number
  defaultQuarter: string
  onClose?: () => void
  onSuccess?: () => void
}

const STANDARD_SEGMENTS = [
  { acronym: 'ACD', segment: 'Alimentação - Comercialização e Distribuição' },
  { acronym: 'AFS', segment: 'Alimentação - Food Service' },
  { acronym: 'CC', segment: 'Casa e Construção' },
  { acronym: 'CIE', segment: 'Comunicação, Informática e Eletrônicos' },
  { acronym: 'EDU', segment: 'Educação' },
  { acronym: 'EL', segment: 'Entretenimento e Lazer' },
  { acronym: 'HT', segment: 'Hotelaria e Turismo' },
  { acronym: 'LC', segment: 'Limpeza e Conservação' },
  { acronym: 'MOD', segment: 'Moda' },
  { acronym: 'SBBE', segment: 'Saúde, Beleza e Bem Estar' },
  { acronym: 'SA', segment: 'Serviços Automotivos' },
  { acronym: 'SON', segment: 'Serviços e Outros Negócios' },
] as const

export default function AbfSegmentRegister({
  defaultYear,
  defaultQuarter,
  onClose,
  onSuccess,
}: AbfSegmentRegisterProps) {
  const createMutation = useCreateAbfSegment()
  const [isManualMode, setIsManualMode] = useState(false)
  const [selectedStandardKey, setSelectedStandardKey] = useState<string | null>(
    `${STANDARD_SEGMENTS[0].acronym}__${STANDARD_SEGMENTS[0].segment}`,
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateAbfSegmentType>({
    resolver: zodResolver(CreateAbfSegmentSchema),
    mode: 'onChange',
    defaultValues: {
      year: defaultYear,
      quarter: defaultQuarter,
      segment: STANDARD_SEGMENTS[0].segment,
      acronym: STANDARD_SEGMENTS[0].acronym,
      value: 0,
    },
  })

  async function handleCreate(data: CreateAbfSegmentType) {
    const payload = { ...data }

    if (!isManualMode) {
      const selected = STANDARD_SEGMENTS.find(
        (item) => `${item.acronym}__${item.segment}` === selectedStandardKey,
      )

      if (!selected) {
        return
      }

      payload.segment = selected.segment
      payload.acronym = selected.acronym
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        reset()
        onSuccess?.()
        onClose?.()
      },
    })
  }

  return (
    <form
      className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 rounded-md w-full"
      onSubmit={handleSubmit(handleCreate)}
      noValidate
    >
      {/* Hidden fields required by schema */}
      <input type="hidden" {...register('year')} />
      <input type="hidden" {...register('quarter')} />
      {!isManualMode && <input type="hidden" {...register('segment')} />}
      {!isManualMode && <input type="hidden" {...register('acronym')} />}

      {isAbfYearQuarterForecast(defaultYear, defaultQuarter) ? (
        <AbfForecastNotice variant="compact" />
      ) : null}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isManualMode}
          onChange={(e) => setIsManualMode(e.target.checked)}
        />
        Preenchimento manual (informar segmento e sigla livremente)
      </label>

      {!isManualMode && (
        <div>
          <FilterMenuSelectWithSearch
            label="Segmento padrão"
            value={selectedStandardKey}
            placeholder="Selecione um segmento padrão"
            searchPlaceholder="Buscar segmento/sigla..."
            options={STANDARD_SEGMENTS.map((item) => ({
              value: `${item.acronym}__${item.segment}`,
              label: `${item.acronym} - ${item.segment}`,
            }))}
            onChange={(value) => {
              setSelectedStandardKey(value)
              const selected = STANDARD_SEGMENTS.find(
                (item) => `${item.acronym}__${item.segment}` === value,
              )
              if (!selected) return
              setValue('segment', selected.segment, { shouldValidate: true })
              setValue('acronym', selected.acronym, { shouldValidate: true })
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Modo padrão: selecione um segmento existente e informe somente o
            valor.
          </p>
        </div>
      )}

      {isManualMode && (
        <FormInput
          label="Segmento"
          id="segment"
          type="text"
          placeholder="Ex: Saúde, Beleza e Bem Estar"
          error={errors.segment?.message}
          register={register('segment')}
          disabled={createMutation.isPending}
        />
      )}

      {isManualMode && (
        <FormInput
          label="Sigla"
          id="acronym"
          type="text"
          placeholder="Ex: SBBE"
          error={errors.acronym?.message}
          register={register('acronym')}
          disabled={createMutation.isPending}
        />
      )}

      <FormInput
        label="Valor (R$ MM)"
        id="value"
        type="number"
        placeholder="Ex: 15705"
        error={errors.value?.message}
        register={register('value')}
        disabled={createMutation.isPending}
      />

      <div className="grid w-full mt-8">
        <RoundedButton
          color="#000000"
          hoverColor="#E25E3E"
          text={createMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
          textColor="white"
          disabled={createMutation.isPending}
        />
      </div>

      <div className="flex justify-center text-sm">
        <a
          onClick={onClose}
          className="text-[#E25E3E] underline ml-1 hover:text-[#E20E3E] cursor-pointer"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
