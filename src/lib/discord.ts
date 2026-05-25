const DISCORD_API = "https://discord.com/api/v10"

// VIEW_CHANNEL + SEND_MESSAGES + READ_MESSAGE_HISTORY
const CHANNEL_PERMS = "68608"

function botHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  }
}

// ── Canais privados temporários ────────────────────────────────────

export async function createPrivateChannel(params: {
  name: string
  topic: string
  memberDiscordIds: string[]
  introEmbed: Embed
}): Promise<string | null> {
  const guildId    = process.env.DISCORD_GUILD_ID
  const categoryId = process.env.DISCORD_ORDERS_CATEGORY_ID
  const adminRole  = process.env.DISCORD_ADMIN_ROLE_ID
  if (!guildId || !categoryId || !adminRole) return null

  const permissionOverwrites = [
    { id: guildId,   type: 0, deny:  "1024" },          // @everyone sem acesso
    { id: adminRole, type: 0, allow: CHANNEL_PERMS },    // role admin com acesso
    ...params.memberDiscordIds.map((id) => ({
      id,
      type: 1,
      allow: CHANNEL_PERMS,
    })),
  ]

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({
      name: params.name,
      type: 0,
      parent_id: categoryId,
      topic: params.topic,
      permission_overwrites: permissionOverwrites,
    }),
  })
  if (!res.ok) return null
  const channel = await res.json()

  await fetch(`${DISCORD_API}/channels/${channel.id}/messages`, {
    method: "POST",
    headers: botHeaders(),
    body: JSON.stringify({ embeds: [params.introEmbed] }),
  }).catch(() => {})

  return channel.id as string
}

export async function deleteDiscordChannel(channelId: string): Promise<void> {
  await fetch(`${DISCORD_API}/channels/${channelId}`, {
    method: "DELETE",
    headers: botHeaders(),
  }).catch(() => {})
}

// ── Embeds para canais de pedido e troca ──────────────────────────

export function embedCanalPedido(params: {
  orderId: string
  buyerName: string
  buyerDiscord: string | null
  sellerName: string
  sellerDiscord: string | null
  items: { name: string; quantity: number }[]
}): Embed {
  const { orderId, buyerName, buyerDiscord, sellerName, sellerDiscord, items } = params
  return {
    color: 0x5865F2,
    title: `🛒 Pedido #${orderId}`,
    fields: [
      { name: "Comprador", value: buyerDiscord ? `<@${buyerDiscord}> (${buyerName})` : buyerName, inline: true },
      { name: "Vendedor",  value: sellerDiscord ? `<@${sellerDiscord}> (${sellerName})` : sellerName, inline: true },
      { name: "Itens",     value: items.map((i) => `• ${i.name} x${i.quantity}`).join("\n") },
      { name: "Como proceder", value: "Combinem aqui a entrega do item in-game. Após receber, o comprador confirma no site para liberar o pagamento." },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "DropBay · Canal removido automaticamente após a entrega" },
  }
}

export function embedCanalTroca(params: {
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
    title: `🔄 Troca #${tradeId}`,
    fields: [
      { name: "Jogador A", value: ownerDiscord ? `<@${ownerDiscord}> (${ownerName})` : ownerName, inline: true },
      { name: "Jogador B", value: proposerDiscord ? `<@${proposerDiscord}> (${proposerName})` : proposerName, inline: true },
      { name: "Itens de A", value: ownerItems.map((i) => `• ${i.name} x${i.quantity}`).join("\n") || "—" },
      { name: "Itens de B", value: proposerItems.map((i) => `• ${i.name} x${i.quantity}`).join("\n") || "—" },
      { name: "Como proceder", value: "Combinem aqui a troca dos itens in-game. Após trocar, ambos confirmam no site para concluir." },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "DropBay · Canal removido automaticamente após a conclusão" },
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
    const channelId = process.env.DISCORD_ALERT_CHANNEL_ID
    console.log("[Discord] sendAdminAlert → channel:", channelId)
    const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify({ embeds: [embed] }),
    })
    const body = await res.text()
    console.log("[Discord] sendAdminAlert status:", res.status, body)
  } catch (e) {
    console.error("[Discord] sendAdminAlert error:", e)
  }
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

export function embedCancelamentoPendente(params: {
  listingId: string
  sellerName: string
  sellerDiscord: string | null
  buyerName: string
  items: { name: string; quantity: number }[]
}): Embed {
  const { listingId, sellerName, sellerDiscord, buyerName, items } = params
  return {
    color: 0xFF9F0A,
    title: "⚠️ Cancelamento pendente — pedido pago",
    fields: [
      { name: "Vendedor",  value: sellerDiscord ? `<@${sellerDiscord}> (${sellerName})` : sellerName, inline: true },
      { name: "Comprador", value: buyerName, inline: true },
      { name: "Anúncio",   value: `#${listingId.slice(-8).toUpperCase()}`, inline: true },
      { name: "Itens",     value: items.map((i) => `• ${i.name} x${i.quantity}`).join("\n") },
      { name: "Situação",  value: "O vendedor solicitou cancelamento, mas há um pedido pago em aberto. A administração precisa intervir (reembolso ao comprador ou entrega do item)." },
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
