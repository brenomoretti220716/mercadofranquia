import RoundedButton from '@/src/components/ui/RoundedButton'

const NAVY = 'hsl(240 24% 12%)'
const CORAL = 'hsl(10 79% 57%)'

type QuizBackButtonProps = {
  onClick: () => void
}

export default function QuizBackButton({ onClick }: QuizBackButtonProps) {
  return (
    <RoundedButton
      type="button"
      text="Voltar"
      color="#ffffff"
      borderColor={NAVY}
      borderWidth="2px"
      textColor={NAVY}
      hoverColor={CORAL}
      hoverTextColor="#ffffff"
      hoverBorderColor={CORAL}
      onClick={onClick}
    />
  )
}
