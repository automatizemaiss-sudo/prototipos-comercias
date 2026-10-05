"use client";

import { useState } from "react";
import { COUPONS, couponDiscount, money, type Coupon } from "@/lib/pricing";
import { countsAsSale } from "@/lib/orders";
import { useStore } from "@/lib/store";

const digits = (s: string) => s.replace(/\D/g, "");

/** Regra de "primeira compra": o WhatsApp não pode ter pedido pago/confirmado antes. */
export function useCoupon() {
  const { couponCode, orders, profile, subtotal } = useStore();
  const coupon = COUPONS.find((c) => c.code === couponCode) ?? null;
  const phone = profile?.phone ? digits(profile.phone) : "";
  return { coupon, discount: coupon ? couponDiscount(coupon, subtotal) : 0, ordersByPhone: (p: string) => orders.filter((o) => countsAsSale(o) && digits(o.customer.phone) === digits(p || phone)) };
}

export function validateCoupon(c: Coupon, phone: string, hasPrevious: (phone: string) => boolean): string | null {
  if (c.firstOrderOnly) {
    if (digits(phone).length < 10) return "Informe seu WhatsApp no checkout para validar o cupom.";
    if (hasPrevious(phone)) return "Cupom válido apenas na primeira compra.";
  }
  return null;
}

export default function CouponBox({ phone }: { phone?: string }) {
  const { couponCode, setCouponCode, subtotal } = useStore();
  const { ordersByPhone } = useCoupon();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const applied = COUPONS.find((c) => c.code === couponCode);

  function apply() {
    const c = COUPONS.find((x) => x.code === text.trim().toUpperCase());
    if (!c) return setMsg("Cupom inválido.");
    // Sem WhatsApp ainda (sacola): aceita; a regra é revalidada no checkout.
    const err = phone ? validateCoupon(c, phone, (p) => ordersByPhone(p).length > 0) : null;
    if (err) return setMsg(err);
    setCouponCode(c.code);
    setMsg(null);
    setText("");
  }

  if (applied)
    return (
      <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-3 text-sm text-green-800">
        <span>
          🎟️ <b>{applied.code}</b> aplicado (−{money(couponDiscount(applied, subtotal))})
        </span>
        <button className="font-semibold underline" onClick={() => setCouponCode(null)}>
          Remover
        </button>
      </div>
    );
  return (
    <div>
      <div className="flex gap-2">
        <input className="input uppercase" placeholder="Cupom de desconto" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary" onClick={apply} disabled={!text.trim()}>
          Aplicar
        </button>
      </div>
      {msg && <p className="mt-1 text-sm text-red-600">{msg}</p>}
    </div>
  );
}
