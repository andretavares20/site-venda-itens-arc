import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { prisma } from "@/lib/db"
import { ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

const css = `
  .partner-twitch:hover { background: rgba(145,71,255,0.22) !important; }
`

export default async function NossosParceirosPage() {
  const partners = await prisma.partner.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, twitchUrl: true, avatarUrl: true, bannerUrl: true, description: true },
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
                <div key={p.id} className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

                  {/* Card topo com avatar desfocado */}
                  <div className="relative w-full" style={{ aspectRatio: "16/9", background: "#111", overflow: "hidden" }}>
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" aria-hidden className="w-full h-full object-cover"
                        style={{ filter: "blur(14px)", transform: "scale(1.2)", opacity: 0.55 }} />
                    ) : (
                      <div className="w-full h-full" style={{ background: "rgba(145,71,255,0.08)" }} />
                    )}
                    {/* Avatar sobreposto no canto */}
                    <div className="absolute bottom-3 left-3">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover"
                          style={{ border: "2px solid rgba(255,255,255,0.2)" }} />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                          style={{ background: "#9147ff", color: "#fff", border: "2px solid rgba(255,255,255,0.2)" }}>
                          {p.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Badge Twitch */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(8px)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#9147ff">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                      </svg>
                      Twitch
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <p className="font-semibold" style={{ color: "#f5f5f7" }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9147ff" }}>DropBay Partner</p>
                    </div>
                    {p.description && (
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{p.description}</p>
                    )}
                    {p.twitchUrl && (
                      <a href={p.twitchUrl} target="_blank" rel="noopener noreferrer"
                        className="partner-twitch mt-auto flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl"
                        style={{ background: "rgba(145,71,255,0.12)", color: "#9147ff", border: "1px solid rgba(145,71,255,0.25)", transition: "background 0.15s" }}>
                        <ExternalLink size={14} /> Assistir na Twitch
                      </a>
                    )}
                  </div>
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
