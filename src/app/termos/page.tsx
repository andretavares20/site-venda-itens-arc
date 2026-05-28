import Link from "next/link"
import Navbar from "@/components/navbar"

export const metadata = {
  title: "Termos de Uso — DropBay",
  description: "Leia os Termos de Uso da plataforma DropBay antes de utilizar nossos serviços.",
}

export default function TermosPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-20 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Termos de Uso
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--text-tertiary)" }}>
          Última atualização: 27 de maio de 2026
        </p>

        <div className="flex flex-col gap-8" style={{ color: "var(--text-secondary)" }}>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              1. Sobre a DropBay
            </h2>
            <p className="leading-relaxed">
              A DropBay é uma plataforma comunitária independente que conecta jogadores de Arc Raiders para
              negociação de itens, trocas e encontro de grupos. A DropBay <strong style={{ color: "var(--text-primary)" }}>não é afiliada,
              patrocinada, endossada ou associada</strong> à Embark Studios AB, à Nexon Co., Ltd. ou a qualquer
              empresa do grupo Nexon. Arc Raiders é uma marca registrada de seus respectivos proprietários.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              2. Aviso importante — Risco de violação dos Termos do Jogo
            </h2>
            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.25)" }}>
              <p className="text-sm font-medium mb-2" style={{ color: "rgb(255,159,10)" }}>
                Leia com atenção antes de usar a plataforma
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Os Termos de Serviço de Arc Raiders (administrados pela Nexon/Embark Studios) proíbem a venda,
                transferência ou troca de itens virtuais por dinheiro real ou qualquer outro valor em sites ou serviços
                de terceiros. O uso da DropBay para negociação de itens pode constituir violação dos Termos de Serviço
                do jogo e pode resultar em <strong style={{ color: "var(--text-primary)" }}>suspensão ou banimento
                permanente da sua conta</strong> no Arc Raiders.
              </p>
            </div>
            <p className="leading-relaxed">
              Ao utilizar a DropBay, você declara estar ciente deste risco e assume integral responsabilidade pelas
              consequências decorrentes de eventuais violações dos Termos de Serviço do jogo. A DropBay não se
              responsabiliza por banimentos, suspensões, perdas de itens ou qualquer penalidade aplicada pela
              Embark Studios ou pela Nexon à sua conta de jogo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              3. Natureza da plataforma
            </h2>
            <p className="leading-relaxed">
              A DropBay atua exclusivamente como intermediária, conectando vendedores e compradores. Não somos
              parte nas negociações entre usuários e não assumimos responsabilidade pelo cumprimento dos acordos
              firmados entre eles. A entrega dos itens in-game é realizada diretamente entre os jogadores,
              sem intervenção da DropBay no ambiente do jogo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              4. Conduta dos usuários
            </h2>
            <p className="leading-relaxed mb-3">Ao usar a DropBay, você concorda em:</p>
            <ul className="flex flex-col gap-2 text-sm" style={{ paddingLeft: "1.25rem", listStyleType: "disc" }}>
              <li>Fornecer informações verdadeiras no cadastro e nos anúncios</li>
              <li>Honrar os acordos de compra, venda ou troca que você firmar</li>
              <li>Não utilizar a plataforma para fraudes, golpes ou atividades ilegais</li>
              <li>Não anunciar itens que não estejam em sua posse</li>
              <li>Tratar outros usuários com respeito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              5. Pagamentos e taxas
            </h2>
            <p className="leading-relaxed">
              Os pagamentos realizados na plataforma são processados mediante sistema PIX. A DropBay pode cobrar
              taxas de serviço sobre as transações, conforme informado no momento da negociação. Em caso de
              inadimplemento por parte do vendedor, a DropBay adotará as medidas cabíveis para reembolso do
              comprador, conforme cada caso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              6. Limitação de responsabilidade
            </h2>
            <p className="leading-relaxed">
              A DropBay não se responsabiliza por: (i) danos decorrentes de violações dos Termos de Serviço do
              jogo pelo usuário; (ii) falhas nas entregas in-game entre jogadores; (iii) perdas financeiras
              decorrentes de negociações entre usuários realizadas fora da plataforma; (iv) instabilidades ou
              indisponibilidade do jogo que impossibilitem a entrega de itens negociados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              7. Alterações nos termos
            </h2>
            <p className="leading-relaxed">
              A DropBay pode atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas
              por e-mail ou por notificação na plataforma. O uso continuado da plataforma após a publicação das
              alterações constitui aceite dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              8. Contato
            </h2>
            <p className="leading-relaxed">
              Dúvidas sobre estes Termos podem ser enviadas através do nosso Discord ou pelos canais de suporte
              disponíveis na plataforma.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <Link href="/" className="text-sm" style={{ color: "var(--accent)" }}>
            ← Voltar à loja
          </Link>
        </div>
      </main>
    </div>
  )
}
