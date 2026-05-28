import React from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"

const BUY_STEPS = [
  { n: "01", title: "Jogador publica o item",              desc: "O player informa o item disponível e o preço desejado. A oferta aparece imediatamente para toda a comunidade." },
  { n: "02", title: "Outro jogador realiza o pagamento",  desc: "O interessado encontra a oferta e efetua o pagamento de forma segura pela plataforma. O valor fica retido até a entrega ser confirmada." },
  { n: "03", title: "Os jogadores se conectam",           desc: "Após o pagamento, ambos recebem uma notificação e entram em contato pelo Discord para combinar a entrega do item in-game." },
  { n: "04", title: "Entrega realizada in-game",          desc: "Os dois se encontram dentro de ARC Raiders e o item é entregue diretamente entre os jogadores." },
  { n: "05", title: "Entrega confirmada",                 desc: "Após receber o item, o jogador confirma a entrega no site. O valor é então liberado para quem entregou." },
]

const TRADE_STEPS = [
  { n: "01", title: "O player cria um anúncio de troca",  desc: "O jogador informa os itens que oferece e o que deseja receber. Pode aceitar qualquer proposta ou especificar itens de interesse." },
  { n: "02", title: "Outro player faz uma proposta",      desc: "Interessados enviam propostas com os itens que oferecem em troca. O dono do anúncio recebe uma notificação." },
  { n: "03", title: "O dono aceita uma proposta",         desc: "Ao aceitar, ambos os jogadores são notificados e precisam confirmar a troca no site." },
  { n: "04", title: "Ambos confirmam",                    desc: "Com a confirmação dos dois lados, a troca está pronta. Ambos recebem contato via Discord." },
  { n: "05", title: "Entrega direta in-game",             desc: "Os dois jogadores se encontram pelo Discord e combinam a troca dos itens dentro do jogo." },
]

const ORDER_STEPS = [
  { n: "01", title: "Jogador cria uma encomenda",         desc: "O player informa o item que busca, a quantidade desejada e o preço máximo que está disposto a pagar (opcional)." },
  { n: "02", title: "Outro jogador faz uma proposta",    desc: "Quem possui o item encontra a encomenda e envia uma proposta de preço." },
  { n: "03", title: "Encomenda aceita e paga",           desc: "O jogador escolhe a melhor oferta e realiza o pagamento. O valor fica retido até a entrega ser confirmada." },
  { n: "04", title: "Combinam a entrega via Discord",    desc: "Os dois entram em contato pelo Discord para combinar a entrega do item in-game." },
  { n: "05", title: "Valor liberado após confirmação",   desc: "Após confirmar o recebimento no site, o valor é liberado para quem fez a entrega." },
]

const GUARANTEES = [
  "Pagamento protegido até a confirmação da entrega entre os jogadores",
  "Notificações automáticas por Discord em cada etapa",
  "Histórico de todas as transações acessível na sua conta",
  "Suporte da equipe DropBay em caso de disputa ou problema",
]

function StepList({ steps, dark }: { steps: typeof BUY_STEPS; dark: boolean }) {
  const text   = dark ? "#f5f5f7"               : "#1d1d1f"
  const sub    = dark ? "rgba(255,255,255,0.5)" : "#6e6e73"
  const accent = dark ? "#0071e3"               : "#0071e3"
  const border = dark ? "rgba(255,255,255,0.08)": "rgba(0,0,0,0.08)"

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
              style={{ color: "var(--text-secondary)", maxWidth: "500px", lineHeight: 1.6, fontSize: "17px" }}>
              A DropBay conecta jogadores de ARC Raiders de forma segura. Negociações, trocas e encomendas acontecem diretamente entre os jogadores via Discord.
            </p>
          </div>
        </section>

        {/* Compra — fundo claro */}
        <section style={{ background: "#f5f5f7" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
              Negociação
            </p>
            <h2 className="font-bold tracking-tight mb-2"
              style={{ color: "#1d1d1f", fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Negociação de Itens.
            </h2>
            <p style={{ color: "#6e6e73", fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
              Jogadores conectados diretamente para negociar itens com pagamento seguro. A entrega é combinada via Discord.
            </p>
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

        {/* Troca — fundo escuro */}
        <section style={{ background: "#000" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em" }}>
              Gratuito
            </p>
            <h2 className="font-bold tracking-tight mb-2"
              style={{ color: "#f5f5f7", fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Troca de Itens.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
              Troque itens com outros jogadores sem envolver dinheiro. Tudo combinado diretamente entre os dois lados via Discord.
            </p>
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

        {/* Encomenda — fundo claro */}
        <section style={{ background: "#f5f5f7" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
              Sob demanda
            </p>
            <h2 className="font-bold tracking-tight mb-2"
              style={{ color: "#1d1d1f", fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Encomendas.
            </h2>
            <p style={{ color: "#6e6e73", fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
              Não encontrou o item que procura? Crie uma encomenda e deixe outros jogadores virem até você.
            </p>
            <StepList steps={ORDER_STEPS} dark={false} />
            <div className="mt-10">
              <Link href="/encomendas/nova"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "#1d1d1f", color: "#fff", padding: "0.6rem 1.75rem" }}>
                Criar uma encomenda
              </Link>
            </div>
          </div>
        </section>

        {/* Segurança — fundo escuro */}
        <section style={{ background: "#000" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em" }}>
              Nossa garantia
            </p>
            <h2 className="font-bold tracking-tight mb-4"
              style={{ color: "#f5f5f7", fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Como garantimos segurança.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "17px", lineHeight: 1.6, marginBottom: "32px", maxWidth: "540px" }}>
              As negociações acontecem diretamente entre jogadores. A DropBay mantém mecanismos de proteção em cada etapa:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {GUARANTEES.map((g, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "16px", color: "#f5f5f7" }}>
                  <span style={{ color: "#0071e3", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>—</span>
                  {g}
                </li>
              ))}
            </ul>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", lineHeight: 1.6, marginTop: "32px", maxWidth: "540px" }}>
              Em caso de problema, nossa equipe analisa o histórico da transação e oferece suporte para resolução.
            </p>
          </div>
        </section>

        {/* Aviso — fundo claro */}
        <section style={{ background: "#f5f5f7" }}>
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
              Aviso importante
            </p>
            <h2 className="font-bold tracking-tight mb-4"
              style={{ color: "#1d1d1f", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Sem afiliação oficial.
            </h2>
            <p style={{ color: "#6e6e73", fontSize: "16px", lineHeight: 1.7, maxWidth: "540px" }}>
              A DropBay não possui afiliação oficial com ARC Raiders ou com seus desenvolvedores.
              Somos uma plataforma comunitária criada para conectar jogadores de Arc Raiders de forma segura.
            </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
