import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from "discord.js"

let client: Client | null = null

async function getClient(): Promise<Client> {
  if (client?.isReady()) return client

  client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] })
  await client.login(process.env.DISCORD_BOT_TOKEN)
  await new Promise<void>((resolve) => client!.once("ready", () => resolve()))
  return client
}

// Envia DM para um usuário pelo Discord ID
export async function sendDiscordDM(discordId: string, message: string): Promise<boolean> {
  try {
    const c = await getClient()
    const user = await c.users.fetch(discordId)
    await user.send(message)
    return true
  } catch {
    return false
  }
}

// Posta alerta no canal admin
export async function sendAdminAlert(embed: EmbedBuilder): Promise<void> {
  try {
    const c = await getClient()
    const channel = await c.channels.fetch(process.env.DISCORD_ALERT_CHANNEL_ID!)
    if (channel instanceof TextChannel) {
      await channel.send({ embeds: [embed] })
    }
  } catch {}
}

// ── Mensagens prontas ──────────────────────────────────────────────

export function dmAnuncioRecebido(sellerName: string): string {
  return `👋 Olá, **${sellerName}**!\n\nRecebemos seu anúncio na **DropBay**. Nossa equipe vai entrar em contato em breve para combinar a coleta do item dentro do jogo.\n\nFique atento às mensagens por aqui! 🎮`
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
}): EmbedBuilder {
  const { sellerName, sellerDiscord, items, listingId } = params
  return new EmbedBuilder()
    .setColor(0x0071e3)
    .setTitle("📦 Novo anúncio — aguardando coleta")
    .addFields(
      { name: "Vendedor", value: sellerDiscord ? `<@${sellerDiscord}> (${sellerName})` : sellerName, inline: true },
      { name: "ID", value: `#${listingId.slice(-8).toUpperCase()}`, inline: true },
      { name: "Itens", value: items.map((i) => `• ${i.name} x${i.quantity} — R$ ${i.price.toFixed(2)}`).join("\n") }
    )
    .setTimestamp()
    .setFooter({ text: "DropBay · Marketplace Arc Raiders" })
}

export function embedNovaTroca(params: {
  tradeId: string
  ownerName: string
  ownerDiscord: string | null
  proposerName: string
  proposerDiscord: string | null
  ownerItems: { name: string; quantity: number }[]
  proposerItems: { name: string; quantity: number }[]
}): EmbedBuilder {
  const { tradeId, ownerName, ownerDiscord, proposerName, proposerDiscord, ownerItems, proposerItems } = params
  return new EmbedBuilder()
    .setColor(0xFF9F0A)
    .setTitle("🔄 Troca aguardando recolhimento")
    .addFields(
      { name: "Jogador A", value: ownerDiscord ? `<@${ownerDiscord}> (${ownerName})` : ownerName, inline: true },
      { name: "Jogador B", value: proposerDiscord ? `<@${proposerDiscord}> (${proposerName})` : proposerName, inline: true },
      { name: "ID", value: `#${tradeId.slice(-8).toUpperCase()}`, inline: true },
      { name: "Itens de A", value: ownerItems.map((i) => `• ${i.name} x${i.quantity}`).join("\n") || "—" },
      { name: "Itens de B", value: proposerItems.map((i) => `• ${i.name} x${i.quantity}`).join("\n") || "—" },
    )
    .setTimestamp()
    .setFooter({ text: "DropBay · Marketplace Arc Raiders" })
}

export function dmTrocaConcluida(userName: string): string {
  return `🎉 Tudo certo, **${userName}**!\n\nSua troca foi concluída com sucesso. Os itens foram entregues pelos dois lados.\n\nObrigado por usar a **DropBay**! 💚`
}

export function embedPedidoPago(params: {
  buyerName: string
  sellerName: string
  sellerDiscord: string | null
  itemName: string
  total: number
}): EmbedBuilder {
  const { buyerName, sellerName, sellerDiscord, itemName, total } = params
  return new EmbedBuilder()
    .setColor(0x30d158)
    .setTitle("💸 Pedido pago — entregar item")
    .addFields(
      { name: "Comprador", value: buyerName, inline: true },
      { name: "Vendedor", value: sellerDiscord ? `<@${sellerDiscord}> (${sellerName})` : sellerName, inline: true },
      { name: "Item", value: itemName, inline: false },
      { name: "Total", value: `R$ ${total.toFixed(2)}`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "DropBay · Marketplace Arc Raiders" })
}
