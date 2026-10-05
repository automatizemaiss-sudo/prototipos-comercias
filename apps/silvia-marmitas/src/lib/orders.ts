import { describeOptions, money, round2, unitPrice, type CartItem } from "@/lib/pricing";
import { getProduct, RULES } from "@/data/menu";

export type PaymentMethod = "pix" | "card" | "cash";
export type OrderStatus = "pending_payment" | "paid" | "confirmed" | "canceled";

export type OrderItem = {
  name: string;
  quantity: number;
  options: { group: string; items: string[] }[];
  notes: string;
  unit_price: number;
  line_total: number;
};

export type Address = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  reference: string;
};

export type Order = {
  id: string;
  number: number;
  created_at: string;
  customer: { name: string; phone: string; cpf?: string; address?: Address };
  fulfillment: "delivery" | "pickup";
  distance_km: number | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  savings: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  change_for: number | null;
  status: OrderStatus;
  is_demo?: boolean;
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };
export const countsAsSale = (o: Order) => o.status === "paid" || o.status === "confirmed";

export function toOrderItems(items: CartItem[]): OrderItem[] {
  return items.flatMap((it) => {
    const p = getProduct(it.productId);
    if (!p) return [];
    const options = describeOptions(p, it.selections);
    const unit = unitPrice(p, it.selections);
    return [{ name: p.name, quantity: it.qty, options, notes: it.notes, unit_price: unit, line_total: round2(unit * it.qty) }];
  });
}

const digits = (s: string) => s.replace(/\D/g, "");
export const phoneWithCountry = (s: string) => (digits(s).startsWith("55") ? digits(s) : "55" + digits(s));

/** Textos prontos para o n8n repassar via uaZapi. */
export function buildMessages(o: Order) {
  const addr = o.customer.address;
  const where =
    o.fulfillment === "pickup"
      ? "Retirada no local"
      : `${addr?.street}, ${addr?.number}${addr?.complement ? " " + addr.complement : ""} — ${addr?.neighborhood}${
          addr?.reference ? ` (ref.: ${addr.reference})` : ""
        }`;
  const pay =
    o.payment_method === "cash"
      ? `Dinheiro${o.change_for ? ` — troco p/ ${money(o.change_for)}` : " — sem troco"}`
      : `${PAYMENT_LABEL[o.payment_method]} (PAGO)`;
  const lines = o.items
    .map((it) => {
      const opts = it.options.map((g) => `  • ${g.group}: ${g.items.join(", ")}`).join("\n");
      return `${it.quantity}x ${it.name}\n${opts}${it.notes ? `\n  • Obs.: ${it.notes}` : ""}`;
    })
    .join("\n\n");
  const restaurant =
    `🛎️ NOVO PEDIDO #${o.number}\nCliente: ${o.customer.name} — ${o.customer.phone}\n${o.fulfillment === "pickup" ? "" : "Entrega: "}${where}\n\n` +
    `${lines}\n\nSubtotal ${money(o.subtotal)}${o.discount ? ` | Desconto -${money(o.discount)}` : ""} | Frete ${money(o.delivery_fee)} | Total ${money(o.total)}\nPagamento: ${pay}`;
  const customer =
    `Oi, ${o.customer.name.split(" ")[0]}! Seu pedido #${o.number} foi confirmado ✅\n` +
    `Total: ${money(o.total)} — previsão ${RULES.etaText}.\n` +
    (o.savings > 0 ? `Você economizou ${money(o.savings)} pedindo direto com a gente 😉\n` : "") +
    `Obrigado por pedir na Silvia Marmitas & Lanches!`;
  return { restaurant, customer };
}

export function buildWebhookPayload(o: Order) {
  return {
    event: "order.confirmed",
    order: {
      id: o.id,
      number: o.number,
      created_at: o.created_at,
      customer: { name: o.customer.name, phone: phoneWithCountry(o.customer.phone), address: o.customer.address ?? null },
      fulfillment: o.fulfillment,
      items: o.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        options: i.options.flatMap((g) => g.items),
        notes: i.notes,
        line_total: i.line_total,
      })),
      subtotal: o.subtotal,
      discount: o.discount,
      delivery_fee: o.delivery_fee,
      total: o.total,
      payment_method: o.payment_method,
      change_for: o.change_for,
    },
    messages: buildMessages(o),
  };
}
