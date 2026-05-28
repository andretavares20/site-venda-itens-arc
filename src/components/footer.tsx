import Link from "next/link"

const COLUMNS = [
  {
    title: "Explorar",
    links: [
      { label: "Loja", href: "/loja" },
      { label: "Trocas", href: "/trocas" },
      { label: "Publicar item", href: "/anunciar" },
      { label: "Programa de Parceiros", href: "/parceiros" },
    ],
  },
  {
    title: "Sua Conta",
    links: [
      { label: "Minha conta", href: "/minha-conta" },
      { label: "Meus anúncios", href: "/minha-conta/anuncios" },
      { label: "Minhas trocas", href: "/minha-conta/trocas" },
      { label: "Meu perfil", href: "/minha-conta/perfil" },
    ],
  },
  {
    title: "Arc Raiders",
    links: [
      { label: "Itens Épicos", href: "/loja?raridade=Epic" },
      { label: "Itens Lendários", href: "/loja?raridade=Legendary" },
      { label: "Assault Rifles", href: "/loja?categoria=Assault Rifle" },
      { label: "Modificações", href: "/loja?categoria=Modification" },
      { label: "Blueprints", href: "/loja?categoria=Blueprint" },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ background: "#f5f5f7", borderTop: "1px solid #d2d2d7" }}>
      <style>{`
        .footer-link { color: #6e6e73; font-size: 12px; display: block; margin-bottom: 8px; text-decoration: none; transition: color 0.15s; }
        .footer-link:hover { color: #1d1d1f; }
        .footer-legal { color: #6e6e73; font-size: 12px; text-decoration: none; transition: color 0.15s; }
        .footer-legal:hover { color: #1d1d1f; }
      `}</style>

      {/* Colunas */}
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-wrap justify-center gap-24">
        {COLUMNS.map((col) => (
          <div key={col.title} style={{ minWidth: "120px" }}>
            <p className="font-semibold mb-3" style={{ color: "#1d1d1f", fontSize: "12px" }}>
              {col.title}
            </p>
            {col.links.map(({ label, href }) => (
              <Link key={label} href={href} className="footer-link">{label}</Link>
            ))}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #d2d2d7" }} />

      {/* Copyright */}
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <p style={{ color: "#6e6e73", fontSize: "12px" }}>
            © {new Date().getFullYear()} DropBay. Todos os direitos reservados.
          </p>
          <p style={{ color: "#6e6e73", fontSize: "11px", marginTop: "2px" }}>
            Não afiliada à Embark Studios AB ou Nexon. Arc Raiders é marca registrada de seus respectivos proprietários.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { label: "Privacidade", href: "/" },
            { label: "Termos de uso", href: "/termos" },
            { label: "Contato", href: "/" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="footer-legal">{label}</Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
