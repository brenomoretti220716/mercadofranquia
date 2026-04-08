'use client'

import { useFormContext } from 'react-hook-form'
import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import FormSelect from '../../ui/FormSelect'
import QuizBackButton from '../QuizBackButton'
import RoundedButton from '../../ui/RoundedButton'

const OPTIONS = {
  q7: [
    { value: 'Nunca liderei equipe', label: 'Nunca liderei equipe' },
    { value: 'Até 5 pessoas', label: 'Até 5 pessoas' },
    { value: '6 a 15 pessoas', label: '6 a 15 pessoas' },
    { value: 'Mais de 15 pessoas', label: 'Mais de 15 pessoas' },
  ],
  q8: [
    { value: 'Nenhuma', label: 'Nenhuma' },
    { value: 'Já atuei sob metas', label: 'Já atuei sob metas' },
    { value: 'Já liderei metas', label: 'Já liderei metas' },
  ],
  q9: [
    { value: '1–3 colaboradores', label: '1–3 colaboradores' },
    { value: '4–10 colaboradores', label: '4–10 colaboradores' },
    { value: '10+ colaboradores', label: '10+ colaboradores' },
  ],
  q10: [
    { value: 'Prefiro autonomia total', label: 'Prefiro autonomia total' },
    { value: 'Aceito com flexibilidade', label: 'Aceito com flexibilidade' },
    {
      value: 'Não tenho problema com padrão rigoroso',
      label: 'Não tenho problema com padrão rigoroso',
    },
  ],
  q11: [
    { value: 'Sim, totalmente', label: 'Sim, totalmente' },
    { value: 'Sim, se for essencial', label: 'Sim, se for essencial' },
    {
      value: 'Prefiro aprender na prática',
      label: 'Prefiro aprender na prática',
    },
  ],
  q12: [
    { value: 'Evito risco', label: 'Evito risco' },
    {
      value: 'Mantenho controle, mas fico desconfortável',
      label: 'Mantenho controle, mas fico desconfortável',
    },
    {
      value: 'Tomo decisões com calma e estratégia',
      label: 'Tomo decisões com calma e estratégia',
    },
  ],
}

interface StepOperacionalProps {
  onNext: () => void
  onBack: () => void
}

export default function StepOperacional({
  onNext,
  onBack,
}: StepOperacionalProps) {
  const { register, watch, formState, trigger } =
    useFormContext<QuizFormValues>()

  const handleNext = async () => {
    const valid = await trigger([
      'q7LeadershipExperience',
      'q8SalesGoalsExperience',
      'q9TeamSizeComfort',
      'q10StandardizationComfort',
      'q11TrainingWillingness',
      'q12PressureReaction',
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
        label="7. Experiência em liderança."
        id="q7LeadershipExperience"
        options={OPTIONS.q7}
        placeholder="Selecione"
        register={register('q7LeadershipExperience')}
        value={watch('q7LeadershipExperience')}
        error={formState.errors.q7LeadershipExperience?.message}
      />
      <FormSelect
        label="8. Experiência com metas comerciais."
        id="q8SalesGoalsExperience"
        options={OPTIONS.q8}
        placeholder="Selecione"
        register={register('q8SalesGoalsExperience')}
        value={watch('q8SalesGoalsExperience')}
        error={formState.errors.q8SalesGoalsExperience?.message}
      />
      <FormSelect
        label="9. Estrutura que se sente confortável em gerir."
        id="q9TeamSizeComfort"
        options={OPTIONS.q9}
        placeholder="Selecione"
        register={register('q9TeamSizeComfort')}
        value={watch('q9TeamSizeComfort')}
        error={formState.errors.q9TeamSizeComfort?.message}
      />
      <FormSelect
        label="10. Você se sente confortável em seguir padrões da franqueadora?"
        id="q10StandardizationComfort"
        options={OPTIONS.q10}
        placeholder="Selecione"
        register={register('q10StandardizationComfort')}
        value={watch('q10StandardizationComfort')}
        error={formState.errors.q10StandardizationComfort?.message}
      />
      <FormSelect
        label="11. Você está disposto a participar ativamente dos treinamentos da rede?"
        id="q11TrainingWillingness"
        options={OPTIONS.q11}
        placeholder="Selecione"
        register={register('q11TrainingWillingness')}
        value={watch('q11TrainingWillingness')}
        error={formState.errors.q11TrainingWillingness?.message}
      />
      <FormSelect
        label="12. Como você reage sob pressão financeira ou operacional?"
        id="q12PressureReaction"
        options={OPTIONS.q12}
        placeholder="Selecione"
        register={register('q12PressureReaction')}
        value={watch('q12PressureReaction')}
        error={formState.errors.q12PressureReaction?.message}
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
