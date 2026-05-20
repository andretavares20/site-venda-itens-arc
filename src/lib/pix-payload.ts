function field(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0")
  return `${id}${len}${value}`
}

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

export function generatePixPayload(params: {
  pixKey: string
  amount: number
  name: string
  city?: string
  txid?: string
}): string {
  const name = params.name.slice(0, 25).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9 ]/g, "")
  const city = (params.city ?? "Brasil").slice(0, 15).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9 ]/g, "")
  const txid = (params.txid ?? "dropbay").slice(0, 25).replace(/[^a-zA-Z0-9]/g, "")
  const amount = params.amount.toFixed(2)

  const merchantAccount = field("26",
    "0014br.gov.bcb.pix" +
    field("01", params.pixKey)
  )

  const additionalData = field("62", field("05", txid))

  const payload =
    "000201" +                             // Payload format indicator
    "010212" +                             // Point of initiation (uma única vez)
    merchantAccount +                      // Merchant account info
    "52040000" +                           // Merchant category code
    "5303986" +                            // Currency BRL
    field("54", amount) +                  // Amount
    "5802BR" +                             // Country
    field("59", name) +                    // Merchant name
    field("60", city) +                    // Merchant city
    additionalData +                       // Additional data
    "6304"                                 // CRC placeholder

  return payload + crc16(payload)
}
