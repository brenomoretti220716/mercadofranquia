'use client'

import {
  QUIZ_SEGMENTS,
  QUIZ_SUBSEGMENTS,
  QuizSegmentKey,
} from '@/src/data/quiz-segments'
import type { QuizFormValues } from '@/src/schemas/quiz/quiz'
import { useFormContext } from 'react-hook-form'
import FormSelect from '../../ui/FormSelect'
import MultiSelect from '../../ui/MultiSelect'
import QuizBackButton from '../QuizBackButton'
import RoundedButton from '../../ui/RoundedButton'

const PREFERRED_MODEL_OPTIONS = [
  { value: 'Home Based', label: 'Home Based' },
  { value: 'Loja', label: 'Loja' },
  { value: 'Quiosque', label: 'Quiosque' },
  { value: 'Outro', label: 'Outro' },
  { value: 'Ainda não definido', label: 'Ainda não definido' },
]

const OPEN_TO_ALL = 'Estou aberto(a) a avaliar todos os segmentos'

interface StepInteressesProps {
  onNext: () => void
  onBack: () => void
}

export default function StepInteresses({
  onNext,
  onBack,
}: StepInteressesProps) {
  const { register, watch, setValue, formState, trigger } =
    useFormContext<QuizFormValues>()

  const handleNext = async () => {
    const valid = await trigger([
      'q3PreferredSegments',
      'q4PreferredSubsegments',
      'q5ExcludedSegments',
      'q6PreferredModel',
    ])
    if (valid) onNext()
  }

  const preferredSegments = watch('q3PreferredSegments') ?? []
  const excludedSegments = watch('q5ExcludedSegments') ?? []

  const segmentOptions = QUIZ_SEGMENTS.map((s) => ({ value: s, label: s }))

  const subsegmentsForSelected = QUIZ_SUBSEGMENTS.filter((sub) =>
    preferredSegments.includes(sub.segment),
  )
  const subsegmentOptions = subsegmentsForSelected.map((sub) => ({
    value: sub.value,
    label: sub.label,
  }))

  const excludedOptions = [
    ...QUIZ_SEGMENTS.filter((s) => !preferredSegments.includes(s)).map((s) => ({
      value: s,
      label: s,
    })),
    { value: OPEN_TO_ALL, label: OPEN_TO_ALL },
  ]

  return (
    <form
      className="space-y-4 sm:space-y-6 w-full px-2 sm:px-0.5"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      <div>
        <label className="mb-1 font-medium block text-sm sm:text-base">
          3. Em quais áreas de negócios você gostaria de investir? (até 2
          opções)
        </label>
        <MultiSelect
          options={segmentOptions}
          value={preferredSegments}
          maxSelected={2}
          searchPlaceholder="Buscar opções..."
          onChange={(v) => {
            setValue('q3PreferredSegments', v as QuizSegmentKey[])
            if (formState.errors.q3PreferredSegments) {
              trigger('q3PreferredSegments')
            }
          }}
          placeholder="Selecione até 2 segmentos"
          error={formState.errors.q3PreferredSegments?.message}
        />
      </div>
      {preferredSegments.length > 0 && (
        <div>
          <label className="mb-1 font-medium block text-sm sm:text-base">
            4. Dentro dos segmentos escolhidos, quais subsegmentos mais te
            interessam? (até 2 opções)
          </label>
          <MultiSelect
            options={subsegmentOptions}
            value={watch('q4PreferredSubsegments') ?? []}
            maxSelected={2}
            searchPlaceholder="Buscar opções..."
            onChange={(v) => {
              setValue('q4PreferredSubsegments', v)
              if (formState.errors.q4PreferredSubsegments) {
                trigger('q4PreferredSubsegments')
              }
            }}
            placeholder="Selecione até 2 subsegmentos"
            error={formState.errors.q4PreferredSubsegments?.message}
          />
        </div>
      )}
      <div>
        <label className="mb-1 font-medium block text-sm sm:text-base">
          5. Existe algum segmento que você prefere NÃO considerar?
        </label>
        <MultiSelect
          options={excludedOptions}
          value={excludedSegments}
          onChange={(v) => setValue('q5ExcludedSegments', v)}
          placeholder="Selecione os que não deseja"
        />
      </div>
      <FormSelect
        label="6. Pensando na operação do dia a dia, qual modelo de franquia mais combina com você?"
        id="q6PreferredModel"
        options={PREFERRED_MODEL_OPTIONS}
        placeholder="Selecione"
        register={register('q6PreferredModel')}
        value={watch('q6PreferredModel')}
        error={formState.errors.q6PreferredModel?.message}
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
