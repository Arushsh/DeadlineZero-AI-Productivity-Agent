// src/components/TaskSkeleton.jsx
// Animated skeleton placeholder for the task list while loading

function SkeletonLine({ width = 'w-full', height = 'h-3' }) {
  return (
    <div
      className={`${width} ${height} rounded-full bg-bg-elevated relative overflow-hidden`}
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        style={{ animation: 'skeleton-shimmer 1.6s infinite linear', backgroundSize: '200% 100%' }}
      />
    </div>
  )
}

function TaskSkeletonCard({ delay = 0 }) {
  return (
    <div
      className="glass rounded-xl p-4 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Circle checkbox */}
        <div className="w-[18px] h-[18px] rounded-full bg-bg-elevated flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          {/* Title row */}
          <div className="flex items-center justify-between gap-3">
            <SkeletonLine width="w-3/5" height="h-3.5" />
            <div className="w-16 h-5 rounded-md bg-bg-elevated flex-shrink-0" />
          </div>

          {/* Meta row */}
          <div className="flex gap-2.5 items-center">
            <div className="w-20 h-4 rounded-md bg-bg-elevated" />
            <SkeletonLine width="w-10" height="h-3" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TaskSkeleton({ count = 4 }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <TaskSkeletonCard key={i} delay={i * 80} />
        ))}
      </div>
    </>
  )
}
