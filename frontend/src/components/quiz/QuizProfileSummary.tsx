import type { QuizProfileAnswer } from '@/src/services/quiz'

interface QuizProfileSummaryProps {
  answers: QuizProfileAnswer[]
}

export function QuizProfileSummary({ answers }: QuizProfileSummaryProps) {
  if (!answers || answers.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">
        Seu perfil considerado nos resultados
      </h3>
      <div className="flex flex-wrap gap-2">
        {answers.map((answer) => (
          <span
            key={answer.key}
            className="inline-flex items-center rounded-full border border-border bg-[#E25F25]/10 px-3 py-1 text-xs sm:text-sm text-foreground"
          >
            <span className="font-medium mr-1.5">{answer.label}:</span>
            <span className="text-[#E25F25]">{answer.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
