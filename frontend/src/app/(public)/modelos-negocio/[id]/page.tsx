'use client'

import BusinessModelDetail from '@/src/components/franchisors/panels/franchises/businessModels/BusinessModelDetail'
import Header from '@/src/components/header/Header'
import BusinessModelDetailSkeleton from '@/src/components/ui/skeletons/BusinessModelDetailSkeleton'
import { Suspense } from 'react'

export default function BusinessModelPage() {
  return (
    <>
      <Header />
      <div className="w-auto m-5 md:m-10 rounded-2xl bg-[#FFFFFF]">
        <Suspense fallback={<BusinessModelDetailSkeleton />}>
          <BusinessModelDetail />
        </Suspense>
      </div>
    </>
  )
}
