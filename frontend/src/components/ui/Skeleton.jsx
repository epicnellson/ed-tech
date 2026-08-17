import { cn } from '../../lib/utils'

const Skeleton = ({ className, ...props }) => (
  <div
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
)

const CardSkeleton = () => (
  <div className="rounded-xl border bg-card p-6 space-y-4">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-20 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
)

const CourseCardSkeleton = () => (
  <div className="rounded-xl border bg-card p-4 space-y-3">
    <Skeleton className="h-32 w-full rounded-lg" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
)

const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-gray-100">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="h-4 w-20" />
  </div>
)

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex gap-4">
      <Skeleton className="h-24 flex-1" />
      <Skeleton className="h-24 flex-1" />
      <Skeleton className="h-24 flex-1" />
      <Skeleton className="h-24 flex-1" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
)

export { Skeleton, CardSkeleton, CourseCardSkeleton, TableRowSkeleton, DashboardSkeleton }
