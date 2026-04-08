import dynamic from 'next/dynamic'
import AdminNewsTableSkeleton from '@/src/components/ui/skeletons/AdminNewsTableSkeleton'
import { Suspense } from 'react'

const NewsPanel = dynamic(
  () => import('@/src/components/admin/panels/news/NewsPanel'),
  {
    loading: () => <AdminNewsTableSkeleton />,
    ssr: true,
  },
)

export default function AdminNewsPage() {
  return (
    <Suspense fallback={<AdminNewsTableSkeleton />}>
      <NewsPanel />
    </Suspense>
  )
}
