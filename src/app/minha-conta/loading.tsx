import Navbar from "@/components/navbar"
import { Skeleton } from "@/components/skeleton"

export default function MinhaContaLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        <Skeleton style={{ height: "80px", borderRadius: "16px", marginBottom: "32px" }} />
        <div className="grid grid-cols-2 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: "72px", borderRadius: "16px" }} />
          ))}
        </div>
        <Skeleton style={{ height: "20px", width: "120px", marginBottom: "12px" }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} style={{ height: "72px", borderRadius: "16px", marginBottom: "8px" }} />
        ))}
      </main>
    </div>
  )
}
