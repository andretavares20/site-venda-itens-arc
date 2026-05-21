import Navbar from "@/components/navbar"
import { Skeleton } from "@/components/skeleton"

export default function TrocasLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton style={{ height: "32px", width: "120px", marginBottom: "8px" }} />
            <Skeleton style={{ height: "16px", width: "200px" }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} style={{ height: "88px", borderRadius: "16px" }} />
          ))}
        </div>
      </main>
    </div>
  )
}
