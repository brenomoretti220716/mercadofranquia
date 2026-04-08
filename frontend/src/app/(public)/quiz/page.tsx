'use client'

import Header from '@/src/components/header/Header'
import QuizFlow from '@/src/components/quiz/QuizFlow'
import QuizResults from '@/src/components/quiz/QuizResults'
import QuizSponsoredSpotlight from '@/src/components/quiz/QuizSponsoredSpotlight'
import QuizFlowSkeleton from '@/src/components/ui/skeletons/QuizFlowSkeleton'
import QuizResultsSkeleton from '@/src/components/ui/skeletons/QuizResultsSkeleton'
import {
  useMyQuiz,
  useQuizProfile,
  useQuizResults,
} from '@/src/hooks/quiz/useQuizQueries'
import { useAuth } from '@/src/hooks/users/useAuth'
import { quizKeys } from '@/src/queries/quiz'
import { useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect, useState } from 'react'

function QuizResultsSection({
  page,
  pageSize,
  onPageChange,
  onRetake,
}: {
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onRetake: () => void
}) {
  const { data: results } = useQuizResults(page, pageSize)
  const { data: profile } = useQuizProfile()
  const topMatchBlock = results.blocks.find(
    (block) => block.label === 'mais_compativeis',
  )
  const topMatch = topMatchBlock?.franchises.reduce<
    (typeof topMatchBlock.franchises)[number] | null
  >((best, franchise) => {
    if (!franchise.segment) return best
    if (!best) return franchise
    return franchise.score.finalScore > best.score.finalScore ? franchise : best
  }, null)
  const topSegment = topMatch?.segment ?? null

  return (
    <>
      <QuizResults
        blocks={results.blocks}
        profileAnswers={profile?.answers}
        onRetake={onRetake}
        page={page}
        onPageChange={onPageChange}
        spotlightContent={
          topSegment ? <QuizSponsoredSpotlight segment={topSegment} /> : null
        }
      />
    </>
  )
}

export default function QuizPage() {
  const { payload } = useAuth()
  const queryClient = useQueryClient()
  const { data: submission, isLoading: submissionLoading } = useMyQuiz()
  const hasSubmission = Boolean(submission?.id)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [view, setView] = useState<'form' | 'results'>('form')
  const [initializedView, setInitializedView] = useState(false)

  useEffect(() => {
    if (!initializedView && !submissionLoading) {
      setView(hasSubmission ? 'results' : 'form')
      setInitializedView(true)
    }
  }, [initializedView, submissionLoading, hasSubmission])

  const handleQuizSuccess = () => {
    queryClient.invalidateQueries({ queryKey: quizKeys.submission() })
    queryClient.invalidateQueries({
      queryKey: quizKeys.results(page, pageSize),
    })
    queryClient.invalidateQueries({ queryKey: quizKeys.profile() })
    setView('results')
  }

  const handleRetake = () => {
    setView('form')
    setPage(1)
  }

  const userName = payload?.name ?? ''

  if (submissionLoading) {
    return (
      <div>
        <Header />
        <main className="min-h-[80vh] flex items-center justify-center py-6 px-3 sm:px-4">
          <QuizFlowSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <main className="min-h-[60vh] my-6 sm:my-8 md:my-12 px-3 sm:px-4">
        {view === 'form' ? (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                Quiz de compatibilidade
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Responda às perguntas e veja as franquias mais alinhadas ao seu
                perfil.
              </p>
            </div>
            <Suspense fallback={<QuizFlowSkeleton />}>
              <QuizFlow userName={userName} onSuccess={handleQuizSuccess} />
            </Suspense>
          </>
        ) : (
          <Suspense fallback={<QuizResultsSkeleton />}>
            <QuizResultsSection
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onRetake={handleRetake}
            />
          </Suspense>
        )}
      </main>
    </div>
  )
}
