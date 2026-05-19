export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "")
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false // todos dígitos iguais

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i)
  let first = 11 - (sum % 11)
  if (first >= 10) first = 0
  if (first !== parseInt(clean[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i)
  let second = 11 - (sum % 11)
  if (second >= 10) second = 0
  return second === parseInt(clean[10])
}

export function formatCPF(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 11)
  return clean
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}
