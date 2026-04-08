'use client'

import SelectedFranchise from '@/src/components/franchisees/franchises/panel/SelectedFranchise'
import Header from '@/src/components/header/Header'
import AdminSelectedFranchiseSkeleton from '@/src/components/ui/skeletons/AdminSelectedFranchiseSkeleton'
import { Suspense } from 'react'

export default function FranchisePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<AdminSelectedFranchiseSkeleton />}>
        <SelectedFranchise />
      </Suspense>
    </>
  )
}
