import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border border-[var(--border)] p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="rounded-lg border border-[var(--border)] p-6 space-y-4">
          <Skeleton className="h-6 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-20 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
