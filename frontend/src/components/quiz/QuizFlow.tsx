'use client'

import { useCallback, useState } from 'react'
import { type Resolver, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  QuizFormSchema,
  defaultQuizValues,
  type QuizFormValues,
} from '@/src/schemas/quiz/quiz'
import { useSubmitQuiz } from '@/src/hooks/quiz/useQuizMutations'
import StepMomento from './steps/StepMomento'
import StepInteresses from './steps/StepInteresses'
import StepOperacional from './steps/StepOperacional'
import StepVisao from './steps/StepVisao'
import StepInvestidor from './steps/StepInvestidor'
import StepFinanceiro from './steps/StepFinanceiro'
import StepLocalizacao from './steps/StepLocalizacao'

const SCREENS = [
  'momento',
  'interesses',
  'operacional',
  'visao',
  'investidor',
  'financeiro',
  'localizacao',
] as const

type Screen = (typeof SCREENS)[number]

const STEP_LABELS = [
  'Conexão',
  'Interesses',
  'Operacional',
  'Visão',
  'Investidor',
  'Financeiro',
  'Localização',
]

interface QuizFlowProps {
  userName: string
  onSuccess: () => void
}

export default function QuizFlow({ onSuccess }: QuizFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const submitMutation = useSubmitQuiz()

  const form = useForm<QuizFormValues>({
    defaultValues: defaultQuizValues,
    resolver: zodResolver(QuizFormSchema) as Resolver<QuizFormValues>,
  })

  const currentScreen: Screen = SCREENS[currentIndex]

  const goNext = useCallback(() => {
    if (currentIndex < SCREENS.length - 1) {
      setCurrentIndex((i) => i + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentIndex])

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }, [currentIndex])

  const handleFinalSubmit = useCallback(() => {
    submitMutation.mutate(form.getValues(), {
      onSuccess: () => {
        onSuccess()
      },
    })
  }, [form, submitMutation, onSuccess])

  const stepIndicatorIndex = SCREENS.indexOf(currentScreen)
  const totalSteps = SCREENS.length

  return (
    <FormProvider {...form}>
      <div className="w-full max-w-xl mx-auto px-1 sm:px-0">
        {/* Step indicator - scrollable on narrow screens */}
        <div className="flex justify-center items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex items-center flex-shrink-0 min-w-0">
            {STEP_LABELS.map((label, index) => (
              <div key={label} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold transition-colors flex-shrink-0 ${
                    index <= stepIndicatorIndex
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`w-4 sm:w-6 md:w-8 h-0.5 mx-0.5 flex-shrink-0 transition-colors ${
                      index < stepIndicatorIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step screens */}
        {currentScreen === 'momento' && <StepMomento onNext={goNext} />}
        {currentScreen === 'interesses' && (
          <StepInteresses onNext={goNext} onBack={goBack} />
        )}
        {currentScreen === 'operacional' && (
          <StepOperacional onNext={goNext} onBack={goBack} />
        )}
        {currentScreen === 'visao' && (
          <StepVisao onNext={goNext} onBack={goBack} />
        )}
        {currentScreen === 'investidor' && (
          <StepInvestidor onNext={goNext} onBack={goBack} />
        )}
        {currentScreen === 'financeiro' && (
          <StepFinanceiro onNext={goNext} onBack={goBack} />
        )}
        {currentScreen === 'localizacao' && (
          <StepLocalizacao
            onNext={handleFinalSubmit}
            onBack={goBack}
            isSubmitting={submitMutation.isPending}
          />
        )}
      </div>
    </FormProvider>
  )
}
