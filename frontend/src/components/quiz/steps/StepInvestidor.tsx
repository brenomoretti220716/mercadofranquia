'use client'

import { useFormContext } from 'react-hook-form'
import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import FormSelect from '../../ui/FormSelect'
import RankingInput from '../../ui/RankingInput'
import QuizBackButton from '../QuizBackButton'
import RoundedButton from '../../ui/RoundedButton'

const INVESTOR_OPTIONS = [
  { value: 'Conservador', label: 'Conservador' },
  { value: 'Moderado', label: 'Moderado' },
  { value: 'Agressivo', label: 'Agressivo' },
]

const MATURATION_OPTIONS = [
  { value: 'Considera inviável', label: 'Considera inviável' },
  {
    value: 'Avaliaria conforme projeção',
    label: 'Avaliaria conforme projeção',
  },
  { value: 'Está preparado', label: 'Está preparado' },
]

const UNDERPERFORMANCE_OPTIONS = [
  { value: 'Ajustaria expectativa', label: 'Ajustaria expectativa' },
  { value: 'Buscaria outro modelo', label: 'Buscaria outro modelo' },
  {
    value: 'Só investiria se atingir a meta',
    label: 'Só investiria se atingir a meta',
  },
]

const PRIORITIES = [
  'Rentabilidade',
  'Segurança',
  'Marca',
  'Escalabilidade',
  'Simplicidade operacional',
] as const

interface StepInvestidorProps {
  onNext: () => void
  onBack: () => void
}

export default function StepInvestidor({
  onNext,
  onBack,
}: StepInvestidorProps) {
  const { register, watch, setValue, formState, trigger } =
    useFormContext<QuizFormValues>()

  const handleNext = async () => {
    const valid = await trigger([
      'q16InvestorProfile',
      'q17PrioritiesRanking',
      'q18MaturationTolerance',
      'q19UnderperformanceReaction',
    ])
    if (valid) onNext()
  }

  const ranking = watch('q17PrioritiesRanking') ?? [...PRIORITIES]

  return (
    <form
      className="space-y-4 sm:space-y-6 w-full px-2 sm:px-0.5"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      <FormSelect
        label="16. Como você define seu perfil de investidor?"
        id="q16InvestorProfile"
        options={INVESTOR_OPTIONS}
        placeholder="Selecione"
        register={register('q16InvestorProfile')}
        value={watch('q16InvestorProfile')}
        error={formState.errors.q16InvestorProfile?.message}
      />
      <RankingInput
        label="17. Ordene o que é mais importante para você."
        options={PRIORITIES}
        value={ranking}
        onChange={(v) => setValue('q17PrioritiesRanking', v)}
        error={formState.errors.q17PrioritiesRanking?.message}
      />
      <FormSelect
        label="18. Se o negócio exigir cerca de 18 meses para maturação, você:"
        id="q18MaturationTolerance"
        options={MATURATION_OPTIONS}
        placeholder="Selecione"
        register={register('q18MaturationTolerance')}
        value={watch('q18MaturationTolerance')}
        error={formState.errors.q18MaturationTolerance?.message}
      />
      <FormSelect
        label="19. Se o retorno for menor que o esperado inicialmente, você:"
        id="q19UnderperformanceReaction"
        options={UNDERPERFORMANCE_OPTIONS}
        placeholder="Selecione"
        register={register('q19UnderperformanceReaction')}
        value={watch('q19UnderperformanceReaction')}
        error={formState.errors.q19UnderperformanceReaction?.message}
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
