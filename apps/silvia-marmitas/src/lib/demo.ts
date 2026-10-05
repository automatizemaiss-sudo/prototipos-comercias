import { PRODUCTS, RULES } from "@/data/menu";
import { round2 } from "@/lib/pricing";
import type { Order, PaymentMethod } from "@/lib/orders";

const NAMES = ["João Silva", "Maria Souza", "Carlos Lima", "Ana Paula", "Pedro Alves", "Fernanda Costa", "Lucas Rocha", "Juliana Dias", "Rafael Martins", "Camila Ribeiro", "Bruno Teixeira", "Patrícia Gomes"];
const STREETS = ["Rua das Flores", "Rua Pernambuco", "Av. Visconde de Mauá", "Rua Santos Dumont", "Rua Ceará"];

/** Gerador pseudoaleatório determinístico: os mesmos pedidos fictícios a cada carregamento. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** ~40 pedidos fictícios nos últimos 30 dias (is_demo) para o dashboard não ficar vazio. */
export function demoOrders(now = new Date()): Order[] {
  const r = rng(42);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const mains = PRODUCTS.filter((p) => p.category !== "bebidas");
  return Array.from({ length: 40 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(r() * 30));
    d.setHours(11 + Math.floor(r() * 4), Math.floor(r() * 60), 0, 0);
    if (d > now) d.setDate(d.getDate() - 1);
    const lines = Array.from({ length: 1 + Math.floor(r() * 2) }, () => {
      const p = pick(mains);
      const q = r() < 0.2 ? 2 : 1;
      return { name: p.name, quantity: q, options: [], notes: "", unit_price: p.price, line_total: round2(p.price * q) };
    });
    const subtotal = round2(lines.reduce((s, l) => s + l.line_total, 0));
    const fulfillment = r() < 0.7 ? "delivery" : "pickup";
    const fee = fulfillment === "delivery" ? (r() < 0.8 ? RULES.deliveryFee : 0) : 0;
    const method: PaymentMethod = pick(["pix", "pix", "pix", "card", "cash"]);
    return {
      id: `demo-${i}`,
      number: 1000 + i,
      created_at: d.toISOString(),
      customer: { name: pick(NAMES), phone: "(42) 99999-0000", address: fulfillment === "delivery" ? { cep: "", street: pick(STREETS), number: String(10 + Math.floor(r() * 400)), complement: "", neighborhood: "Nova Rússia", city: "Ponta Grossa", reference: "" } : undefined },
      fulfillment,
      distance_km: null,
      items: lines,
      subtotal,
      discount: 0,
      delivery_fee: fee,
      total: round2(subtotal + fee),
      savings: 0,
      coupon_code: null,
      payment_method: method,
      change_for: null,
      status: method === "cash" ? "confirmed" : "paid",
      is_demo: true,
    } satisfies Order;
  });
}
