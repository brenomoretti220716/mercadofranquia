'use client'

import type {
  QuizFranchiseResult,
  QuizProfileAnswer,
  QuizResultsBlock,
} from '@/src/services/quiz'
import type { ReactNode } from 'react'
import { formatInvestmentRange } from '@/src/utils/formatters'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Pagination } from '../ui/Pagination'
import RoundedButton from '../ui/RoundedButton'
import { QuizProfileSummary } from './QuizProfileSummary'

interface QuizResultsProps {
  blocks: QuizResultsBlock[]
  profileAnswers?: QuizProfileAnswer[]
  onRetake: () => void
  page: number
  onPageChange: (page: number) => void
  spotlightContent?: ReactNode
}

function QuizFranchiseCard({
  franchise,
  rank,
  showMatchBadge = false,
}: {
  franchise: QuizFranchiseResult
  rank: number
  showMatchBadge?: boolean
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const logoUrl = franchise.logoUrl?.trim() || ''
  const investmentStr = formatInvestmentRange(
    franchise.minimumInvestment ?? undefined,
    franchise.maximumInvestment ?? undefined,
  )
  const scorePercent = Math.round(franchise.score.finalScore)
  const confidencePercent = Math.round(franchise.score.confidence * 100)

  return (
    <Link
      href={`/ranking/${franchise.slug}`}
      className="relative block rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {showMatchBadge && (
        <span className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full bg-primary/15 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wide px-2 py-0.5 border border-primary/30">
          Match
        </span>
      )}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
          <span className="font-bold text-primary text-sm sm:text-base">
            #{rank}
          </span>
        </div>
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
          {/* Ícone sempre visível como fallback enquanto a imagem não carrega */}
          <span
            className={`text-xl sm:text-2xl transition-opacity ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          >
            🏢
          </span>
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={franchise.name}
              width={56}
              height={56}
              className={`object-contain w-full h-full absolute inset-0 transition-opacity ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoadingComplete={() => setImageLoaded(true)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate text-sm sm:text-base">
            {franchise.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {franchise.segment ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Investimento: {investmentStr}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
            <span className="text-xs sm:text-sm font-semibold text-primary">
              {scorePercent}% compatível
            </span>
            <span className="text-xs text-muted-foreground">
              Confiança: {confidencePercent}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function QuizResults({
  blocks,
  profileAnswers,
  onRetake,
  page,
  onPageChange,
  spotlightContent,
}: QuizResultsProps) {
  const hasResults = blocks.some((b) => b.franchises.length > 0)

  const limit = blocks[0]?.pagination.pageSize ?? 10
  const totalPages =
    blocks.length > 0
      ? Math.max(...blocks.map((block) => block.pagination.totalPages || 1))
      : 1
  const totalForPagination = totalPages * limit

  if (!hasResults) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-4 sm:space-y-6 py-6 sm:py-8 px-2">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          Nenhuma franquia encontrada
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Não encontramos franquias que correspondam ao seu perfil no momento.
          Tente refazer o quiz ou ajustar seus critérios.
        </p>
        <RoundedButton
          type="button"
          text="Refazer quiz"
          color="hsl(240 24% 12%)"
          hoverColor="hsl(10 79% 57%)"
          textColor="white"
          hoverTextColor="white"
          onClick={onRetake}
        />
      </div>
    )
  }

  return (
    <div id="quiz-results" className="flex justify-center px-2 sm:px-4">
      <div className="w-full max-w-7xl py-4 sm:py-6 space-y-5 sm:space-y-7">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 lg:gap-10">
          <div className="flex flex-col gap-4 sm:gap-5 flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Franquias para você
            </h2>

            <QuizProfileSummary answers={profileAnswers ?? []} />

            <div>
              <button
                type="button"
                onClick={onRetake}
                className="rounded-full border-2 border-border px-5 py-3 text-base font-medium text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                Refazer quiz
              </button>
            </div>
          </div>

          <div className="shrink-0 w-full max-w-[420px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[640px] mx-auto md:mx-0 md:ml-auto md:self-start">
            <Image
              src="/assets/ilustrationQuiz.png"
              alt=""
              width={1536}
              height={1024}
              className="block w-full h-auto object-contain"
              sizes="(max-width: 768px) 420px, (max-width: 1024px) 480px, 640px"
              priority
            />
          </div>
        </div>

        {spotlightContent}

        <div className="space-y-6 sm:space-y-8">
          {blocks.map((block) => (
            <section key={block.label} className="space-y-3 sm:space-y-4">
              {block.label === 'mais_compativeis' &&
              block.franchises.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                    Deu Match!
                  </p>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    Mais compatíveis com seu perfil
                  </h3>
                </div>
              ) : block.label === 'proximas_do_seu_perfil' ? (
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Próximas do seu perfil
                </h3>
              ) : (
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Mais compatíveis com seu perfil
                </h3>
              )}
              {block.franchises.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma franquia nesta categoria.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {block.franchises.map((franchise, index) => (
                    <QuizFranchiseCard
                      key={franchise.id}
                      franchise={franchise}
                      rank={(page - 1) * limit + index + 1}
                      showMatchBadge={
                        block.label === 'mais_compativeis' && index < 3
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="pt-2 sm:pt-4 flex justify-center">
          <Pagination
            page={page}
            total={totalForPagination}
            limit={limit}
            onPageChange={onPageChange}
            scrollToId="quiz-results"
            scrollMarginTop={80}
          />
        </div>
      </div>
    </div>
  )
}
