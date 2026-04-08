'use client'

import RoundedButton from '@/src/components/ui/RoundedButton'
import FormInput from '@/src/components/ui/FormInput'
import {
  useDeleteAbfSegment,
  useUpdateAbfSegment,
} from '@/src/hooks/abfSegments/useAbfSegmentsMutations'
import {
  UpdateAbfSegmentSchema,
  type UpdateAbfSegmentType,
} from '@/src/schemas/abfSegments'
import AbfForecastNotice from '@/src/components/mercado/AbfForecastNotice'
import type { AbfSegmentEntry } from '@/src/services/abfSegments'
import { isAbfYearQuarterForecast } from '@/src/utils/abfQuarterForecast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface AbfSegmentEditingProps {
  entry: AbfSegmentEntry
  onClose?: () => void
  onSuccess?: () => void
}

export default function AbfSegmentEditing({
  entry,
  onClose,
  onSuccess,
}: AbfSegmentEditingProps) {
  const updateMutation = useUpdateAbfSegment()
  const deleteMutation = useDeleteAbfSegment()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateAbfSegmentType>({
    resolver: zodResolver(UpdateAbfSegmentSchema),
    mode: 'onChange',
    defaultValues: {
      id: entry.id,
      segment: entry.segment,
      acronym: entry.acronym,
      value: entry.value,
    },
  })

  async function handleUpdate(data: UpdateAbfSegmentType) {
    updateMutation.mutate(
      { id: entry.id, data },
      {
        onSuccess: () => {
          onSuccess?.()
          onClose?.()
        },
      },
    )
  }

  const handleDelete = () => {
    const ok = window.confirm(
      `Deletar segmento ABF (${entry.acronym} - ${entry.segment})?`,
    )
    if (!ok) return

    deleteMutation.mutate(entry.id, {
      onSuccess: () => {
        onSuccess?.()
        onClose?.()
      },
    })
  }

  return (
    <form
      className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 rounded-md w-full"
      onSubmit={handleSubmit(handleUpdate)}
      noValidate
    >
      {/* id required by schema */}
      <input type="hidden" {...register('id')} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs mb-1">Ano</span>
          <span className="text-sm font-medium">{entry.year}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs mb-1">Trimestre</span>
          <span className="text-sm font-medium">{entry.quarter}</span>
        </div>
      </div>

      {isAbfYearQuarterForecast(entry.year, entry.quarter) ? (
        <AbfForecastNotice variant="compact" />
      ) : null}

      <FormInput
        label="Segmento"
        id="segment"
        type="text"
        placeholder="Ex: Saúde, Beleza e Bem Estar"
        error={errors.segment?.message}
        register={register('segment')}
        disabled={updateMutation.isPending}
      />

      <FormInput
        label="Sigla"
        id="acronym"
        type="text"
        placeholder="Ex: SBBE"
        error={errors.acronym?.message}
        register={register('acronym')}
        disabled={updateMutation.isPending}
      />

      <FormInput
        label="Valor (R$ MM)"
        id="value"
        type="number"
        placeholder="Ex: 15705"
        error={errors.value?.message}
        register={register('value')}
        disabled={updateMutation.isPending}
      />

      <div className="flex flex-col gap-3 mt-8">
        <RoundedButton
          type="submit"
          color="#000000"
          hoverColor="#E25E3E"
          text={updateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
          textColor="white"
          disabled={updateMutation.isPending}
        />

        <RoundedButton
          type="button"
          color="#fff"
          hoverColor="#E25E3E"
          text="Deletar"
          textColor="#E25E3E"
          borderColor="#E25E3E"
          hoverBorderColor="#E25E3E"
          disabled={deleteMutation.isPending || updateMutation.isPending}
          onClick={handleDelete}
        />
      </div>
    </form>
  )
}
