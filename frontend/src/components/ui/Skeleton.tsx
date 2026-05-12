interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`bg-gray-700/50 rounded ${className}`} />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gray-700/50 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-700/50 rounded w-1/2" />
    </div>
  )
}
