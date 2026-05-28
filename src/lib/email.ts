import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = "DropBay <noreply@dropbay.com.br>"
const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://www.dropbay.com.br"

export async function sendAdminNewListingEmail(params: {
  adminEmails: string[]
  sellerName: string
  sellerEmail: string
  listingId: string
  items: { name: string; quantity: number; price: number }[]
}) {
  const { adminEmails, sellerName, sellerEmail, listingId, items } = params
  if (!adminEmails.length) return

  const itemsHtml = items
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px 12px;color:#f5f5f7;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.06);">${it.name}</td>
          <td style="padding:8px 12px;color:#98989f;font-size:14px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">${it.quantity}</td>
          <td style="padding:8px 12px;color:#0071e3;font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">R$ ${it.price.toFixed(2)}</td>
        </tr>`
    )
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="background:#000;margin:0;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;">
        <div style="background:#000;padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:22px;font-weight:700;color:#f5f5f7;">Drop<span style="color:#0071e3;">Bay</span></span>
        </div>
        <div style="padding:40px 32px;">
          <h1 style="color:#f5f5f7;font-size:20px;font-weight:700;margin:0 0 6px;">Novo anúncio criado</h1>
          <p style="color:#98989f;font-size:14px;margin:0 0 24px;">
            ${sellerName} (<a href="mailto:${sellerEmail}" style="color:#0071e3;text-decoration:none;">${sellerEmail}</a>) criou um novo anúncio.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.12);">
                <th style="padding:8px 12px;color:#636366;font-size:12px;font-weight:600;text-align:left;text-transform:uppercase;letter-spacing:0.08em;">Item</th>
                <th style="padding:8px 12px;color:#636366;font-size:12px;font-weight:600;text-align:center;text-transform:uppercase;letter-spacing:0.08em;">Qtd</th>
                <th style="padding:8px 12px;color:#636366;font-size:12px;font-weight:600;text-align:right;text-transform:uppercase;letter-spacing:0.08em;">Preço</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align:center;">
            <a href="${BASE_URL}/admin/anuncios"
              style="display:inline-block;background:#0071e3;color:#fff;text-decoration:none;padding:12px 28px;border-radius:980px;font-size:14px;font-weight:500;">
              Ver no painel admin
            </a>
          </div>
        </div>
        <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="color:#636366;font-size:11px;margin:0;">
            © ${new Date().getFullYear()} DropBay · Comunidade Arc Raiders
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: FROM,
    to: adminEmails,
    subject: `Novo anúncio — ${sellerName}`,
    html,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${BASE_URL}/redefinir-senha?token=${token}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Redefinir senha — DropBay",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="background:#000;margin:0;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;">
          <div style="background:#000;padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
            <span style="font-size:22px;font-weight:700;color:#f5f5f7;">Drop<span style="color:#0071e3;">Bay</span></span>
          </div>
          <div style="padding:40px 32px;text-align:center;">
            <h1 style="color:#f5f5f7;font-size:22px;font-weight:700;margin:0 0 8px;">Redefinir senha</h1>
            <p style="color:#98989f;font-size:15px;line-height:1.6;margin:0 0 32px;">
              Olá, ${name}! Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#f5f5f7;">1 hora</strong>.
            </p>
            <a href="${link}"
              style="display:inline-block;background:#0071e3;color:#fff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;">
              Redefinir senha
            </a>
            <p style="color:#636366;font-size:12px;margin:24px 0 0;">
              Se você não solicitou a redefinição, ignore este email.<br/>Sua senha não será alterada.
            </p>
          </div>
          <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
            <p style="color:#636366;font-size:11px;margin:0;">
              © ${new Date().getFullYear()} DropBay · Comunidade Arc Raiders
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${BASE_URL}/api/verificar-email?token=${token}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirme seu email — DropBay",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="background:#000;margin:0;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;">
          <div style="background:#000;padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
            <span style="font-size:22px;font-weight:700;color:#f5f5f7;">Drop<span style="color:#0071e3;">Bay</span></span>
          </div>
          <div style="padding:40px 32px;text-align:center;">
            <h1 style="color:#f5f5f7;font-size:22px;font-weight:700;margin:0 0 8px;">Confirme seu email</h1>
            <p style="color:#98989f;font-size:15px;line-height:1.6;margin:0 0 32px;">
              Olá, ${name}! Clique no botão abaixo para verificar seu email e ativar sua conta no DropBay.
            </p>
            <a href="${link}"
              style="display:inline-block;background:#0071e3;color:#fff;text-decoration:none;padding:14px 32px;border-radius:980px;font-size:15px;font-weight:500;">
              Verificar email
            </a>
            <p style="color:#636366;font-size:12px;margin:24px 0 0;">
              Este link expira em 24 horas.<br/>
              Se você não criou uma conta, ignore este email.
            </p>
          </div>
          <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
            <p style="color:#636366;font-size:11px;margin:0;">
              © ${new Date().getFullYear()} DropBay · Comunidade Arc Raiders
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
