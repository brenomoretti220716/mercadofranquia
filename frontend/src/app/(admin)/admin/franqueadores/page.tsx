import dynamic from 'next/dynamic'
import FranchisorsUsersTableSkeleton from '@/src/components/ui/skeletons/FranchisorsUsersTableSkeleton'
import { Suspense } from 'react'

const FranchisorsPanel = dynamic(
  () =>
    import(
      '@/src/components/admin/panels/users/franchisors-controll/FranchisorsPanel'
    ),
  {
    loading: () => <FranchisorsUsersTableSkeleton />,
    ssr: true,
  },
)

export default function FranchisorsPage() {
  return (
    <Suspense fallback={<FranchisorsUsersTableSkeleton />}>
      <FranchisorsPanel />
    </Suspense>
  )
}
