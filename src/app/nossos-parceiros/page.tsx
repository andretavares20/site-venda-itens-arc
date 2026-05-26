import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { prisma } from "@/lib/db"
import { ExternalLink } from "lucide-react"

const css = `
  .partner-twitch:hover { background: rgba(145,71,255,0.22) !important; }
`

export default async function NossosParceirosPage() {
  const partners = await prisma.partner.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, twitchUrl: true, avatarUrl: true, description: true },
  })

  return (
    <div className="min-h-screen" style={{ background: "#000" }}>
      <style>{css}</style>
      <Navbar />

      <main className="pt-14">

        {/* Hero */}
        <section className="text-center px-4 pt-20 pb-16" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs font-semibold mb-4 tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>
            Parceiros oficiais
          </p>
          <h1 className="font-bold tracking-tight mb-4"
            style={{ color: "#f5f5f7", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", letterSpacing: "-0.04em", lineHeight: 1.0 }}>
            Nossos Parceiros.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "17px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto" }}>
            Criadores e streamers que fazem parte da família DropBay.
          </p>
        </section>

        {/* Grid de parceiros */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          {partners.length === 0 ? (
            <p className="text-center" style={{ color: "rgba(255,255,255,0.3)", fontSize: "15px" }}>
              Nenhum parceiro cadastrado ainda.
            </p>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {partners.map((p) => (
                <div key={p.id} className="rounded-2xl p-6 flex flex-col gap-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-4">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                        style={{ border: "2px solid rgba(145,71,255,0.4)" }} />
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
                        style={{ background: "rgba(145,71,255,0.15)", color: "#9147ff", border: "2px solid rgba(145,71,255,0.3)" }}>
                        {p.name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-base" style={{ color: "#f5f5f7" }}>{p.name}</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: "#9147ff" }}>DropBay Partner</p>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                      {p.description}
                    </p>
                  )}

                  {p.twitchUrl && (
                    <a href={p.twitchUrl} target="_blank" rel="noopener noreferrer"
                      className="partner-twitch mt-auto flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl"
                      style={{ background: "rgba(145,71,255,0.12)", color: "#9147ff", border: "1px solid rgba(145,71,255,0.25)", transition: "background 0.15s" }}>
                      <ExternalLink size={14} />
                      Assistir na Twitch
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  )
}
