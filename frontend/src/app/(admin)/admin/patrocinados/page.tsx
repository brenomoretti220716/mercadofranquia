'use client'

import AdminSponsoredPanel from '@/src/components/admin/panels/franchises/AdminSponsoredPanel'
import AdminSponsoredPanelSkeleton from '@/src/components/ui/skeletons/AdminSponsoredPanelSkeleton'
import { Suspense } from 'react'

export default function AdminSponsoredPage() {
  return (
    <Suspense fallback={<AdminSponsoredPanelSkeleton />}>
      <AdminSponsoredPanel />
    </Suspense>
  )
}
