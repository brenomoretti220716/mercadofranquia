import FranchiseePanel from '@/src/components/admin/panels/users/franchisee-controll/FranchiseePanel'
import FranchiseeUsersTableSkeleton from '@/src/components/ui/skeletons/FranchiseeUsersTableSkeleton'
import { Suspense } from 'react'

export default function FranchiseesPage() {
  return (
    <Suspense fallback={<FranchiseeUsersTableSkeleton />}>
      <FranchiseePanel />
    </Suspense>
  )
}
