'use client'

import { useFormContext } from 'react-hook-form'
import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import FormSelect from '../../ui/FormSelect'
import QuizBackButton from '../QuizBackButton'
import RoundedButton from '../../ui/RoundedButton'

const CAPITAL_OPTIONS = [
  { value: 'Até R$ 150 mil', label: 'Até R$ 150 mil' },
  { value: 'R$ 150 mil a R$ 300 mil', label: 'R$ 150 mil a R$ 300 mil' },
  { value: 'R$ 300 mil a R$ 600 mil', label: 'R$ 300 mil a R$ 600 mil' },
  { value: 'R$ 600 mil a R$ 1 milhão', label: 'R$ 600 mil a R$ 1 milhão' },
  { value: 'Acima de R$ 1 milhão', label: 'Acima de R$ 1 milhão' },
]

const RESERVE_OPTIONS = [
  { value: 'Menos de 3 meses', label: 'Menos de 3 meses' },
  { value: '3 a 6 meses', label: '3 a 6 meses' },
  { value: '6 a 12 meses', label: '6 a 12 meses' },
  { value: 'Acima de 12 meses', label: 'Acima de 12 meses' },
]

const FINANCING_OPTIONS = [
  { value: '0%', label: '0%' },
  { value: 'Até 30%', label: 'Até 30%' },
  { value: '30% a 60%', label: '30% a 60%' },
  { value: 'Acima de 60%', label: 'Acima de 60%' },
]

const WITHDRAWAL_OPTIONS = [
  { value: 'Até R$ 5 mil', label: 'Até R$ 5 mil' },
  { value: 'R$ 5 mil a R$ 10 mil', label: 'R$ 5 mil a R$ 10 mil' },
  { value: 'R$ 10 mil a R$ 20 mil', label: 'R$ 10 mil a R$ 20 mil' },
  { value: 'R$ 20 mil a R$ 40 mil', label: 'R$ 20 mil a R$ 40 mil' },
  { value: 'Acima de R$ 40 mil', label: 'Acima de R$ 40 mil' },
]

const PAYBACK_OPTIONS = [
  { value: 'Até 12 meses', label: 'Até 12 meses' },
  { value: '12 a 24 meses', label: '12 a 24 meses' },
  { value: '24 a 36 meses', label: '24 a 36 meses' },
  { value: 'Acima de 36 meses', label: 'Acima de 36 meses' },
]

const INCOME_OPTIONS = [
  { value: 'Sim, imediatamente', label: 'Sim, imediatamente' },
  { value: 'Em até 6 meses', label: 'Em até 6 meses' },
  { value: 'Em até 12 meses', label: 'Em até 12 meses' },
  { value: 'Não tenho essa pressão', label: 'Não tenho essa pressão' },
]

interface StepFinanceiroProps {
  onNext: () => void
  onBack: () => void
}

export default function StepFinanceiro({
  onNext,
  onBack,
}: StepFinanceiroProps) {
  const { register, watch, formState, trigger } =
    useFormContext<QuizFormValues>()

  const handleNext = async () => {
    const valid = await trigger([
      'q20AvailableCapital',
      'q21FinancialReserve',
      'q22FinancingPercentage',
      'q23DesiredMonthlyWithdrawal',
      'q24ExpectedPayback',
      'q25DependsOnFranchiseIncome',
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
        label="20. Capital disponível para investimento."
        id="q20AvailableCapital"
        options={CAPITAL_OPTIONS}
        placeholder="Selecione"
        register={register('q20AvailableCapital')}
        value={watch('q20AvailableCapital')}
        error={formState.errors.q20AvailableCapital?.message}
      />
      <FormSelect
        label="21. Reserva financeira após investir."
        id="q21FinancialReserve"
        options={RESERVE_OPTIONS}
        placeholder="Selecione"
        register={register('q21FinancialReserve')}
        value={watch('q21FinancialReserve')}
        error={formState.errors.q21FinancialReserve?.message}
      />
      <FormSelect
        label="22. Percentual do investimento que será financiado."
        id="q22FinancingPercentage"
        options={FINANCING_OPTIONS}
        placeholder="Selecione"
        register={register('q22FinancingPercentage')}
        value={watch('q22FinancingPercentage')}
        error={formState.errors.q22FinancingPercentage?.message}
      />
      <FormSelect
        label="23. Retirada mensal líquida desejada."
        id="q23DesiredMonthlyWithdrawal"
        options={WITHDRAWAL_OPTIONS}
        placeholder="Selecione"
        register={register('q23DesiredMonthlyWithdrawal')}
        value={watch('q23DesiredMonthlyWithdrawal')}
        error={formState.errors.q23DesiredMonthlyWithdrawal?.message}
      />
      <FormSelect
        label="24. Prazo esperado de retorno (payback)."
        id="q24ExpectedPayback"
        options={PAYBACK_OPTIONS}
        placeholder="Selecione"
        register={register('q24ExpectedPayback')}
        value={watch('q24ExpectedPayback')}
        error={formState.errors.q24ExpectedPayback?.message}
      />
      <FormSelect
        label="25. Você depende da franquia para substituir sua renda atual?"
        id="q25DependsOnFranchiseIncome"
        options={INCOME_OPTIONS}
        placeholder="Selecione"
        register={register('q25DependsOnFranchiseIncome')}
        value={watch('q25DependsOnFranchiseIncome')}
        error={formState.errors.q25DependsOnFranchiseIncome?.message}
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
