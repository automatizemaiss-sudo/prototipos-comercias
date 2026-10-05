"use client";

import Link from "next/link";
import { RULES } from "@/data/menu";
import CartLines from "@/components/CartLines";
import CouponBox, { useCoupon } from "@/components/CouponBox";
import { money, savingsVsIfood } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export default function Sacola() {
  const { items, subtotal, ready } = useStore();
  const { discount } = useCoupon();
  const saved = savingsVsIfood(items, "pickup", 0);
  const belowMin = subtotal < RULES.minOrder;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg bg-white pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-2">
        <Link href="/" className="grid h-11 w-11 place-items-center text-xl" aria-label="Voltar">
          ←
        </Link>
        <h1 className="text-lg font-extrabold">Sua sacola</h1>
      </header>

      {ready && items.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-5xl">🛍️</p>
          <p className="mt-3 font-semibold">Sua sacola está vazia</p>
          <Link href="/" className="btn-primary mt-5 inline-flex items-center">
            Ver cardápio
          </Link>
        </div>
      ) : (
        <div className="space-y-4 px-4 pt-2">
          <CartLines />
          <CouponBox />
          <div className="space-y-1 rounded-xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Desconto</span>
                <span>−{money(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Frete</span>
              <span>calculado no checkout</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-extrabold">
              <span>Total</span>
              <span>{money(subtotal - discount)}</span>
            </div>
          </div>
          {saved > 0 && (
            <p className="rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-800">
              🎉 Você economizou {money(saved)} em relação ao iFood
            </p>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-3">
          <div className="mx-auto max-w-lg">
            {belowMin && <p className="mb-2 text-center text-sm text-red-600">Pedido mínimo: {money(RULES.minOrder)}</p>}
            {belowMin ? (
              <button className="btn-primary w-full" disabled>
                Continuar
              </button>
            ) : (
              <Link href="/checkout" className="btn-primary flex w-full items-center justify-center">
                Continuar para o pagamento
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
