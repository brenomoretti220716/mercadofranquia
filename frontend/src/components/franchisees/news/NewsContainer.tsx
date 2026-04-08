'use client'

import { Suspense } from 'react'

import BannerNews from './BannerNews'
import HomeBottomNews from './HomeBottomNews'
import BannerNewsSkeleton from '@/src/components/ui/skeletons/BannerNewsSkeleton'
import NewsListSkeleton from '@/src/components/ui/skeletons/NewsListSkeleton'

export default function NewsContainer() {
  return (
    <div className="flex flex-col gap-10">
      <section className="w-full">
        <h2 className="text-3xl font-medium mb-3">Últimas notícias!</h2>
        <div className="h-full md:h-[80vh] lg:h-[100vh]">
          <Suspense fallback={<BannerNewsSkeleton />}>
            <BannerNews />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={<NewsListSkeleton />}>
        <HomeBottomNews />
      </Suspense>
    </div>
  )
}
