import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
