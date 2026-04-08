'use client'

import FranchisorSelectedFranchise from '@/src/components/franchisors/panels/franchises/FranchisorSelectedFranchise'
import FranchisorSelectedFranchiseSkeleton from '@/src/components/ui/skeletons/FranchisorSelectedFranchiseSkeleton'
import { Suspense } from 'react'

export default function MyFranchisesPage() {
  return (
    <Suspense fallback={<FranchisorSelectedFranchiseSkeleton />}>
      <FranchisorSelectedFranchise />
    </Suspense>
  )
}
