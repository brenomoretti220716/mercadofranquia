import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import AdminNewsTableSkeleton from '@/src/components/ui/skeletons/AdminNewsTableSkeleton'

const AbfSegmentsPanel = dynamic(
  () => import('@/src/components/admin/panels/abfSegments/AbfSegmentsPanel'),
  {
    loading: () => <AdminNewsTableSkeleton />,
    ssr: true,
  },
)

export default function AdminAbfSegmentsPage() {
  return (
    <Suspense fallback={<AdminNewsTableSkeleton />}>
      <AbfSegmentsPanel />
    </Suspense>
  )
}
