const ASAAS_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://api.asaas.com/v3"
  : "https://api-sandbox.asaas.com/v3"

function detectPixKeyType(key: string): string {
  const clean = key.replace(/\D/g, "")
  if (/^[^@]+@[^@]+\.[^@]+$/.test(key)) return "EMAIL"
  if (clean.length === 11) return "CPF"
  if (clean.length === 14) return "CNPJ"
  if (/^\+?\d{10,13}$/.test(key.replace(/\s/g, ""))) return "PHONE"
  return "EVP" // chave aleatória (UUID)
}

export async function sendPixToSeller(params: {
  pixKey: string
  amount: number
  description: string
  externalReference: string
}) {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada")

  const res = await fetch(`${ASAAS_BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      "access_token": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: params.amount,
      pixAddressKey: params.pixKey,
      pixAddressKeyType: detectPixKeyType(params.pixKey),
      description: params.description,
      externalReference: params.externalReference,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.errors?.[0]?.description ?? "Erro ao enviar PIX via Asaas")
  }

  return data
}
