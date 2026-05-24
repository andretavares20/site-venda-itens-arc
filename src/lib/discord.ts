const DISCORD_API = "https://discord.com/api/v10"

function botHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  }
}

async function createDMChannel(discordId: string): Promise<string | null> {
  const res = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({ recipient_id: discordId }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.id
}

export async function sendDiscordDM(discordId: string, message: string): Promise<boolean> {
  try {
    const channelId = await createDMChannel(discordId)
    if (!channelId) return false
    const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify({ content: message }),
    })
    return res.ok
  } catch {
    return false
  }
}

type EmbedField = { name: string; value: string; inline?: boolean }
type Embed = {
  title?: string
  color?: number
  fields?: EmbedField[]
  timestamp?: string
  footer?: { text: string }
}

export async function sendAdminAlert(embed: Embed): Promise<void> {
  try {
    await fetch(`${DISCORD_API}/channels/${process.env.DISCORD_ALERT_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch {}
}

// ── Mensagens prontas ──────────────────────────────────────────────

export function dmPagamentoConfirmado(buyerName: string, itemName: string): string {
  return `✅ Olá, **${buyerName}**!\n\nSeu pagamento foi confirmado! O item **${itemName}** foi comprado com sucesso.\n\nNossa equipe vai entrar em contato para combinar a entrega dentro do jogo. Fique atento às mensagens! 🎮`
}

export function dmAnuncioRecebido(sellerName: string): string {
  return `👋 Olá, **${sellerName}**!\n\nSeu anúncio foi recebido pela **DropBay** e está em análise. Em breve ficará visível na loja para os compradores.\n\nFique atento às mensagens por aqui! 🎮`
}

export function dmAnuncioAprovado(sellerName: string, itemName: string): string {
  return `✅ Boa notícia, **${sellerName}**!\n\nSeu item **${itemName}** foi recebido pela equipe DropBay e já está disponível no marketplace.\n\nAssim que houver uma venda, entraremos em contato para combinar os detalhes. 🚀`
}

export function dmPedidoPago(sellerName: string, itemName: string): string {
  return `💰 **${sellerName}**, seu item foi vendido!\n\nO item **${itemName}** foi comprado e o pagamento foi confirmado. Nossa equipe vai entrar em contato para combinar a entrega dentro do jogo.\n\nFique de olho nas mensagens! 🎮`
}

export function dmEntregaConfirmada(sellerName: string, value: string): string {
  return `🎉 Tudo certo, **${sellerName}**!\n\nA entrega do seu item foi confirmada e o valor de **R$ ${value}** foi liberado para você.\n\nObrigado por vender na **DropBay**! 💚`
}

export function embedNovoAnuncio(params: {
  sellerName: string
  sellerDiscord: string | null
  items: { name: string; quantity: number; price: number }[]
  listingId: string
}): Embed {
  const { sellerName, sellerDiscord, items, listingId } = params
  return {
    color: 0x0071e3,
    title: "📦 Novo anúncio publicado",
    fields: [
      { name: "Vendedor", value: sellerDiscord ? `<@${sellerDiscord}> (${sellerName})` : sellerName, inline: true },
      { name: "ID", value: `#${listingId.slice(-8).toUpperCase()}`, inline: true },
      { name: "Itens", value: items.map((i) => `• ${i.name} x${i.quantity} — R$ ${i.price.toFixed(2)}`).join("\n") },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "DropBay · Marketplace Arc Raiders" },
  }
}

export function embedNovaTroca(params: {
  tradeId: string
  ownerName: string
  ownerDiscord: string | null
  proposerName: string
  proposerDiscord: string | null
  ownerItems: { name: string; quantity: number }[]
  proposerItems: { name: string; quantity: number }[]
}): Embed {
  const { tradeId, ownerName, ownerDiscord, proposerName, proposerDiscord, ownerItems, proposerItems } = params
  return {
    color: 0xFF9F0A,
    title: "🔄 Troca aguardando recolhimento",
    fields: [
      { name: "Jogador A", value: ownerDiscord ? `<@${ownerDiscord}> (${ownerName})` : ownerName, inline: true },
      { name: "Jogador B", value: proposerDiscord ? `<@${proposerDiscord}> (${proposerName})` : proposerName, inline: true },
      { name: "ID", value: `#${tradeId.slice(-8).toUpperCase()}`, inline: true },
      { name: "Itens de A", value: ownerItems.map((i) => `• ${i.name} x${i.quantity}`).join("\n") || "—" },
      { name: "Itens de B", value: proposerItems.map((i) => `• ${i.name} x${i.quantity}`).join("\n") || "—" },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "DropBay · Marketplace Arc Raiders" },
  }
}

export function dmNovaPropostaRecebida(ownerName: string, proposerName: string, itemNames: string): string {
  return `🔔 Olá, **${ownerName}**!\n\nVocê recebeu uma nova proposta de troca de **${proposerName}**!\n\nItens oferecidos: **${itemNames}**\n\nAcesse o site para ver os detalhes e aceitar ou recusar a proposta. 🎮`
}

export function dmPropostaEnviada(proposerName: string): string {
  return `✅ Olá, **${proposerName}**!\n\nSua proposta de troca foi enviada com sucesso! O dono do anúncio será notificado e você receberá uma resposta em breve.\n\nFique atento às mensagens! 🎮`
}

export function dmPropostaAceita(userName: string): string {
  return `🤝 Boa notícia, **${userName}**!\n\nSua proposta de troca foi **aceita**! Acesse o site para confirmar a troca e finalizar o processo.\n\nVocê tem 24 horas para confirmar. ⏰`
}

export function dmAguardandoRecolhimento(userName: string): string {
  return `✅ **${userName}**, tudo confirmado!\n\nAmbos os jogadores confirmaram a troca. Nossa equipe vai entrar em contato em breve pelo Discord para combinar a retirada dos itens dentro do jogo.\n\nFique atento às mensagens! 🎮`
}

export function dmTrocaAnunciada(userName: string): string {
  return `🔄 Olá, **${userName}**!\n\nSua troca foi anunciada na **DropBay**. Assim que outro jogador fizer uma proposta, você receberá uma notificação por aqui.\n\nFique atento! 🎮`
}

export function dmEncomendaCriada(userName: string, itemName: string): string {
  return `📋 Olá, **${userName}**!\n\nSua encomenda de **${itemName}** foi registrada na **DropBay**. Assim que um vendedor fizer uma proposta, entraremos em contato.\n\nFique atento às mensagens! 🎮`
}

export function dmTrocaConcluida(userName: string): string {
  return `🎉 Tudo certo, **${userName}**!\n\nSua troca foi concluída com sucesso. Os itens foram entregues pelos dois lados.\n\nObrigado por usar a **DropBay**! 💚`
}

export function embedNovaTrocaAnunciada(params: {
  tradeId: string
  ownerName: string
  ownerDiscord: string | null
  offerItems: { name: string; quantity: number }[]
  wantItems: { name: string; quantity: number }[]
}): Embed {
  const { tradeId, ownerName, ownerDiscord, offerItems, wantItems } = params
  return {
    color: 0xFF9F0A,
    title: "🔄 Nova troca anunciada",
    fields: [
      { name: "Jogador", value: ownerDiscord ? `<@${ownerDiscord}> (${ownerName})` : ownerName, inline: true },
      { name: "ID", value: `#${tradeId.slice(-8).toUpperCase()}`, inline: true },
      { name: "Oferece", value: offerItems.map((i) => `• ${i.name} x${i.quantity}`).join("\n") || "—" },
      { name: "Quer", value: wantItems.map((i) => `• ${i.name} x${i.quantity}`).join("\n") || "Qualquer coisa" },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "DropBay · Marketplace Arc Raiders" },
  }
}

export function embedNovaEncomenda(params: {
  encomendaId: string
  buyerName: string
  buyerDiscord: string | null
  productName: string
  quantity: number
  maxPrice: number | null
}): Embed {
  const { encomendaId, buyerName, buyerDiscord, productName, quantity, maxPrice } = params
  return {
    color: 0x9B59B6,
    title: "📋 Nova encomenda",
    fields: [
      { name: "Comprador", value: buyerDiscord ? `<@${buyerDiscord}> (${buyerName})` : buyerName, inline: true },
      { name: "ID", value: `#${encomendaId.slice(-8).toUpperCase()}`, inline: true },
      { name: "Item", value: productName, inline: true },
      { name: "Quantidade", value: String(quantity), inline: true },
      { name: "Preço máximo", value: maxPrice ? `R$ ${maxPrice.toFixed(2)}` : "Não informado", inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "DropBay · Marketplace Arc Raiders" },
  }
}

export function embedPedidoPago(params: {
  buyerName: string
  sellerName: string
  sellerDiscord: string | null
  itemName: string
  total: number
}): Embed {
  const { buyerName, sellerName, sellerDiscord, itemName, total } = params
  return {
    color: 0x30d158,
    title: "💸 Pedido pago — entregar item",
    fields: [
      { name: "Comprador", value: buyerName, inline: true },
      { name: "Vendedor", value: sellerDiscord ? `<@${sellerDiscord}> (${sellerName})` : sellerName, inline: true },
      { name: "Item", value: itemName },
      { name: "Total", value: `R$ ${total.toFixed(2)}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "DropBay · Marketplace Arc Raiders" },
  }
}
