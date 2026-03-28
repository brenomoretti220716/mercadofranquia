"use client"

import { PreviewCriativo } from "./PreviewCriativo"

interface Slide {
  numero?: number
  html: string
}

interface Props {
  slides: Slide[]
  slideAtivo: number
  onSelectSlide: (idx: number) => void
}

export function TiraSlides({ slides, slideAtivo, onSelectSlide }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2" style={{ minHeight: 96 }}>
      {slides.map((s, i) => (
        <PreviewCriativo
          key={i}
          html={s.html || ""}
          tamanho="miniatura"
          ativo={slideAtivo === i}
          badge={`${i + 1}/${slides.length}`}
          onClick={() => onSelectSlide(i)}
        />
      ))}
    </div>
  )
}
