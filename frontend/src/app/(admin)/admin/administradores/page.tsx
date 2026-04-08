import dynamic from 'next/dynamic'
import AdminUsersTableSkeleton from '@/src/components/ui/skeletons/AdminUsersTableSkeleton'
import { Suspense } from 'react'

const AdminPanel = dynamic(
  () => import('@/src/components/admin/panels/users/admin-controll/AdminPanel'),
  {
    loading: () => <AdminUsersTableSkeleton />,
    ssr: true,
  },
)

export default function AdministradoresPage() {
  return (
    <Suspense fallback={<AdminUsersTableSkeleton />}>
      <AdminPanel />
    </Suspense>
  )
}
