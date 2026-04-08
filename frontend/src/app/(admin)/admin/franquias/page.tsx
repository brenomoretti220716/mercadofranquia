'use client'

import AdminFranchisePanel from '@/src/components/admin/panels/franchises/AdminFranchisePanel'
import AdminFranchiseTableSkeleton from '@/src/components/ui/skeletons/AdminFranchiseTableSkeleton'
import { Suspense } from 'react'

export default function AdminFranchisesPage() {
  return (
    <Suspense fallback={<AdminFranchiseTableSkeleton />}>
      <AdminFranchisePanel />
    </Suspense>
  )
}
