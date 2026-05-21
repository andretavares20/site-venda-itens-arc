import Navbar from "@/components/navbar"
import { Skeleton } from "@/components/skeleton"

export default function ProdutoLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-5xl mx-auto">
        <Skeleton style={{ height: "20px", width: "80px", marginBottom: "32px" }} />
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton style={{ aspectRatio: "1", borderRadius: "24px" }} />
          <div className="flex flex-col gap-4">
            <Skeleton style={{ height: "28px", width: "80px", borderRadius: "20px" }} />
            <Skeleton style={{ height: "48px" }} />
            <Skeleton style={{ height: "64px" }} />
            <Skeleton style={{ height: "24px", width: "120px" }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} style={{ height: "72px", borderRadius: "16px" }} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
