import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = "DropBay <noreply@dropbay.com.br>"
const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://www.dropbay.com.br"

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${BASE_URL}/verificar-email?token=${token}`

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
              © ${new Date().getFullYear()} DropBay · Marketplace de itens Arc Raiders
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
