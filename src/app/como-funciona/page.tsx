import React from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"

const BUY_STEPS = [
  { n: "01", title: "O vendedor cria um anúncio",       desc: "O player anuncia seu item dentro da plataforma DropBay com o preço desejado." },
  { n: "02", title: "Anúncio em análise",                desc: "Nossa equipe revisa o anúncio antes de publicá-lo no marketplace." },
  { n: "03", title: "Anúncio é liberado",                desc: "Após aprovação, o item fica disponível para compra na loja." },
  { n: "04", title: "O comprador realiza o pagamento",   desc: "O pagamento é processado de forma segura através da plataforma." },
  { n: "05", title: "Vendedor e comprador combinam",     desc: "Vendedor e comprador entram em contato pelo Discord para combinar a entrega do item in-game." },
  { n: "06", title: "Pagamento liberado ao vendedor",    desc: "Após a entrega confirmada pelo comprador, o valor é liberado ao vendedor." },
]

const TRADE_STEPS = [
  { n: "01", title: "O player cria um anúncio de troca",  desc: "O jogador informa os itens que deseja oferecer e quais itens gostaria de receber." },
  { n: "02", title: "Players combinam a troca",            desc: "Outro player encontra o anúncio e faz uma proposta de troca." },
  { n: "03", title: "Ambos confirmam",                     desc: "Os dois jogadores confirmam a troca pela plataforma." },
  { n: "04", title: "A equipe intermedia a troca",         desc: "Nossa equipe recolhe os itens de cada jogador in-game e garante a troca com segurança." },
  { n: "05", title: "Entrega final",                       desc: "Os itens são entregues para seus novos donos dentro do jogo." },
]

const GUARANTEES = [
  "Mais segurança em todas as transações",
  "Redução de golpes entre players",
  "Confirmação dos itens antes de cada trade",
  "Maior confiança entre compradores e vendedores",
]

function StepList({ steps, dark }: { steps: typeof BUY_STEPS; dark: boolean }) {
  const text    = dark ? "#f5f5f7"              : "#1d1d1f"
  const sub     = dark ? "rgba(255,255,255,0.5)" : "#6e6e73"
  const accent  = dark ? "#0071e3"              : "#0071e3"
  const border  = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: "flex",
          gap: "24px",
          padding: "24px 0",
          borderBottom: i < steps.length - 1 ? `1px solid ${border}` : "none",
          alignItems: "flex-start",
        }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: "13px",
            fontWeight: 700,
            color: accent,
            minWidth: "28px",
            paddingTop: "2px",
            flexShrink: 0,
          }}>
            {s.n}
          </span>
          <div>
            <p style={{ color: text, fontSize: "16px", fontWeight: 600, marginBottom: "4px", lineHeight: 1.3 }}>
              {s.title}
            </p>
            <p style={{ color: sub, fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
              {s.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="pt-14">

        {/* Hero */}
        <section className="text-center" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="relative pt-20 pb-16 px-4">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "var(--text-secondary)", letterSpacing: "0.12em" }}>
              Transparência · Segurança
            </p>
            <h1 className="font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", fontSize: "clamp(3rem, 7vw, 5.5rem)", letterSpacing: "-0.04em", lineHeight: 1.0 }}>
              Como Funciona.
            </h1>
            <p className="mx-auto"
              style={{ color: "var(--text-secondary)", maxWidth: "460px", lineHeight: 1.6, fontSize: "17px" }}>
              A DropBay foi criada para tornar as trades de ARC Raiders mais seguras para compradores e vendedores, através de custódia de itens e intermediação da nossa equipe.
            </p>
          </div>
        </section>

        {/* Compra — fundo branco */}
        <section style={{ background: "#f5f5f7" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
              Marketplace
            </p>
            <h2 className="font-bold tracking-tight mb-10"
              style={{ color: "#1d1d1f", fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Compra de Itens.
            </h2>
            <StepList steps={BUY_STEPS} dark={false} />
            <div className="mt-10">
              <Link href="/loja"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "#1d1d1f", color: "#fff", padding: "0.6rem 1.75rem" }}>
                Ver itens disponíveis
              </Link>
            </div>
          </div>
        </section>

        {/* Troca — fundo preto */}
        <section style={{ background: "#000" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em" }}>
              Gratuito
            </p>
            <h2 className="font-bold tracking-tight mb-10"
              style={{ color: "#f5f5f7", fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Troca de Itens.
            </h2>
            <StepList steps={TRADE_STEPS} dark={true} />
            <div className="mt-10">
              <Link href="/trocas"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "#f5f5f7", color: "#000", padding: "0.6rem 1.75rem" }}>
                Ver trocas disponíveis
              </Link>
            </div>
          </div>
        </section>

        {/* Custódia — fundo branco */}
        <section style={{ background: "#f5f5f7" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
              Nossa garantia
            </p>
            <h2 className="font-bold tracking-tight mb-4"
              style={{ color: "#1d1d1f", fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Custódia e Segurança.
            </h2>
            <p style={{ color: "#6e6e73", fontSize: "17px", lineHeight: 1.6, marginBottom: "32px", maxWidth: "540px" }}>
              Toda transação na DropBay é supervisionada pela nossa equipe. Isso garante:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {GUARANTEES.map((g, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "16px", color: "#1d1d1f" }}>
                  <span style={{ color: "#0071e3", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>—</span>
                  {g}
                </li>
              ))}
            </ul>
            <p style={{ color: "#6e6e73", fontSize: "16px", lineHeight: 1.6, marginTop: "32px", maxWidth: "540px" }}>
              Nosso objetivo é fortalecer a comunidade brasileira de ARC Raiders através de um ambiente seguro para trades entre players.
            </p>
          </div>
        </section>

        {/* Aviso — fundo preto */}
        <section style={{ background: "#000" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em" }}>
              Aviso importante
            </p>
            <h2 className="font-bold tracking-tight mb-4"
              style={{ color: "#f5f5f7", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Sem afiliação oficial.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", lineHeight: 1.7, maxWidth: "540px" }}>
              A DropBay não possui afiliação oficial com ARC Raiders ou com seus desenvolvedores.
              Somos uma plataforma criada pela comunidade para facilitar trades entre jogadores.
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
