'use client'

import { useFormContext } from 'react-hook-form'
import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import FormSelect from '../../ui/FormSelect'
import FormTextarea from '../../ui/FormTextarea'
import QuizBackButton from '../QuizBackButton'
import RoundedButton from '../../ui/RoundedButton'

const INVOLVEMENT_OPTIONS = [
  { value: 'Operação integral', label: 'Operação integral' },
  { value: 'Gestão estratégica', label: 'Gestão estratégica' },
  { value: 'Apenas investidor', label: 'Apenas investidor' },
]

const GROWTH_OPTIONS = [
  { value: 'Operar apenas 1 unidade', label: 'Operar apenas 1 unidade' },
  { value: 'Expandir para 2–3 unidades', label: 'Expandir para 2–3 unidades' },
  {
    value: 'Construir operação regional',
    label: 'Construir operação regional',
  },
]

interface StepVisaoProps {
  onNext: () => void
  onBack: () => void
}

export default function StepVisao({ onNext, onBack }: StepVisaoProps) {
  const { register, watch, formState, trigger } =
    useFormContext<QuizFormValues>()

  const handleNext = async () => {
    const valid = await trigger([
      'q13InvolvementLevel',
      'q14GrowthPlan',
      'q15IdealFranchiseDescription',
    ])
    if (valid) onNext()
  }

  return (
    <form
      className="space-y-4 sm:space-y-6 w-full px-2 sm:px-0.5"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      <FormSelect
        label="13. Qual será seu nível de envolvimento na operação?"
        id="q13InvolvementLevel"
        options={INVOLVEMENT_OPTIONS}
        placeholder="Selecione"
        register={register('q13InvolvementLevel')}
        value={watch('q13InvolvementLevel')}
        error={formState.errors.q13InvolvementLevel?.message}
      />
      <FormSelect
        label="14. Qual é seu plano de crescimento?"
        id="q14GrowthPlan"
        options={GROWTH_OPTIONS}
        placeholder="Selecione"
        register={register('q14GrowthPlan')}
        value={watch('q14GrowthPlan')}
        error={formState.errors.q14GrowthPlan?.message}
      />
      <FormTextarea
        label="15. Descreva rapidamente o tipo de franquia ideal para você."
        placeholder="Descreva em poucas linhas..."
        rows={4}
        register={register('q15IdealFranchiseDescription')}
        error={formState.errors.q15IdealFranchiseDescription?.message}
        maxCharacterCount={5000}
        showCharacterCount
      />
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
        <QuizBackButton onClick={onBack} />
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
