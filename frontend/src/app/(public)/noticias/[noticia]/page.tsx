'use client'

import NewsDetailPanel from '@/src/components/franchisees/news/panel/NewsDetailPanel'
import Header from '@/src/components/header/Header'
import SelectedNewsSkeleton from '@/src/components/ui/skeletons/SelectedNewsSkeleton'
import { Suspense } from 'react'

export default function NewsPage() {
  return (
    <>
      <Header />
      <div className="w-auto m-5 md:m-10 rounded-2xl bg-[#FFFFFF]">
        <Suspense fallback={<SelectedNewsSkeleton />}>
          <NewsDetailPanel />
        </Suspense>
      </div>
    </>
  )
}
