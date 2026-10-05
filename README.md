# Protótipos comerciais

Monorepo de protótipos para reuniões de venda. Veja `CLAUDE.md` para as convenções.

```bash
npm install            # na raiz
npm run dev            # sobe apps/silvia-marmitas em http://localhost:3000
npm run build
```

## apps/silvia-marmitas
Cardápio digital + checkout + dashboard. Roda 100% sem backend externo.

- `/` cardápio · `/sacola` · `/checkout` · `/pedido/[id]` · `/admin`
- Cardápio, preços e complementos: `apps/silvia-marmitas/src/data/menu.ts` (editar só esse arquivo).
- Pedidos e dados do cliente ficam no `localStorage` do navegador. O `/admin` mostra ~40 pedidos fictícios + os feitos no aparelho.
- **Pagamento simulado:** Pix mostra QR Code e confirma sozinho em ~8 s; cartão abre uma tela de pagamento falsa; dinheiro confirma na hora.
- **WhatsApp/n8n:** ao confirmar, `POST /api/order-webhook` envia o payload (com as duas mensagens prontas) para `N8N_ORDER_WEBHOOK_URL`. Se vazio, só faz log no terminal.
- Senha do `/admin`: `ADMIN_PASSWORD` (padrão `silvia123`).
- Variáveis: ver `apps/silvia-marmitas/.env.example` (todas opcionais).

### Deploy na Vercel
Importar o repositório, definir **Root Directory = `apps/silvia-marmitas`**, e (opcional) cadastrar as variáveis do `.env.example`.

### Pendências (TODO)
- Endereço/coordenadas e WhatsApp reais do restaurante (`menu.ts` / variáveis `NEXT_PUBLIC_RESTAURANT_*`).
- Confirmar se pode repetir proteína (`allowRepeat` em `PROTEINAS_2`).
- Fotos das bebidas (iFood retornou 403): hoje usam placeholder em `public/pratos/bebida.svg`.
- Preço da Marmita G (Monte) no iFood: hoje R$ 27,90 (promo); cheio R$ 29,90 — editar `ifoodPrice`.
