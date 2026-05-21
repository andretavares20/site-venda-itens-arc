import Navbar from "@/components/navbar"
import { SkeletonCard } from "@/components/skeleton"

export default function LojaLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-14">
        <div className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="h-8 w-48 rounded-lg mb-2" style={{ background: "var(--surface-2)" }} />
            <div className="h-4 w-32 rounded-lg mb-4" style={{ background: "var(--surface-2)" }} />
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-7 w-20 rounded-full" style={{ background: "var(--surface-2)" }} />
              ))}
            </div>
          </div>
        </div>
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
            {Array.from({ length: 21 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </section>
      </main>
    </div>
  )
}
