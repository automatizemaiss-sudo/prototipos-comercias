import { GROUPS, RULES, RESTAURANT, getProduct, type GroupRef, type Product } from "@/data/menu";

export type Selections = Record<string, Record<string, number>>; // groupId -> optionId -> quantidade

export type CartItem = {
  key: string;
  productId: string;
  qty: number;
  selections: Selections;
  notes: string;
};

export const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const round2 = (v: number) => Math.round(v * 100) / 100;

export const groupCount = (sel: Selections, groupId: string) =>
  Object.values(sel[groupId] ?? {}).reduce((a, b) => a + b, 0);

export function optionsTotal(product: Product, sel: Selections) {
  let total = 0;
  for (const ref of product.groups) {
    const group = GROUPS[ref.id];
    for (const [optId, n] of Object.entries(sel[ref.id] ?? {})) {
      total += (group.options.find((x) => x.id === optId)?.price ?? 0) * n;
    }
  }
  return round2(total);
}

export const unitPrice = (product: Product, sel: Selections) => round2(product.price + optionsTotal(product, sel));

export function isGroupValid(ref: GroupRef, sel: Selections) {
  const n = groupCount(sel, ref.id);
  return n >= ref.min && n <= ref.max;
}

export const isSelectionValid = (product: Product, sel: Selections) => product.groups.every((r) => isGroupValid(r, sel));

const SHORT: Record<string, string> = { BASES: "Bases", ACOMPANHAMENTO: "Acomp.", PROTEINAS_2: "Proteínas", PROTEINA_1: "Proteína", ADICIONAIS: "Adicionais", BEBIDAS: "Bebidas", SALADA: "Salada", TAMANHO: "Tamanho", TALHER: "Talher" };

/** Texto das opções escolhidas, agrupado por grupo. */
export function describeOptions(product: Product, sel: Selections) {
  return product.groups
    .map((ref) => {
      const group = GROUPS[ref.id];
      const items = Object.entries(sel[ref.id] ?? {})
        .filter(([, n]) => n > 0)
        .map(([optId, n]) => {
          const name = group.options.find((x) => x.id === optId)?.name ?? optId;
          return n > 1 ? `${n}× ${name}` : name;
        });
      return { group: SHORT[ref.id] ?? group.name, items };
    })
    .filter((g) => g.items.length > 0);
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** Frete: R$ 8 até 3 km; acima disso, grátis. Sem distância (geocodificação falhou) = R$ 8. */
export function deliveryFee(fulfillment: "delivery" | "pickup", km: number | null) {
  if (fulfillment === "pickup") return 0;
  if (km === null) return RULES.deliveryFee;
  return km <= RULES.freeDeliveryBeyondKm ? RULES.deliveryFee : 0;
}

export type Coupon = { code: string; type: "percent" | "fixed"; value: number; firstOrderOnly: boolean };
export const COUPONS: Coupon[] = [{ code: "BEMVINDO", type: "percent", value: 10, firstOrderOnly: true }];

export function couponDiscount(c: Coupon, subtotal: number) {
  return round2(c.type === "percent" ? (subtotal * c.value) / 100 : Math.min(c.value, subtotal));
}

/** Economia vs. iFood: diferença dos itens principais + diferença do frete. */
export function savingsVsIfood(items: CartItem[], fulfillment: "delivery" | "pickup", fee: number) {
  let s = 0;
  for (const it of items) {
    const p = getProduct(it.productId);
    if (p) s += (p.ifoodPrice - p.price) * it.qty;
  }
  if (fulfillment === "delivery") s += Math.max(0, RULES.ifoodDeliveryFee - fee);
  return round2(s);
}

export const restaurantCoords = () => ({ lat: RESTAURANT.lat, lng: RESTAURANT.lng });
