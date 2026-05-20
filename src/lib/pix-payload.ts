function emv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`
}

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

function cleanText(text: string, maxLen: number, fallback: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .slice(0, maxLen) || fallback
  )
}

function cleanPixKey(key: string): string {
  const k = key.trim()
  // CPF formatado: 000.000.000-00 → 00000000000
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(k)) return k.replace(/\D/g, "")
  // CNPJ formatado: 00.000.000/0000-00 → 00000000000000
  if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(k)) return k.replace(/\D/g, "")
  // Telefone sem + → adiciona +55
  if (/^[1-9]\d{10}$/.test(k)) return `+55${k}`
  return k
}

export function generatePixPayload(params: {
  pixKey: string
  amount: number
  name: string
  city?: string
}): string {
  const pixKey = cleanPixKey(params.pixKey)
  const name = cleanText(params.name, 25, "Vendedor")
  const city = cleanText(params.city ?? "Brasil", 15, "Brasil")
  const amount = params.amount.toFixed(2)

  const merchantAccount = emv("26",
    emv("00", "br.gov.bcb.pix") +
    emv("01", pixKey)
  )

  const additionalData = emv("62", emv("05", "***"))

  const payload = [
    emv("00", "01"),      // Payload Format Indicator
    emv("01", "11"),      // Point of Initiation: estático
    merchantAccount,       // Merchant Account Info (chave PIX)
    emv("52", "0000"),    // Merchant Category Code
    emv("53", "986"),     // Moeda: BRL
    emv("54", amount),    // Valor
    emv("58", "BR"),      // País
    emv("59", name),      // Nome do recebedor
    emv("60", city),      // Cidade
    additionalData,        // Dados adicionais
    "6304",               // Placeholder do CRC
  ].join("")

  return payload + crc16(payload)
}
