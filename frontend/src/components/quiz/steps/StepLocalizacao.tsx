'use client'

import { useFormContext } from 'react-hook-form'
import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import { BRAZILIAN_STATES } from '@/src/data/brazilian-states'
import FormSelect from '../../ui/FormSelect'
import CitySelect from '../../ui/CitySelect'
import QuizBackButton from '../QuizBackButton'
import RoundedButton from '../../ui/RoundedButton'

const STATE_OPTIONS = BRAZILIAN_STATES.map((s) => ({
  value: s.value,
  label: s.label,
}))

const COMMERCIAL_POINT_OPTIONS = [
  { value: 'Sim', label: 'Sim' },
  { value: 'Estou avaliando locais', label: 'Estou avaliando locais' },
  { value: 'Ainda não comecei', label: 'Ainda não comecei' },
]

const FLEXIBILITY_OPTIONS = [
  { value: 'Sim', label: 'Sim' },
  { value: 'Apenas na cidade escolhida', label: 'Apenas na cidade escolhida' },
  {
    value: 'Avaliaria conforme oportunidade',
    label: 'Avaliaria conforme oportunidade',
  },
]

interface StepLocalizacaoProps {
  onNext: () => void
  onBack: () => void
  isSubmitting?: boolean
}

export default function StepLocalizacao({
  onNext,
  onBack,
  isSubmitting = false,
}: StepLocalizacaoProps) {
  const { register, watch, setValue, formState, trigger } =
    useFormContext<QuizFormValues>()

  const handleNext = async () => {
    const valid = await trigger([
      'q26State',
      'q27Cities',
      'q28HasCommercialPoint',
      'q29LocationFlexibility',
    ])
    if (valid) onNext()
  }

  const cities = watch('q27Cities') ?? []

  const addCity = () => {
    setValue('q27Cities', [...cities, ''])
  }

  const removeCity = (index: number) => {
    setValue(
      'q27Cities',
      cities.filter((_, i) => i !== index),
    )
  }

  const updateCity = (index: number, value: string) => {
    const next = [...cities]
    next[index] = value
    setValue('q27Cities', next)
  }

  return (
    <form
      className="space-y-4 sm:space-y-6 w-full px-2 sm:px-0.5"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      <FormSelect
        label="26. Em qual estado pretende investir?"
        id="q26State"
        options={STATE_OPTIONS}
        placeholder="Selecione o estado"
        register={register('q26State')}
        value={watch('q26State')}
        error={formState.errors.q26State?.message}
      />
      <div>
        <label className="mb-1 font-medium block text-sm sm:text-base">
          27. Em quais cidades você tem interesse?
        </label>
        {cities.map((city, index) => (
          <div key={index} className="flex flex-col gap-2 mb-2">
            <CitySelect
              value={city}
              onChange={(value) => updateCity(index, value)}
              placeholder={`Cidade ${index + 1}`}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeCity(index)}
                className="px-3 py-1 text-xs border border-input rounded-md hover:bg-muted"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addCity}
          className="text-sm text-primary underline hover:no-underline"
        >
          + Adicionar cidade
        </button>
        {formState.errors.q27Cities?.message && (
          <div className="text-red-500 text-sm mt-1">
            {formState.errors.q27Cities.message}
          </div>
        )}
      </div>
      <FormSelect
        label="28. Você já possui ponto comercial identificado?"
        id="q28HasCommercialPoint"
        options={COMMERCIAL_POINT_OPTIONS}
        placeholder="Selecione"
        register={register('q28HasCommercialPoint')}
        value={watch('q28HasCommercialPoint')}
        error={formState.errors.q28HasCommercialPoint?.message}
      />
      <FormSelect
        label="29. Está disposto a avaliar cidades próximas ou outras regiões?"
        id="q29LocationFlexibility"
        options={FLEXIBILITY_OPTIONS}
        placeholder="Selecione"
        register={register('q29LocationFlexibility')}
        value={watch('q29LocationFlexibility')}
        error={formState.errors.q29LocationFlexibility?.message}
      />
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
        <QuizBackButton onClick={onBack} />
        <RoundedButton
          type="button"
          color="hsl(240 24% 12%)"
          hoverColor="hsl(10 79% 57%)"
          text={isSubmitting ? 'Enviando...' : 'Ver resultados'}
          textColor="white"
          hoverTextColor="white"
          disabled={isSubmitting}
          onClick={handleNext}
        />
      </div>
    </form>
  )
}
