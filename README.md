# ArcStore

Marketplace de itens in-game para Arc Raiders. Permite compra, venda e troca de itens entre jogadores com segurança e transparência.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Banco de dados | PostgreSQL (Neon) |
| ORM | Prisma 5 |
| Autenticação | NextAuth.js v5 |
| Pagamento | Mercado Pago (PIX) |
| Estado do carrinho | Zustand |
| Hospedagem | Vercel |

---

## Configuração

### 1. Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
DATABASE_URL="postgresql://..."         # Neon PostgreSQL
NEXTAUTH_SECRET="..."                   # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
MP_ACCESS_TOKEN="..."                   # Mercado Pago Access Token
NEXT_PUBLIC_URL="http://localhost:3000"
```

### 2. Banco de dados

```bash
npx prisma db push
npx prisma generate
npx prisma db seed   # importa os 560 itens (requer prisma/items.json)
```

### 3. Rodar localmente

```bash
npm install
npm run dev
```

### 4. Criar conta admin

Registre-se normalmente em `/registro` e execute no Neon SQL Editor:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'seu@email.com';
```

---

## Diagrama de Casos de Uso

### Atores

| Ator | Descrição |
|---|---|
| **Visitante** | Não autenticado |
| **Usuário** | Autenticado — comprador e/ou vendedor |
| **Admin** | Papel administrativo — administra a plataforma |

---

### UC-01 a UC-06 — Acesso e autenticação

| # | Caso de uso | Ator | Rota |
|---|---|---|---|
| UC-01 | Visualizar página inicial | Visitante | `/` |
| UC-02 | Fazer cadastro | Visitante | `/registro` |
| UC-03 | Fazer login | Visitante | `/login` |
| UC-04 | Fazer logout | Usuário | navbar |
| UC-05 | Ver minha conta | Usuário | `/minha-conta` |
| UC-06 | Configurar chave PIX para recebimentos | Usuário | `/minha-conta/perfil` |

---

### UC-07 a UC-12 — Catálogo e carrinho

| # | Caso de uso | Ator | Rota |
|---|---|---|---|
| UC-07 | Filtrar itens por categoria | Visitante | `/?categoria=Pistol` |
| UC-08 | Buscar item pelo nome | Visitante | `/?busca=...` |
| UC-09 | Ver página de produto com anúncios disponíveis | Visitante | `/produto/[slug]` |
| UC-10 | Adicionar item ao carrinho | Usuário | card ou página do produto |
| UC-11 | Alterar quantidade no carrinho | Usuário | drawer do carrinho |
| UC-12 | Remover item do carrinho | Usuário | drawer do carrinho |

---

### UC-13 a UC-17 — Compra e pagamento

| # | Caso de uso | Ator | Rota |
|---|---|---|---|
| UC-13 | Ir ao checkout | Usuário | `/checkout` |
| UC-14 | Gerar código PIX | Usuário | botão no checkout |
| UC-15 | Copiar código PIX (copia e cola) | Usuário | tela do QR Code |
| UC-16 | Aguardar confirmação automática via polling (4s) | Usuário | tela do QR Code |
| UC-17 | Ser redirecionado após pagamento confirmado | Usuário | automático → `/pedido/[id]` |

---

### UC-18 a UC-23 — Anúncios de venda (vendedor)

| # | Caso de uso | Ator | Rota |
|---|---|---|---|
| UC-18 | Criar anúncio de venda com múltiplos itens | Usuário | `/anunciar` |
| UC-19 | Buscar item pelo nome com preço sugerido por raridade | Usuário | campo de busca em `/anunciar` |
| UC-20 | Definir preço individual por item | Usuário | form em `/anunciar` |
| UC-21 | Ver meus anúncios e status | Usuário | `/minha-conta/anuncios` |
| UC-22 | Cancelar anúncio PENDENTE gratuitamente | Usuário | botão cancelar |
| UC-23 | Cancelar anúncio DISPONÍVEL com taxa de 10% via PIX | Usuário | dialog → QR Code da taxa |

---

### UC-24 a UC-32 — Administração

| # | Caso de uso | Ator | Rota |
|---|---|---|---|
| UC-24 | Ver dashboard com métricas | Admin | `/admin` |
| UC-25 | Ver fila de anúncios pendentes | Admin | `/admin/anuncios` |
| UC-26 | Aprovar anúncio após receber item in-game | Admin | botão "Item recebido — Publicar" |
| UC-27 | Rejeitar anúncio com observação para o vendedor | Admin | botão "Rejeitar" + campo de nota |
| UC-28 | Ver todos os pedidos | Admin | `/admin/pedidos` |
| UC-29 | Atualizar status do pedido | Admin | select de status |
| UC-30 | Ver chave PIX do vendedor e valor líquido a transferir | Admin | bloco após marcar ENTREGUE |
| UC-31 | Confirmar que PIX foi enviado ao vendedor | Admin | botão "Confirmar PIX enviado" |
| UC-32 | Gerenciar catálogo de itens | Admin | `/admin/produtos` |

---

### UC-33 a UC-46 — Sistema de Trocas

| # | Caso de uso | Ator | Rota |
|---|---|---|---|
| UC-33 | Buscar item disponível para troca com autocomplete | Visitante | `/trocas` |
| UC-34 | Ver todos os anúncios de troca abertos | Visitante | `/trocas` |
| UC-35 | Criar anúncio de troca com itens que oferece | Usuário | `/trocas/nova` |
| UC-36 | Especificar itens desejados em troca (opcional) | Usuário | `/trocas/nova` |
| UC-37 | Deixar troca aberta a qualquer proposta | Usuário | campo "quer" vazio em `/trocas/nova` |
| UC-38 | Ver detalhes de uma troca e propostas recebidas | Usuário | `/trocas/[id]` |
| UC-39 | Fazer proposta com um ou mais itens | Usuário | formulário em `/trocas/[id]` |
| UC-40 | Aceitar proposta (recusa automática das demais) | Usuário (dono) | botão "Aceitar" |
| UC-41 | Recusar proposta individualmente | Usuário (dono) | botão "Recusar" |
| UC-42 | Cancelar proposta enviada antes de ser aceita | Usuário (proponente) | botão "Cancelar proposta" |
| UC-43 | Confirmar que troca foi realizada in-game | Usuário | botão "Confirmar troca feita" |
| UC-44 | Cancelar anúncio de troca | Usuário (dono) | dialog de confirmação |
| UC-45 | Abrir reclamação após troca aceita | Usuário | botão "Reclamar" |
| UC-46 | Ver minhas trocas e status | Usuário | `/minha-conta/trocas` |

---

## Fluxo de compra e venda (escrow manual)

```
Vendedor cria anúncio em /anunciar
         ↓
Admin recebe notificação → contata vendedor in-game → pega os itens
         ↓
Admin publica anúncio (DISPONIVEL) → aparece na loja
         ↓
Comprador adiciona ao carrinho → vai ao checkout → gera PIX
         ↓
Pagamento confirmado → polling automático detecta → tela de sucesso
         ↓
Admin entrega item in-game → marca pedido como ENTREGUE
         ↓
Tela admin exibe: chave PIX do vendedor + valor líquido (total − 10%)
         ↓
Admin faz PIX manualmente ao vendedor → confirma sellerPaid = true
```

## Fluxo de trocas

```
Usuário A cria troca: oferece [X] / quer [Y] ou qualquer proposta
         ↓
Usuário B busca por item X em /trocas → encontra o anúncio de A
         ↓
B faz proposta com seus itens em /trocas/[id]
         ↓
A aceita a proposta → timer de 24h inicia → demais propostas recusadas
         ↓
A e B fazem a troca in-game
         ↓
Ambos confirmam no site → CONCLUÍDA imediatamente
         ↓ (alternativa)
Ninguém reclama em 24h → Cron Job conclui automaticamente
```

## Cancelamento de anúncio de venda

```
Status PENDENTE_ENTREGA → cancelamento gratuito (item nunca foi entregue)
Status DISPONIVEL       → taxa de 10% do valor anunciado cobrada via PIX
                          Polling detecta pagamento → status CANCELADO
                          Admin devolve item in-game ao vendedor
```

---

## Branches

| Branch | Descrição |
|---|---|
| `main` | Base inicial do projeto |
| `feat/marketplace` | Sistema de compra/venda com escrow manual |
| `feat/sistema-trocas` | Sistema de trocas gratuitas peer-to-peer |
