const BASE = process.env.NODE_ENV === "production"
  ? "https://api.asaas.com/v3"
  : "https://sandbox.asaas.com/api/v3"

function headers() {
  return {
    "access_token": process.env.ASAAS_API_KEY!,
    "Content-Type": "application/json",
  }
}

// ─── Cliente ─────────────────────────────────────────────

export async function findOrCreateCustomer(params: {
  name: string
  email: string
  cpf: string
}): Promise<string> {
  const cpfClean = params.cpf.replace(/\D/g, "")

  // Tenta buscar cliente existente pelo CPF
  const search = await fetch(`${BASE}/customers?cpfCnpj=${cpfClean}`, { headers: headers() })
  const searchData = await search.json()

  if (searchData.data?.length > 0) {
    return searchData.data[0].id
  }

  // Cria novo cliente
  const res = await fetch(`${BASE}/customers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      cpfCnpj: cpfClean,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.description ?? "Erro ao criar cliente no Asaas")
  return data.id
}

// ─── Cobrança PIX ─────────────────────────────────────────

export async function createPixCharge(params: {
  customerId: string
  amount: number
  description: string
  externalReference: string
  expirationHours?: number
}): Promise<{
  paymentId: string
  pixCode: string
  pixQrCode: string
}> {
  const dueDate = new Date()
  dueDate.setHours(dueDate.getHours() + (params.expirationHours ?? 24))
  const dueDateStr = dueDate.toISOString().split("T")[0]

  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "PIX",
      value: params.amount,
      dueDate: dueDateStr,
      description: params.description,
      externalReference: params.externalReference,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.description ?? "Erro ao criar cobrança PIX")

  // Busca QR Code da cobrança
  const qrRes = await fetch(`${BASE}/payments/${data.id}/pixQrCode`, { headers: headers() })
  const qrData = await qrRes.json()

  return {
    paymentId: data.id,
    pixCode: qrData.payload ?? "",
    pixQrCode: qrData.encodedImage ?? "",
  }
}

// ─── Transferência PIX ao vendedor ───────────────────────

function detectPixKeyType(key: string): string {
  const clean = key.replace(/\D/g, "")
  if (/^[^@]+@[^@]+\.[^@]+$/.test(key)) return "EMAIL"
  if (clean.length === 11) return "CPF"
  if (clean.length === 14) return "CNPJ"
  if (/^\+?\d{10,13}$/.test(key.replace(/\s/g, ""))) return "PHONE"
  return "EVP"
}

export async function sendPixToSeller(params: {
  pixKey: string
  amount: number
  description: string
  externalReference: string
}) {
  const res = await fetch(`${BASE}/transfers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      value: params.amount,
      pixAddressKey: params.pixKey,
      pixAddressKeyType: detectPixKeyType(params.pixKey),
      description: params.description,
      externalReference: params.externalReference,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.description ?? "Erro ao enviar PIX")
  return data
}
