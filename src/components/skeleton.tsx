export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: "8px",
        ...style,
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <Skeleton style={{ aspectRatio: "1", borderRadius: 0 }} />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton style={{ height: "32px" }} />
        <Skeleton style={{ height: "16px", width: "60%" }} />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
    </div>
  )
}
