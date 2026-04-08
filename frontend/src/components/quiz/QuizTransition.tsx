'use client'

import RoundedButton from '../ui/RoundedButton'

interface QuizTransitionProps {
  title: string
  text: string
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
}

export default function QuizTransition({
  title,
  text,
  onNext,
  nextLabel = 'Continuar',
  nextDisabled = false,
}: QuizTransitionProps) {
  return (
    <div className="w-full text-center space-y-4 sm:space-y-6 py-4 px-2 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
        {text}
      </p>
      <div className="flex justify-center pt-4">
        <RoundedButton
          type="button"
          text={nextLabel}
          color="hsl(240 24% 12%)"
          hoverColor="hsl(10 79% 57%)"
          textColor="white"
          hoverTextColor="white"
          onClick={onNext}
          disabled={nextDisabled}
        />
      </div>
    </div>
  )
}
