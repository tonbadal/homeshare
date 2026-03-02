import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-8" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
