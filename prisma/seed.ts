import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

type ArcItem = {
  id: string
  name: string
  type: string
  rarity: string
  imageFilename: string
  isBlueprint: boolean
}

const rarityPrice: Record<string, [number, number]> = {
  Common:    [5,    25],
  Uncommon:  [25,   80],
  Rare:      [80,   250],
  Epic:      [250,  600],
  Legendary: [600,  1500],
}

const rarityStock: Record<string, [number, number]> = {
  Common:    [50, 100],
  Uncommon:  [20,  50],
  Rare:      [5,   20],
  Epic:      [2,    8],
  Legendary: [1,    3],
}

const rarityDescription: Record<string, string> = {
  Common:    "Item comum encontrado nas zonas de Arc Raiders.",
  Uncommon:  "Item incomum com boa utilidade nas missões.",
  Rare:      "Item raro e valioso, difícil de encontrar nas zonas.",
  Epic:      "Item épico de alta qualidade, extremamente procurado.",
  Legendary: "Item lendário — um dos mais raros e poderosos do jogo.",
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPrice(min: number, max: number) {
  const val = Math.random() * (max - min) + min
  return Math.round(val * 100) / 100
}

async function main() {
  const jsonPath = path.join(__dirname, "items.json")

  if (!fs.existsSync(jsonPath)) {
    console.error("❌ Arquivo prisma/items.json não encontrado!")
    console.error("   Salve o JSON dos itens em prisma/items.json e rode novamente.")
    process.exit(1)
  }

  const raw = fs.readFileSync(jsonPath, "utf-8")
  const data = JSON.parse(raw)
  const items: ArcItem[] = data.items ?? data

  // Filtra apenas itens sem imagem
  const filtered = items.filter((i) => i.imageFilename)

  console.log(`📦 Importando ${filtered.length} itens...`)

  let created = 0
  let skipped = 0

  for (const item of filtered) {
    const priceRange = rarityPrice[item.rarity] ?? rarityPrice.Common
    const stockRange = rarityStock[item.rarity] ?? rarityStock.Common
    const desc = rarityDescription[item.rarity] ?? rarityDescription.Common

    const price = randomPrice(priceRange[0], priceRange[1])
    const stock = randomBetween(stockRange[0], stockRange[1])

    try {
      await prisma.product.upsert({
        where: { slug: item.id },
        update: { rarity: item.rarity },
        create: {
          slug:        item.id,
          name:        item.name,
          description: `${desc} Tipo: ${item.type}.`,
          price,
          image:       item.imageFilename,
          stock,
          category:    item.type,
          rarity:      item.rarity,
          active:      true,
        },
      })
      created++
    } catch {
      skipped++
    }
  }

  console.log(`✅ ${created} itens importados, ${skipped} ignorados.`)
  await prisma.$disconnect()
}

main()
