'use client'

import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import { useFormContext } from 'react-hook-form'
import FormSelect from '../../ui/FormSelect'
import RoundedButton from '../../ui/RoundedButton'
import ScaleInput from '../../ui/ScaleInput'

const STAGE_OPTIONS = [
  { value: 'Pesquisa inicial', label: 'Pesquisa inicial' },
  { value: 'Avaliando marcas', label: 'Avaliando marcas' },
  {
    value: 'Conversando com franqueadoras',
    label: 'Conversando com franqueadoras',
  },
  { value: 'Decisão avançada', label: 'Decisão avançada' },
]

interface StepMomentoProps {
  onNext: () => void
  onBack?: () => void
}

export default function StepMomento({ onNext }: StepMomentoProps) {
  const { register, watch, setValue, formState, trigger } =
    useFormContext<QuizFormValues>()

  const handleNext = async () => {
    const valid = await trigger(['q1Stage', 'q2DecisionLevel'])
    if (valid) onNext()
  }

  return (
    <form
      className="space-y-4 sm:space-y-6 w-full px-2 sm:px-0.5"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      <FormSelect
        label="1. Em qual estágio você está na sua jornada para abrir uma franquia?"
        id="q1Stage"
        options={STAGE_OPTIONS}
        placeholder="Selecione"
        register={register('q1Stage')}
        value={watch('q1Stage')}
        error={formState.errors.q1Stage?.message}
      />
      <ScaleInput
        label="2. De 0 a 10, qual seu nível de decisão para inaugurar nos próximos 6 meses?"
        min={0}
        max={10}
        register={register('q2DecisionLevel')}
        value={watch('q2DecisionLevel')}
        onChange={(v) => setValue('q2DecisionLevel', v)}
        error={formState.errors.q2DecisionLevel?.message}
      />

      <div className="grid w-full mt-4 sm:mt-6">
        <RoundedButton
          type="button"
          color="hsl(240 24% 12%)"
          hoverColor="hsl(10 79% 57%)"
          text="Continuar"
          textColor="white"
          hoverTextColor="white"
          onClick={handleNext}
        />
      </div>
    </form>
  )
}
