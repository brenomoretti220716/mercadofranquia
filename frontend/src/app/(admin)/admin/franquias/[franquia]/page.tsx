'use client'

import AdminSelectedFranchise from '@/src/components/admin/panels/franchises/selectedFranchise/AdminSelectedFranchise'
import AdminSelectedFranchiseSkeleton from '@/src/components/ui/skeletons/AdminSelectedFranchiseSkeleton'
import { Suspense } from 'react'

export default function SelectedFranchisePage() {
  return (
    <Suspense fallback={<AdminSelectedFranchiseSkeleton />}>
      <AdminSelectedFranchise />
    </Suspense>
  )
}
