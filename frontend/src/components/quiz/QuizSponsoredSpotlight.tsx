'use client'

import SegmentSponsoredSpotlight from '@/src/components/ranking/SegmentSponsoredSpotlight'

interface QuizSponsoredSpotlightProps {
  segment: string
}

export default function QuizSponsoredSpotlight({
  segment,
}: QuizSponsoredSpotlightProps) {
  return (
    <SegmentSponsoredSpotlight
      segment={segment}
      placement="QUIZ"
      title="Destaques para o seu perfil"
    />
  )
}
